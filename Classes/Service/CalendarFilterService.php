<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;
use Xima\XimaTypo3Calendar\Domain\Model\Enum\EventStatus;

final class CalendarFilterService
{
    private const MODULE_IDENTIFIER = 'calendar_calendar';

    public function __construct(
        private readonly ConnectionPool $connectionPool,
    ) {
    }

    /**
     * @return array{types: list<array{value: string, label: string}>, categories: list<array{value: int, label: string, parentUid: int|null}>, statuses: list<array{value: int, label: string}>}
     */
    public function getOptions(): array
    {
        return [
            'types' => $this->getTypes(),
            'categories' => $this->getCategories(),
            'statuses' => $this->getStatuses(),
        ];
    }

    /**
     * @return array{activeTypes: list<string>, activeCategories: list<int>, activeStatuses: list<int>, expanded: array{type: bool, categories: bool, status: bool, categoryNodes: array<int, bool>}}
     */
    public function getState(): array
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        $storedState = $backendUser instanceof BackendUserAuthentication
            ? $backendUser->getModuleData(self::MODULE_IDENTIFIER)
            : null;
        $storedState = is_array($storedState) ? $storedState : [];

        return [
            'activeTypes' => $this->getStringList($storedState['activeTypes'] ?? null),
            'activeCategories' => $this->getIntList($storedState['activeCategories'] ?? null),
            'activeStatuses' => $this->getIntList($storedState['activeStatuses'] ?? null),
            'expanded' => [
                'type' => (bool)($storedState['expanded']['type'] ?? true),
                'categories' => (bool)($storedState['expanded']['categories'] ?? true),
                'status' => (bool)($storedState['expanded']['status'] ?? false),
                'categoryNodes' => $this->getExpandedCategoryNodes($storedState['expanded']['categoryNodes'] ?? null),
            ],
        ];
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    private function getTypes(): array
    {
        $types = [];
        foreach ($GLOBALS['TCA']['tx_ximatypo3calendar_domain_model_event']['columns']['record_type']['config']['items'] ?? [] as $item) {
            $value = (string)($item['value'] ?? '');
            if ($value === '') {
                continue;
            }

            $types[$value] = [
                'value' => $value,
                'label' => $this->translate((string)($item['label'] ?? $value), $value),
            ];
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

    /**
     * @return list<string>
     */
    private function getStringList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $item): string => is_scalar($item) ? (string)$item : '',
            $value,
        ), static fn (string $item): bool => $item !== ''));
    }

    /**
     * @return list<int>
     */
    private function getIntList(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        return array_values(array_filter(array_map(
            static fn (mixed $item): int => is_numeric($item) ? (int)$item : 0,
            $value,
        ), static fn (int $item): bool => $item > 0));
    }

    /**
     * @return array<int, bool>
     */
    private function getExpandedCategoryNodes(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $expanded = [];
        foreach ($value as $uid => $isExpanded) {
            if (is_numeric($uid)) {
                $expanded[(int)$uid] = (bool)$isExpanded;
            }
        }

        return $expanded;
    }
}
