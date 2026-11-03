<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Form\FormDataCompiler;
use TYPO3\CMS\Backend\Form\FormDataGroup\OnTheFly;
use TYPO3\CMS\Backend\Form\FormDataProvider\DatabaseEffectivePid;
use TYPO3\CMS\Backend\Form\FormDataProvider\DatabasePageRootline;
use TYPO3\CMS\Backend\Form\FormDataProvider\DatabaseParentPageRow;
use TYPO3\CMS\Backend\Form\FormDataProvider\PageTsConfig;
use TYPO3\CMS\Backend\Form\FormDataProvider\SiteResolving;
use TYPO3\CMS\Backend\Form\FormDataProvider\TcaSelectItems;
use TYPO3\CMS\Backend\Form\FormDataProvider\UserTsConfig;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * The event record types a backend user can pick on a page, resolved by FormEngine itself:
 * page TSconfig `TCEFORM.….record_type.keepItems/removeItems/addItems/altLabels`,
 * `itemsProcFunc`, authMode and translated labels.
 *
 * Only the providers needed for the record type select run, so this also works for users
 * who may only view events (the full TcaDatabaseRecord group would refuse them).
 */
final class EventRecordTypeService
{
    private const TABLE = 'tx_ximatypo3calendar_domain_model_event';
    private const FIELD = 'record_type';
    private const CALENDAR_TABLE = 'tx_ximatypo3calendar_domain_model_calendar';

    /** @var array<int, list<array{value: string, label: string, icon: string|null}>> */
    private array $recordTypesByPid = [];

    public function __construct(
        private readonly FormDataCompiler $formDataCompiler,
        private readonly ConnectionPool $connectionPool,
    ) {
    }

    /**
     * @return list<array{value: string, label: string, icon: string|null}>
     */
    public function getRecordTypes(ServerRequestInterface $request, int $pid): array
    {
        if (isset($this->recordTypesByPid[$pid])) {
            return $this->recordTypesByPid[$pid];
        }

        // Without access to the exclude field the form doesn't show it and DataHandler drops it.
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication
            || (($GLOBALS['TCA'][self::TABLE]['columns'][self::FIELD]['exclude'] ?? false)
                && !$backendUser->check('non_exclude_fields', self::TABLE . ':' . self::FIELD))
        ) {
            return $this->recordTypesByPid[$pid] = [];
        }

        $formDataGroup = GeneralUtility::makeInstance(OnTheFly::class);
        $formDataGroup->setProviderList([
            DatabaseParentPageRow::class,
            DatabaseEffectivePid::class,
            DatabasePageRootline::class,
            UserTsConfig::class,
            PageTsConfig::class,
            SiteResolving::class,
            TcaSelectItems::class,
        ]);
        $result = $this->formDataCompiler->compile(
            [
                'request' => $request,
                'command' => 'new',
                'tableName' => self::TABLE,
                'vanillaUid' => $pid,
                'databaseRow' => ['uid' => 0, 'pid' => $pid, self::FIELD => ''],
                // Only this column, so TcaSelectItems doesn't resolve every other select field.
                'processedTca' => [
                    'ctrl' => $GLOBALS['TCA'][self::TABLE]['ctrl'],
                    'columns' => [self::FIELD => $GLOBALS['TCA'][self::TABLE]['columns'][self::FIELD]],
                ],
            ],
            $formDataGroup,
        );

        $recordTypes = [];
        foreach ($result['processedTca']['columns'][self::FIELD]['config']['items'] ?? [] as $item) {
            $value = (string)($item['value'] ?? '');
            if ($value === '' || $value === '--div--') {
                continue;
            }
            $recordTypes[] = [
                'value' => $value,
                'label' => (string)($item['label'] ?? $value),
                'icon' => is_string($item['icon'] ?? null) ? $item['icon'] : null,
            ];
        }

        return $this->recordTypesByPid[$pid] = $recordTypes;
    }

    public function isAvailable(ServerRequestInterface $request, int $pid, string $recordType): bool
    {
        return in_array($recordType, array_column($this->getRecordTypes($request, $pid), 'value'), true);
    }

    /**
     * The record types available on any page that holds a calendar, for the calendar filter.
     * The calendar module has no page tree, so there is no single page to ask.
     *
     * @return list<array{value: string, label: string, icon: string|null}>
     */
    public function getRecordTypesOnCalendarPages(ServerRequestInterface $request): array
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable(self::CALENDAR_TABLE);
        $pids = $queryBuilder
            ->select('pid')
            ->from(self::CALENDAR_TABLE)
            ->groupBy('pid')
            ->orderBy('pid')
            ->executeQuery()
            ->fetchFirstColumn();

        $recordTypes = [];
        foreach ($pids as $pid) {
            foreach ($this->getRecordTypes($request, (int)$pid) as $recordType) {
                $recordTypes[$recordType['value']] ??= $recordType;
            }
        }

        return array_values($recordTypes);
    }
}
