<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Backend\FormDataProvider;

use TYPO3\CMS\Backend\Form\FormDataCompiler;
use TYPO3\CMS\Backend\Form\FormDataGroup\TcaDatabaseRecord;
use TYPO3\CMS\Backend\Form\FormDataProviderInterface;
use TYPO3\CMS\Core\Utility\GeneralUtility;

/**
 * Adds one new, prefilled appointment to the form of a new event when the
 * request carries `defVals[tx_ximatypo3calendar_domain_model_entry]`.
 *
 * The calendar module opens "new event" with the selected date range as entry
 * defaults. FormEngine only applies `defVals` to the record that is opened, and
 * the "Create new" button of an inline field loads its child without them, so
 * the appointment is compiled here, the same way TcaInline compiles existing
 * children. Nothing is written until the editor saves the form.
 */
final class NewEventAppointmentFromDefaultValues implements FormDataProviderInterface
{
    private const EVENT_TABLE = 'tx_ximatypo3calendar_domain_model_event';
    private const ENTRY_TABLE = 'tx_ximatypo3calendar_domain_model_entry';
    private const FIELD = 'appointments';

    public function addData(array $result): array
    {
        $defaultValues = $result['defaultValues'][self::ENTRY_TABLE] ?? null;
        $fieldConfig = $result['processedTca']['columns'][self::FIELD]['config'] ?? null;
        if ($result['tableName'] !== self::EVENT_TABLE
            || $result['command'] !== 'new'
            || $result['isInlineChild']
            || !is_array($defaultValues)
            || $defaultValues === []
            || !is_array($fieldConfig)
            || ($fieldConfig['type'] ?? '') !== 'inline'
            || ($result['processedTca']['columns'][self::FIELD]['children'] ?? []) !== []
            // Same check TcaInline runs before it renders any child.
            || !$GLOBALS['BE_USER']->check('tables_modify', self::ENTRY_TABLE)
        ) {
            return $result;
        }

        $result['processedTca']['columns'][self::FIELD]['children'][] = GeneralUtility::makeInstance(FormDataCompiler::class)->compile(
            [
                'request' => $result['request'],
                'command' => 'new',
                'tableName' => self::ENTRY_TABLE,
                'vanillaUid' => (int)$result['inlineFirstPid'],
                'returnUrl' => $result['returnUrl'],
                'defaultValues' => [self::ENTRY_TABLE => $defaultValues],
                'isInlineChild' => true,
                'inlineStructure' => $result['inlineStructure'],
                'inlineExpandCollapseStateArray' => $result['inlineExpandCollapseStateArray'],
                'inlineFirstPid' => $result['inlineFirstPid'],
                'inlineParentConfig' => $fieldConfig,
                'inlineParentUid' => $result['databaseRow']['uid'],
                'inlineParentTableName' => self::EVENT_TABLE,
                'inlineParentFieldName' => self::FIELD,
            ],
            GeneralUtility::makeInstance(TcaDatabaseRecord::class),
        );

        return $result;
    }
}
