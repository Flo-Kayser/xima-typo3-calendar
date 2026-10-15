import {createCalendar, DayGrid, destroyCalendar, Interaction, List, TimeGrid,} from '@event-calendar/core';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import DocumentService from '@typo3/core/document-service.js';
import Notification from '@typo3/backend/notification.js';
import {createCalendarCreationController} from './Event/calendar-event-creation';
import {createCalendarDetailsController} from './Event/calendar-details';
import {getAppearanceClass} from './Event/calendar-event-appearance';
import {createCalendarInteractionController} from './Interaction/calendar-interaction';
import {readCalendarConfig, type Typo3TopWindow} from './Configuration/calendar-runtime-config';
import {type ColorOverrides, getColor, getTextColor} from './Utils/color-utils';
import type {CalendarFilterConfiguration, CalendarFilterSelection} from './Filter/calendar-filter-state';

type EventCalendarTheme = Record<string, string | string[]>;
type EventCalendarButtonText = Record<string, string>;
type CalendarFilterWindow = Window & {
    ximaCalendarFilterState?: CalendarFilterSelection;
    ximaCalendarFilterConfiguration?: CalendarFilterConfiguration;
};

type CalendarEventData = {
    id?: string | number;
    title?: string;
    start?: string | Date;
    end?: string | Date;
    extendedProps?: Record<string, unknown>;
    backgroundColor?: string;
    textColor?: string;
    style?: string | string[];
    styles?: string | string[];
};

type FilterValue = string |number;

const getFilterValue = (
  event: CalendarEventData,
  identifier: string,
): FilterValue | undefined => {
    const filterValues  = event.extendedProps?.filterValues;

    if(!filterValues || typeof filterValues !== 'object') {
      return undefined;
    }

    const value = (filterValues as Record<string, unknown>)[identifier];

    return typeof value === 'string' || typeof value === 'number' ? value : undefined;

};

const calendarCleanups = new WeakMap<HTMLElement, () => Promise<void>>();

const isCanceledEvent = (event: CalendarEventData): boolean => {
    const canceled = event.extendedProps?.appointmentCanceled;
    return canceled === true || canceled === 1 || canceled === '1';
};

const eventTime = (value: string | Date | undefined): number | null => {
    if (!value) {
        return null;
    }

    const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
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
        if (other === event || (other.id !== undefined && event.id !== undefined && other.id === event.id)) {
            return false;
        }

        const otherStart = eventTime(other.start);
        const otherEnd = eventTime(other.end);
        return otherStart !== null && otherEnd !== null && start < otherEnd && end > otherStart;
    });
};

const applyEventColor = (
    event: CalendarEventData,
    element: HTMLElement,
    filterColors: ColorOverrides,
    colorSource: string,
): void => {

    const value = getFilterValue(event, colorSource);
    if (value === undefined) {
        return;
    }

    const eventColor = getColor(colorSource, value, filterColors);
    const eventTextColor = getTextColor(colorSource, value, filterColors);

    element.dataset.ximaEventColor = eventColor;
    element.dataset.ximaEventTextColor = eventTextColor;

    element.style.setProperty('--xima-event-color', eventColor);
    element.style.setProperty('--xima-event-text-color', eventTextColor);
};

const applyEventColorsToEvents = (
    events: CalendarEventData[],
    locale: string,
    filterColors: ColorOverrides,
    colorSource: string,
): CalendarEventData[] => events.map((event) => {
    const title = isCanceledEvent(event)
        ? (event.title ? `${getCanceledLabel(locale)} · ${event.title}` : getCanceledLabel(locale))
        : event.title;
    const value = getFilterValue(event, colorSource);
    if (value === undefined) {
        return {...event, title};
    }

    const eventColor = getColor(colorSource, value, filterColors);
    const eventTextColor = getTextColor(colorSource, value, filterColors);
    const existingStyles = event.styles ?? event.style ?? [];
    const styles = Array.isArray(existingStyles) ? existingStyles : [existingStyles];

    return {
        ...event,
        title,
        backgroundColor: eventColor,
        textColor: eventTextColor,
        styles: [
            ...styles,
            `--xima-event-color:${eventColor}`,
            `--xima-event-text-color:${eventTextColor}`,
        ],
    };
});

const getCanceledLabel = (locale: string): string => locale.startsWith('de') ? 'Abgesagt' : 'Canceled';

const getEventStatusClass = (
    event: CalendarEventData,
    filterConfiguration: CalendarFilterConfiguration,
    appearanceSource: string,
    colorSource: string,
): string[] => {
    const colorValue = getFilterValue(event, colorSource);
    const appearanceValue = getFilterValue(event, appearanceSource);
    const appearanceClass = appearanceValue === undefined
        ? ''
        : getAppearanceClass(filterConfiguration, appearanceSource, appearanceValue);

    return [
        ...(colorValue !== undefined
            ? ['xima-calendar-event--color-coded']
            : []),
        ...(isCanceledEvent(event) ? ['xima-calendar-event--canceled'] : []),
        ...(appearanceClass ? [appearanceClass] : []),
    ];
};

DocumentService.ready().then(async () => {
    const container = document.getElementById('xima-calendar-mount');
    if (!container) {
        return;
    }

    await calendarCleanups.get(container)?.();

    const calendarConfig = readCalendarConfig(container);
    if (!calendarConfig) {
        Notification.error(
            'Configuration error',
            'The calendar configuration is invalid.',
        );
        return;
    }

    const enableDragNewEvent = calendarConfig.enableDragNewEvent;
    const enableClickNewEvent = calendarConfig.enableClickNewEvent;
    const timeSlotDuration = `00:${String(calendarConfig.timeSlotMinutes).padStart(2, '0')}:00`;
    const calendarOptions = {
        firstDay: 0,
    };

    const typo3Top = window.top as unknown as Typo3TopWindow;
    const filterWindow = window.top as unknown as CalendarFilterWindow;
    let activeFilters: CalendarFilterSelection = filterWindow.ximaCalendarFilterState ?? {
        filters: {},
    };
    let filterConfiguration: CalendarFilterConfiguration =
        filterWindow.ximaCalendarFilterConfiguration ?? {};

    let currentEvents: CalendarEventData[] = [];
    const detailsController = createCalendarDetailsController(container, typo3Top);
    const creationController = createCalendarCreationController(container, typo3Top, calendarConfig);
    let currentView = calendarConfig.initialView;
    const persistCalendarView = (view: string): void => {
        if (view === currentView) {
            return;
        }

        currentView = view as typeof currentView;
        void new AjaxRequest(calendarConfig.viewStateUrl)
            .post({view})
            .then(response => response.resolve())
            .catch(error => console.error('Calendar view could not be saved', error));
    };

    const ec = createCalendar(
        container,
        [DayGrid, TimeGrid, List, Interaction],
        {
            ...calendarOptions,
            locale: calendarConfig.locale,
            eventGap: 3,
            height: '100%',
            nowIndicator: true,
            selectable: enableDragNewEvent,
            dayMaxEvents: true,
            moreLinkContent: ({num}: {num: number}) => `+${num} ${calendarConfig.locale.startsWith('de') ? 'weitere' : 'more'}`,
            view: calendarConfig.initialView,
            views: {
                timeGridWeek: {
            scrollTime: calendarConfig.scrollStartTime,
                    slotMinTime: '00:00:00',
                    slotMaxTime: '24:00:00',
                    slotDuration: timeSlotDuration,
                    slotLabelInterval: '01:00:00',
                    snapDuration: timeSlotDuration,
                    slotEventOverlap: false,
                },
            },
            theme: (theme: EventCalendarTheme) => ({
                ...theme,
                button: 'btn btn-default',
                buttonGroup: 'btn-group',
                active: 'active',
            }),
            buttonText: (buttonText: EventCalendarButtonText) => ({
                ...buttonText,
                dayGridMonth: calendarConfig.locale.startsWith('de') ? 'Monat' : 'Month',
                timeGridWeek: calendarConfig.locale.startsWith('de') ? 'Woche' : 'Week',
                listMonth: calendarConfig.locale.startsWith('de') ? 'Liste' : 'List',
                today: calendarConfig.locale.startsWith('de') ? 'Heute' : 'Today',
            }),
            headerToolbar: {
                start: 'prev next today',
                center: 'title',
                end: 'dayGridMonth,timeGridWeek,listMonth',
            },
            datesSet: ({view}: {view: {type: string}}) => {
                detailsController.datesSet();
                persistCalendarView(view.type);
            },
            select: enableDragNewEvent ? creationController.select : undefined,
            dateClick: enableClickNewEvent ? creationController.dateClick : undefined,
            eventSources: [
                {
                    events: async (fetchInfo: {startStr: string; endStr: string}) => {
                        const url = new URL(calendarConfig.ajaxUrl, document.location.origin);
                        url.searchParams.set('start', fetchInfo.startStr);
                        url.searchParams.set('end', fetchInfo.endStr);
                        url.searchParams.set('filters', JSON.stringify(activeFilters.filters));

                        const response = await fetch(url, {credentials: 'same-origin'});
                        if (!response.ok) {
                            throw new Error('Calendar events could not be loaded');
                        }

                        const events = await response.json() as CalendarEventData[];
                        currentEvents = applyEventColorsToEvents(
                            events,
                            calendarConfig.locale,
                            calendarConfig.filterColors,
                            calendarConfig.eventAppearance.colorSource,
                        );
                        return currentEvents;
                    },
                },
            ],
            eventClassNames: ({event}: {event: CalendarEventData}) => getEventStatusClass(
                event,
                filterConfiguration,
                calendarConfig.eventAppearance.appearanceSource,
                calendarConfig.eventAppearance.colorSource,
            ),
            eventDidMount: ({event, el}: {
                event: CalendarEventData;
                el: HTMLElement;
            }) => {
                applyEventColor(event, el, calendarConfig.filterColors, calendarConfig.eventAppearance.colorSource);

                if (isCanceledEvent(event) && hasConcurrentEvent(event, currentEvents)) {
                    const titleElement = el.querySelector<HTMLElement>('.ec-event-title');
                    if (titleElement) {
                        const canceledLabel = getCanceledLabel(calendarConfig.locale);
                        const canceledMarker = calendarConfig.locale.startsWith('de') ? '[A]' : '[C]';
                        titleElement.textContent = titleElement.textContent?.replace(
                            new RegExp(`^${canceledLabel}\\s*·\\s*`),
                            `${canceledMarker} `,
                        ) ?? canceledMarker;
                    }
                }
            },
            eventClick: detailsController.eventClick,
        },
    );

    const handleFilterConfigurationLoaded = (
        event: Event,
    ): void => {
        const configurationEvent =
            event as CustomEvent<CalendarFilterConfiguration>;

        filterConfiguration = configurationEvent.detail;
        ec.refetchEvents();
    };

    filterWindow.addEventListener(
        'xima-calendar-filter-configuration-loaded',
        handleFilterConfigurationLoaded,
        {once: true},
    );

    const interactionController = createCalendarInteractionController(container, ec, creationController, {
        enableDragNewEvent,
    });
    creationController.setClearCalendarSelection(() => ec.unselect());

    let destroyed = false;
    const cleanupPendingCreation = (): void => {
        void creationController.cleanupPendingCreation().then((cleanedUp) => {
            if (cleanedUp && !destroyed) {
                ec.refetchEvents();
            }
        });
    };

    const onFilterChanged = (event: Event): void => {
        const selection = (event as CustomEvent<CalendarFilterSelection>).detail;
        if (!selection) {
            return;
        }

        activeFilters = selection;
        ec.refetchEvents();
    };

    cleanupPendingCreation();
    window.addEventListener('pageshow', cleanupPendingCreation);
    window.addEventListener('popstate', cleanupPendingCreation);
    window.top.document.addEventListener('typo3-module-loaded', cleanupPendingCreation, true);
    filterWindow.addEventListener('xima-calendar-filter-changed', onFilterChanged);

    const cleanup = async (): Promise<void> => {
        if (destroyed) {
            return;
        }

        destroyed = true;
        window.removeEventListener('pageshow', cleanupPendingCreation);
        window.removeEventListener('popstate', cleanupPendingCreation);
        window.top.document.removeEventListener('typo3-module-loaded', cleanupPendingCreation, true);
        filterWindow.removeEventListener('xima-calendar-filter-changed', onFilterChanged);
        interactionController.destroy();
        calendarCleanups.delete(container);
        await destroyCalendar(ec);
    };

    calendarCleanups.set(container, cleanup);
});
