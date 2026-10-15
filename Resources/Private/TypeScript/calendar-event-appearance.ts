import type {
    CalendarFilterConfiguration,
    CalendarFilterItem,
} from './Filter/calendar-filter-state';

export function findFilterItem(
    configuration: CalendarFilterConfiguration,
    identifier: string,
    value: string | number,
): CalendarFilterItem | null {
    const filter = configuration[identifier];

    if (!filter) {
        return null;
    }

    return filter.items.find(
        (item) => String(item.value) === String(value),
    ) ?? null;
}

export function getAppearanceClass(
    configuration: CalendarFilterConfiguration,
    source: string,
    value: string | number,
): string {
    const item = findFilterItem(configuration, source, value);

    if (!item) {
        return '';
    }

    const appearance = item.appearance || 'default';
    return `xima-calendar-event--${appearance}`;
}
