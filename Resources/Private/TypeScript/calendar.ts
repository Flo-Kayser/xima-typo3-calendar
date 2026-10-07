import {
    createCalendar,
    DayGrid,
    Interaction,
    List,
    TimeGrid,
} from '@event-calendar/core';
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
    title?: string;
    start?: string | Date;
    end?: string | Date;
    extendedProps?: Record<string, unknown>;
    backgroundColor?: string;
    textColor?: string;
};

const isCanceledEvent = (event: CalendarEventData): boolean => {
    const canceled = event.extendedProps?.appointmentCanceled;
    return canceled === true || canceled === 1 || canceled === '1';
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
): CalendarEventData[] => events.map((event) => {
    const title = isCanceledEvent(event)
        ? (event.title ? `Abgesagt · ${event.title}` : 'Abgesagt')
        : event.title;

    return {
        ...event,
        title,
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

DocumentService.ready().then(() => {
    const container = document.getElementById('xima-calendar-mount');
    if (!container) {
        return;
    }

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
    const detailsController = createCalendarDetailsController(container, typo3Top);
    const creationController = createCalendarCreationController(container, typo3Top, calendarConfig);

    const ec = createCalendar(
        container,
        [DayGrid, TimeGrid, List, Interaction],
        {
            ...calendarOptions,
            eventGap: 3,
            height: '100%',
            selectable: enableDragNewEvent,
            scrollTime: '08:00:00',
            dayMaxEvents: true,
            moreLinkContent: ({num}: {num: number}) => `+${num} weitere`,
            view: 'dayGridMonth',
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
            datesSet: detailsController.datesSet,
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
                        return applyCategoryColorsToEvents(events);
                    },
                },
            ],
            eventClassNames: ({event}: {event: CalendarEventData}) => getEventStatusClass(event),
            eventDidMount: ({event, el}: {
                event: CalendarEventData;
                el: HTMLElement;
            }) => {
                applyCategoryColor(event, el, calendarConfig.categoryColors);
            },
            eventClick: detailsController.eventClick,
        },
    );

    createCalendarInteractionController(container, ec, creationController, {
        firstDay: calendarOptions.firstDay,
        enableDragNewEvent,
    });
    creationController.setClearCalendarSelection(() => ec.unselect());

    const cleanupPendingCreation = (): void => {
        void creationController.cleanupPendingCreation().then((cleanedUp) => {
            if (cleanedUp) {
                ec.refetchEvents();
            }
        });
    };
    cleanupPendingCreation();
    window.addEventListener('pageshow', cleanupPendingCreation);
    window.addEventListener('popstate', cleanupPendingCreation);
    window.top.document.addEventListener('typo3-module-loaded', cleanupPendingCreation, true);

    filterWindow.addEventListener('xima-calendar-filter-changed', (event: Event) => {
        const selection = (event as CustomEvent<CalendarFilterSelection>).detail;
        if (!selection) {
            return;
        }

        activeFilters = selection;
        ec.refetchEvents();
    });
});
