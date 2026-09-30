<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\Connection;
use TYPO3\CMS\Core\Database\ConnectionPool;
use Xima\XimaTypo3Calendar\Domain\Model\Enum\EventStatus;

final class CalendarFilterService
{
    private const MODULE_IDENTIFIER = 'calendar_calendar';

    private ?array $options = null;

    public function __construct(
        private readonly ConnectionPool $connectionPool,
    ) {
    }

    /**
     * @return array{types: list<array{value: string, label: string}>, categories: list<array{value: int, label: string, parentUid: int|null}>, statuses: list<array{value: int, label: string}>}
     */
    public function getOptions(): array
    {
        return $this->options ??= [
            'types' => $this->getTypes(),
            'categories' => $this->getCategories(),
            'statuses' => $this->getStatuses(),
        ];
    }

    /**
     * @return array{activeTypes: list<string>, activeCategories: list<int>, activeStatuses: list<int>, expanded: array{categoryNodes: array<int, bool>}}
     */
    public function getState(): array
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        $storedState = $backendUser instanceof BackendUserAuthentication
            ? $backendUser->getModuleData(self::MODULE_IDENTIFIER)
            : null;

        return $this->normalizeState(is_array($storedState) ? $storedState : []);
    }

    public function saveState(array $state): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication) {
            return;
        }

        $backendUser->pushModuleData(self::MODULE_IDENTIFIER, $this->normalizeState($state));
    }

    private function normalizeState(array $state): array
    {
        $options = $this->getOptions();
        $expanded = is_array($state['expanded'] ?? null) ? $state['expanded'] : [];
        $types = array_fill_keys(array_column($options['types'], 'value'), true);
        $categories = array_fill_keys(array_column($options['categories'], 'value'), true);
        $statuses = array_fill_keys(array_column($options['statuses'], 'value'), true);
        $activeTypes = array_values(array_filter(
            $this->getStringList($state['activeTypes'] ?? null),
            static fn (string $type): bool => isset($types[$type]),
        ));
        $activeCategories = array_values(array_filter(
            $this->getIntList($state['activeCategories'] ?? null),
            static fn (int $category): bool => isset($categories[$category]),
        ));
        $activeStatuses = array_values(array_filter(
            $this->getIntList($state['activeStatuses'] ?? null, true),
            static fn (int $status): bool => isset($statuses[$status]),
        ));
        $expandedCategories = array_intersect_key(
            $this->getExpandedCategoryNodes($expanded['categoryNodes'] ?? null),
            $categories,
        );

        return [
            'activeTypes' => $activeTypes,
            'activeCategories' => $activeCategories,
            'activeStatuses' => $activeStatuses,
            'expanded' => [
                'categoryNodes' => $expandedCategories,
            ],
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function getTypes(): array
    {
        $types = [];
        foreach ([
            'tx_ximatypo3calendar_domain_model_event',
            'tx_ximatypo3calendar_domain_model_entry',
        ] as $table) {
            foreach ($GLOBALS['TCA'][$table]['columns']['record_type']['config']['items'] ?? [] as $item) {
                $value = (string)($item['value'] ?? '');
                if ($value === '') {
                    continue;
                }

                $types[$value] = [
                    'value' => $value,
                    'label' => $this->translate((string)($item['label'] ?? $value), $value),
                ];
            }
        }

        return array_values($types);
    }

    /**
     * @return list<array{value: int, label: string, parentUid: int|null}>
     */
    private function getCategories(): array
    {
        $queryBuilder = $this->connectionPool->getQueryBuilderForTable('sys_category');
        $rows = $queryBuilder
            ->select('uid', 'title', 'parent')
            ->from('sys_category')
            ->where(
                $queryBuilder->expr()->eq(
                    'sys_language_uid',
                    $queryBuilder->createNamedParameter(0, Connection::PARAM_INT),
                )
            )
            ->orderBy('sorting')
            ->addOrderBy('title')
            ->executeQuery()
            ->fetchAllAssociative();

        return array_map(static fn (array $row): array => [
            'value' => (int)$row['uid'],
            'label' => (string)$row['title'],
            'parentUid' => (int)$row['parent'] > 0 ? (int)$row['parent'] : null,
        ], $rows);
    }

    /**
     * @return list<array{value: int, label: string}>
     */
    private function getStatuses(): array
    {
        return array_map(static fn (EventStatus $status): array => [
            'value' => $status->value,
            'label' => ucfirst(strtolower($status->name)),
        ], EventStatus::cases());
    }

    private function translate(string $label, string $fallback): string
    {
        if (str_starts_with($label, 'LLL:') && isset($GLOBALS['LANG'])) {
            $translated = $GLOBALS['LANG']->sL($label);
            return $translated !== '' && !str_starts_with($translated, 'LLL:') ? $translated : $fallback;
        }

        return $label !== '' ? $label : $fallback;
    }

    private function getStringList(mixed $value): array
    {
        $values = is_array($value) ? $value : [$value];

        return array_values(array_filter(array_map(
            static fn (mixed $item): string => is_scalar($item) ? (string)$item : '',
            $values,
        ), static fn (string $item): bool => $item !== ''));
    }

    private function getIntList(mixed $value, bool $allowZero = false): array
    {
        $values = is_array($value) ? $value : [$value];
        $minimum = $allowZero ? 0 : 1;

        return array_values(array_filter(array_map(
            static fn (mixed $item): int => is_numeric($item) ? (int)$item : -1,
            $values,
        ), static fn (int $item): bool => $item >= $minimum));
    }

    private function getExpandedCategoryNodes(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $expanded = [];
        foreach ($value as $uid => $isExpanded) {
            if (is_numeric($uid)) {
                $expanded[(int)$uid] = $this->toBool($isExpanded, false);
            }
        }

        return $expanded;
    }

    private function toBool(mixed $value, bool $default): bool
    {
        $parsed = filter_var($value, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        return $parsed ?? $default;
    }
}
