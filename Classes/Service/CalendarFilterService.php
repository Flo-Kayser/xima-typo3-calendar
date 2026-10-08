<?php

declare(strict_types=1);

namespace Xima\XimaTypo3Calendar\Service;

use TYPO3\CMS\Core\Authentication\BackendUserAuthentication;
use TYPO3\CMS\Core\Database\ConnectionPool;
use TYPO3\CMS\Core\EventDispatcher\EventDispatcher;
use Xima\XimaTypo3Calendar\Domain\Model\Enum\EventStatus;
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
     *     categories: list<array<string,mixed>>,
     *     statuses: list<array{value: int|string, label: string}>,
     * }
     */
    public function getFilters(): array
    {
        if ($this->filters !== null) {
            return $this->filters;
        }

        $filters = [
            'types' => $this->getTypes(),
            'statuses' => $this->getStatuses(),
        ];

        $event = new ConfigureCalendarFilterEvent();

        $this->eventDispatcher->dispatch($event);

        foreach ($event->getFilters() as $filter) {
            $serializedFilter = $filter->jsonSerialize();

            $filters[$filter->getIdentifier()] =
                $serializedFilter['items'] ?? [];
        }
        return $this->filters = $filters;
    }

    private const DEFAULT_VIEW = 'dayGridMonth';

    /**
     * @return array{activeTypes: list<string>, activeCategories: list<int>, activeStatuses: list<int|string>, expanded: array{categoryNodes: array<int, bool>}, view: string}
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
        $expanded = is_array($state['expanded'] ?? null) ? $state['expanded'] : [];
        $types = array_fill_keys(array_column($filters['types'], 'value'), true);
        $categories = array_fill_keys(array_column($filters['categories'], 'value'), true);
        $statuses = array_fill_keys(array_map('strval', array_column($filters['statuses'], 'value')), true);
        $activeTypes = array_values(array_filter(
            $this->getStringList($state['activeTypes'] ?? null),
            static fn (string $type): bool => isset($types[$type]),
        ));
        $activeCategories = array_values(array_filter(
            $this->getIntList($state['activeCategories'] ?? null),
            static fn (int $category): bool => isset($categories[$category]),
        ));
        $activeStatuses = array_values(array_filter(
            $this->getStatusList($state['activeStatuses'] ?? null),
            static fn (int|string $status): bool => isset($statuses[(string)$status]),
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

    /**
     * @return list<array{value: int|string, label: string}>
     */
    private function getStatuses(): array
    {
        $statusOrder = [
            EventStatus::DRAFT->value => 0,
            EventStatus::REVIEW->value => 1,
            EventStatus::REJECTED->value => 2,
            EventStatus::LIVE->value => 3,
        ];
        $eventStatuses = EventStatus::cases();
        usort(
            $eventStatuses,
            static fn (EventStatus $left, EventStatus $right): int
                => ($statusOrder[$left->value] ?? PHP_INT_MAX) <=> ($statusOrder[$right->value] ?? PHP_INT_MAX),
        );

        $statuses = [];
        foreach ($eventStatuses as $status) {
            $statuses[] = [
                'value' => $status->value,
                'label' => $this->translate(
                    'LLL:EXT:xima_typo3_calendar/Resources/Private/Language/RecordTypes/event/labels.xlf:status.items.' . $status->value . '.label',
                    ucfirst(strtolower($status->name)),
                ),
            ];
        }

        $statuses[] = [
            'value' => 'canceled',
            'label' => $this->translate(
                'LLL:EXT:xima_typo3_calendar/Resources/Private/Language/locallang_mod_calendar.xlf:filter.canceled',
                'Canceled [C]',
            ),
        ];

        return $statuses;
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
