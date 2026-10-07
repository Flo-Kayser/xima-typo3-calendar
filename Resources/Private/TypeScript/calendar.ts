import {
    createCalendar,
    DayGrid,
    destroyCalendar,
    Interaction,
    List,
    TimeGrid,
} from '@event-calendar/core';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import DocumentService from '@typo3/core/document-service.js';
import Notification from '@typo3/backend/notification.js';
import {createCalendarCreationController} from './calendar-event-creation';
import {createCalendarDetailsController} from './calendar-details';
import {createCalendarInteractionController} from './interaction/calendar-interaction';
import {readCalendarConfig, type Typo3TopWindow} from './calendar-runtime-config';
import {getCategoryColor, getCategoryTextColor} from './calendar-category-color';
import type {CalendarFilterSelection} from './Filter/calendar-filter-state';

type EventCalendarTheme = Record<string, string | string[]>;
type EventCalendarButtonText = Record<string, string>;
type CalendarFilterWindow = Window & {
    ximaCalendarFilterState?: CalendarFilterSelection;
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

const applyCategoryColor = (
    event: CalendarEventData,
    element: HTMLElement,
    categoryColors: Record<string, string>,
): void => {
    const categoryUid = Number(event.extendedProps?.eventCategoryId);
    if (!Number.isInteger(categoryUid) || categoryUid <= 0) {
        return;
    }

    const categoryColor = getCategoryColor(categoryUid, categoryColors);
    const categoryTextColor = getCategoryTextColor(categoryUid, categoryColors);
    element.dataset.ximaCategoryColor = categoryColor;
    element.dataset.ximaCategoryTextColor = categoryTextColor;
    element.style.setProperty('--xima-category-color', categoryColor);
    element.style.setProperty('--xima-category-text-color', categoryTextColor);
};

const applyCategoryColorsToEvents = (
    events: CalendarEventData[],
    categoryColors: Record<string, string>,
): CalendarEventData[] => events.map((event) => {
    const title = isCanceledEvent(event)
        ? (event.title ? `Abgesagt · ${event.title}` : 'Abgesagt')
        : event.title;
    const categoryUid = Number(event.extendedProps?.eventCategoryId);
    if (!Number.isInteger(categoryUid) || categoryUid <= 0) {
        return {...event, title};
    }

    const categoryColor = getCategoryColor(categoryUid, categoryColors);
    const categoryTextColor = getCategoryTextColor(categoryUid, categoryColors);
    const existingStyles = event.styles ?? event.style ?? [];
    const styles = Array.isArray(existingStyles) ? existingStyles : [existingStyles];

    return {
        ...event,
        title,
        backgroundColor: categoryColor,
        textColor: categoryTextColor,
        styles: [
            ...styles,
            `--xima-category-color:${categoryColor}`,
            `--xima-category-text-color:${categoryTextColor}`,
        ],
    };
});

const getEventStatusClass = (event: CalendarEventData): string[] => {
    const categoryUid = Number(event.extendedProps?.eventCategoryId);
    const status = Number(event.extendedProps?.eventStatus);
    const statusClass = {
        0: 'xima-calendar-event--draft',
        1: 'xima-calendar-event--review',
        2: 'xima-calendar-event--live',
    }[status];

    return [
        ...(Number.isInteger(categoryUid) && categoryUid > 0
            ? ['xima-calendar-event--categorized']
            : []),
        ...(isCanceledEvent(event) ? ['xima-calendar-event--canceled'] : []),
        ...(statusClass ? [statusClass] : []),
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
    const calendarOptions = {
        firstDay: 0,
    };

    const typo3Top = window.top as unknown as Typo3TopWindow;
    const filterWindow = window.top as unknown as CalendarFilterWindow;
    let activeFilters: CalendarFilterSelection = filterWindow.ximaCalendarFilterState ?? {
        types: [],
        categories: [],
        statuses: [],
    };
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
            eventGap: 3,
            height: '100%',
            nowIndicator: true,
            selectable: enableDragNewEvent,
            scrollTime: '08:00:00',
            dayMaxEvents: true,
            moreLinkContent: ({num}: {num: number}) => `+${num} weitere`,
            view: calendarConfig.initialView,
            views: {
                timeGridWeek: {
                    slotMinTime: '00:00:00',
                    slotMaxTime: '24:00:00',
                    slotDuration: '00:15:00',
                    slotLabelInterval: '01:00:00',
                    snapDuration: '00:15:00',
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
                dayGridMonth: 'Month',
                timeGridWeek: 'Week',
                listMonth: 'List',
                today: 'Today',
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
                        url.searchParams.set('types', activeFilters.types.join(','));
                        url.searchParams.set('categories', activeFilters.categories.join(','));
                        url.searchParams.set('statuses', activeFilters.statuses.join(','));

                        const response = await fetch(url, {credentials: 'same-origin'});
                        if (!response.ok) {
                            throw new Error('Calendar events could not be loaded');
                        }

                        const events = await response.json() as CalendarEventData[];
                        currentEvents = applyCategoryColorsToEvents(events, calendarConfig.categoryColors);
                        return currentEvents;
                    },
                },
            ],
            eventClassNames: ({event}: {event: CalendarEventData}) => getEventStatusClass(event),
            eventDidMount: ({event, el}: {
                event: CalendarEventData;
                el: HTMLElement;
            }) => {
                applyCategoryColor(event, el, calendarConfig.categoryColors);

                if (isCanceledEvent(event) && hasConcurrentEvent(event, currentEvents)) {
                    const titleElement = el.querySelector<HTMLElement>('.ec-event-title');
                    if (titleElement) {
                        titleElement.textContent = titleElement.textContent?.replace(/^Abgesagt\s*·\s*/, '[A] ') ?? '[A]';
                    }
                }
            },
            eventClick: detailsController.eventClick,
        },
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
