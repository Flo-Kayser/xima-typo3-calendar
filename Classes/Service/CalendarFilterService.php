<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Backend\Utility\BackendUtility;
use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use Xima\XimaTypo3Calendar\Event\ConfigureCalendarFilterEvent;

final class CalendarFilterService
{
    private const MODULE_IDENTIFIER = 'calendar_calendar';

    private ?array $filters = null;

    public function __construct(
        private readonly ConnectionPool $connectionPool,
        private readonly EventDispatcher $eventDispatcher,
    ) {
    }

    /** @return array<string, array<string, mixed>> */
    public function getFilters(int $pageId = 0): array
    {
        if ($this->filters !== null) {
            return $this->filters;
        }

        $filters = [];

        $event = new ConfigureCalendarFilterEvent();

        $this->eventDispatcher->dispatch($event);

        foreach ($event->getFilters() as $filter) {
            $serializedFilter = $filter->jsonSerialize();

            $filters[$filter->getIdentifier()] = $serializedFilter;
        }

        return $this->filters = $this->sortFilters(
            $filters,
            $this->getFilterOrder($pageId),
        );
    }

    /**
     * @param array<string, array<string, mixed>> $filters
     * @param list<string> $filterOrder
     * @return array<string, array<string, mixed>>
     */
    private function sortFilters(
        array $filters,
        array $filterOrder,
    ): array {
        $sortedFilters = [];

        foreach ($filterOrder as $identifier) {
            if (isset($filters[$identifier])) {
                $sortedFilters[$identifier] = $filters[$identifier];
            }
        }

        foreach ($filters as $identifier => $filter) {
            if (!isset($sortedFilters[$identifier])) {
                $sortedFilters[$identifier] = $filter;
            }
        }

        return $sortedFilters;
    }

    /** @return list<string> */
    private function getFilterOrder(int $pageId): array
    {
        $tsConfig = BackendUtility::getPagesTSconfig($pageId);
        $configuredOrder = $tsConfig['mod.']['tx_ximatypo3calendar.']['filterOrder'] ?? '';
        $values = is_array($configuredOrder)
            ? $configuredOrder
            : explode(',', (string)$configuredOrder);

        return array_values(array_filter(
            array_map(
                static fn (mixed $value): string => is_scalar($value) ? trim((string)$value) : '',
                $values,
            ),
            static fn (string $value): bool => $value !== '',
        ));
    }

    private const DEFAULT_VIEW = 'dayGridMonth';

    /**
     * @return array{
     *     checkboxLists: array<string, list<int|string>>,
     *     trees: array<string, array{activeItems: list<int|string>, expandedItems: array<string, bool>}>,
     *     sections: array<string, bool>,
     *     view: string,
     * }
     */
    public function getState(int $pageId = 0): array
    {
        return $this->normalizeState($this->getStoredState(), $pageId);
    }

    public function saveState(array $state, int $pageId = 0): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication) {
            return;
        }

        $backendUser->pushModuleData(
            self::MODULE_IDENTIFIER,
            $this->normalizeState(array_merge($this->getStoredState(), $state), $pageId),
        );
    }

    public function getView(): string
    {
        return $this->normalizeView($this->getStoredState()['view'] ?? null);
    }

    public function saveView(string $view, int $pageId = 0): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication) {
            return;
        }

        $state = $this->getStoredState();
        $state['view'] = $view;
        $backendUser->pushModuleData(
            self::MODULE_IDENTIFIER,
            $this->normalizeState($state, $pageId),
        );
    }

    private function normalizeState(array $state, int $pageId): array
    {
        $filters = $this->getFilters($pageId);
        $categories = array_fill_keys(
            array_column($filters['categories']['items'] ?? [], 'value'),
            true,
        );
        $checkboxLists = [];
        foreach ($filters as $identifier => $filter) {
            if (!is_string($identifier) || !is_array($filter) || ($filter['type'] ?? null) !== 'checkbox-list') {
                continue;
            }

            $allowedValues = [];
            foreach ($filter['items'] ?? [] as $item) {
                if (is_array($item) && (is_int($item['value'] ?? null) || is_string($item['value'] ?? null))) {
                    $allowedValues[(string)$item['value']] = $item['value'];
                }
            }

            $checkboxLists[$identifier] = array_values(array_filter(array_map(
                static fn (int|string $value): int|string|null => $allowedValues[(string)$value] ?? null,
                $this->getTreeValueList($state['checkboxLists'][$identifier] ?? null),
            ), static fn (int|string|null $value): bool => $value !== null));
        }
        $trees = $this->normalizeTreeStates($state['trees'] ?? null, $categories);
        $storedSections = is_array($state['sections'] ?? null)
            ? $state['sections']
            : [];
        $sections = [];
        foreach ($filters as $identifier => $filter) {
            if (is_string($identifier) && is_array($filter)) {
                $sections[$identifier] = is_bool($storedSections[$identifier] ?? null)
                    ? $storedSections[$identifier]
                    : true;
            }
        }

        if (!array_key_exists('trees', $state)) {
            $legacyExpanded = is_array($state['expanded'] ?? null)
                ? ($state['expanded']['categoryNodes'] ?? null)
                : null;
            $trees['categories'] = [
                'activeItems' => array_values(array_filter(
                    $this->getIntList($state['activeCategories'] ?? null),
                    static fn (int $category): bool => isset($categories[$category]),
                )),
                'expandedItems' => array_intersect_key(
                    $this->getExpandedTreeItems($legacyExpanded),
                    $categories,
                ),
            ];
        }

        return [
            'checkboxLists' => $checkboxLists,
            'trees' => $trees,
            'sections' => $sections,
            'view' => $this->normalizeView($state['view'] ?? null),
        ];
    }

    private function getStoredState(): array
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        $storedState = $backendUser instanceof BackendUserAuthentication
            ? $backendUser->getModuleData(self::MODULE_IDENTIFIER)
            : null;

        return is_array($storedState) ? $storedState : [];
    }

    private function normalizeView(mixed $view): string
    {
        return in_array($view, ['dayGridMonth', 'timeGridWeek', 'listMonth'], true)
            ? $view
            : self::DEFAULT_VIEW;
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

    /**
     * @param array<int, bool> $categories
     * @return array<string, array{activeItems: list<int|string>, expandedItems: array<string, bool>}>
     */
    private function normalizeTreeStates(mixed $value, array $categories): array
    {
        $treeStates = [];
        if (is_array($value)) {
            foreach ($value as $identifier => $treeState) {
                if (!is_string($identifier) || !is_array($treeState)) {
                    continue;
                }

                $activeItems = $this->getTreeValueList($treeState['activeItems'] ?? null);
                $expandedItems = $this->getExpandedTreeItems($treeState['expandedItems'] ?? null);

                if ($identifier === 'categories') {
                    $activeItems = array_values(array_filter(
                        $this->getIntList($activeItems),
                        static fn (int $category): bool => isset($categories[$category]),
                    ));
                    $expandedItems = array_intersect_key($expandedItems, $categories);
                }

                $treeStates[$identifier] = [
                    'activeItems' => $activeItems,
                    'expandedItems' => $expandedItems,
                ];
            }
        }

        $treeStates['categories'] ??= [
            'activeItems' => [],
            'expandedItems' => [],
        ];

        return $treeStates;
    }

    /** @return list<int|string> */
    private function getTreeValueList(mixed $value): array
    {
        $values = is_array($value) ? $value : [$value];

        return array_values(array_unique(array_filter(
            array_map(
                static fn (mixed $item): int|string => is_int($item)
                    ? $item
                    : (is_string($item) ? $item : (is_numeric($item) ? (int)$item : '')),
                $values,
            ),
            static fn (int|string $item): bool => $item !== '',
        ), SORT_REGULAR));
    }

    /** @return array<string, bool> */
    private function getExpandedTreeItems(mixed $value): array
    {
        if (!is_array($value)) {
            return [];
        }

        $expanded = [];
        foreach ($value as $uid => $isExpanded) {
            if (is_string($uid) || is_int($uid)) {
                $expanded[(string)$uid] = $this->toBool($isExpanded, false);
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
