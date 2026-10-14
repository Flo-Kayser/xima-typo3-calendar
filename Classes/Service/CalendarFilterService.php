<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

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

    /**
     * @return array{
     *     types: list<array{value: string, label: string}>,
     *     filters: array<string, array<string, mixed>>,
     * }
     */
    public function getFilters(): array
    {
        if ($this->filters !== null) {
            return $this->filters;
        }

        $filters = [
            'types' => $this->getTypes(),
            'filters' => [],
        ];

        $event = new ConfigureCalendarFilterEvent();

        $this->eventDispatcher->dispatch($event);

        foreach ($event->getFilters() as $filter) {
            $serializedFilter = $filter->jsonSerialize();

            $filters['filters'][$filter->getIdentifier()] = $serializedFilter;
        }
        return $this->filters = $filters;
    }

    private const DEFAULT_VIEW = 'dayGridMonth';

    /**
     * @return array{
     *     activeTypes: list<string>,
     *     activeStatuses: list<int|string>,
     *     trees: array<string, array{activeItems: list<int|string>, expandedItems: array<string, bool>}>,
     *     view: string,
     * }
     */
    public function getState(): array
    {
        return $this->normalizeState($this->getStoredState());
    }

    public function saveState(array $state): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication) {
            return;
        }

        $backendUser->pushModuleData(
            self::MODULE_IDENTIFIER,
            $this->normalizeState(array_merge($this->getStoredState(), $state)),
        );
    }

    public function getView(): string
    {
        return $this->normalizeView($this->getStoredState()['view'] ?? null);
    }

    public function saveView(string $view): void
    {
        $backendUser = $GLOBALS['BE_USER'] ?? null;
        if (!$backendUser instanceof BackendUserAuthentication) {
            return;
        }

        $state = $this->getStoredState();
        $state['view'] = $view;
        $backendUser->pushModuleData(self::MODULE_IDENTIFIER, $this->normalizeState($state));
    }

    private function normalizeState(array $state): array
    {
        $filters = $this->getFilters();
        $types = array_fill_keys(array_column($filters['types'], 'value'), true);
        $categories = array_fill_keys(
            array_column($filters['filters']['categories']['items'] ?? [], 'value'),
            true,
        );
        $statuses = array_fill_keys(
            array_map(
                'strval',
                array_column($filters['filters']['statuses']['items'] ?? [], 'value'),
            ),
            true,
        );
        $activeTypes = array_values(array_filter(
            $this->getStringList($state['activeTypes'] ?? null),
            static fn (string $type): bool => isset($types[$type]),
        ));
        $activeStatuses = array_values(array_filter(
            $this->getStatusList($state['activeStatuses'] ?? null),
            static fn (int|string $status): bool => isset($statuses[(string)$status]),
        ));
        $trees = $this->normalizeTreeStates($state['trees'] ?? null, $categories);

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
            'activeTypes' => $activeTypes,
            'activeStatuses' => $activeStatuses,
            'trees' => $trees,
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

    private function getStatusList(mixed $value): array
    {
        $values = is_array($value) ? $value : [$value];

        return array_values(array_filter(array_map(
            static fn (mixed $item): int|string => is_numeric($item) ? (int)$item : (string)$item,
            $values,
        ), static fn (int|string $item): bool => is_int($item) ? $item >= 0 : $item !== ''));
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
