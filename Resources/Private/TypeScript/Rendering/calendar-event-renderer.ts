import type {CalendarFilterConfiguration} from '../Filter/calendar-filter-state';
import {getAppearanceClass} from '../Event/calendar-event-appearance';
import {
  applyEventColor,
  applyEventColorsToEvents,
} from './calendar-event-colors';
import {
  type CalendarEventData,
  getFilterValue,
} from './calendar-event-data';

export type CalendarEventRendererConfiguration = {
  locale: string;
  filterColors: Record<string, Record<string, string>>;
  appearanceSource: string;
  colorSource: string;
  getFilterConfiguration: () => CalendarFilterConfiguration;
};

export type CalendarEventRenderer = {
  prepareEvents(events: CalendarEventData[]): CalendarEventData[];
  getClassNames(event: CalendarEventData): string[];
  didMount(
    event: CalendarEventData,
    element: HTMLElement,
    events: CalendarEventData[],
  ): void;
};

const isCanceledEvent = (event: CalendarEventData): boolean => {
  const canceled = event.extendedProps?.appointmentCanceled;

  return canceled === true
    || canceled === 1
    || canceled === '1';
};

const eventTime = (
  value: string | Date | undefined,
): number | null => {
  if (!value) {
    return null;
  }

  const timestamp = value instanceof Date
    ? value.getTime()
    : Date.parse(value);

  return Number.isFinite(timestamp) ? timestamp : null;
};

const hasConcurrentEvent = (
  event: CalendarEventData,
  events: CalendarEventData[],
): boolean => {
  const start = eventTime(event.start);
  const end = eventTime(event.end);

  if (start === null || end === null) {
    return false;
  }

  return events.some((other) => {
    if (
      other === event
      || (
        other.id !== undefined
        && event.id !== undefined
        && other.id === event.id
      )
    ) {
      return false;
    }

    const otherStart = eventTime(other.start);
    const otherEnd = eventTime(other.end);

    return otherStart !== null
      && otherEnd !== null
      && start < otherEnd
      && end > otherStart;
  });
};

const getCanceledMarker = (locale: string): string => (
  locale.startsWith('de') ? '[A]' : '[C]'
);

export const createCalendarEventRenderer = (
  configuration: CalendarEventRendererConfiguration,
): CalendarEventRenderer => ({
  prepareEvents(events): CalendarEventData[] {
    return applyEventColorsToEvents(
      events,
      configuration.filterColors,
      configuration.colorSource,
    );
  },

  getClassNames(event): string[] {
    const colorValue = getFilterValue(
      event,
      configuration.colorSource,
    );
    const appearanceValue = getFilterValue(
      event,
      configuration.appearanceSource,
    );

    const appearanceClass = appearanceValue === undefined
      ? ''
      : getAppearanceClass(
        configuration.getFilterConfiguration(),
        configuration.appearanceSource,
        appearanceValue,
      );

    return [
      ...(colorValue !== undefined
        ? ['xima-calendar-event--color-coded']
        : []),
      ...(isCanceledEvent(event)
        ? ['xima-calendar-event--canceled']
        : []),
      ...(appearanceClass
        ? [appearanceClass]
        : []),
    ];
  },

  didMount(event, element, events): void {
    applyEventColor(
      event,
      element,
      configuration.filterColors,
      configuration.colorSource,
    );

    if (!isCanceledEvent(event) || !hasConcurrentEvent(event, events)) {
      return;
    }

    const titleElement = element.querySelector<HTMLElement>(
      '.ec-event-title',
    );

    if (titleElement) {
      titleElement.textContent = `${getCanceledMarker(configuration.locale)} ${
        titleElement.textContent ?? ''
      }`;
    }
  },
});
