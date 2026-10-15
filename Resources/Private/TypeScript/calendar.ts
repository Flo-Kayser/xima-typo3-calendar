import {createCalendar, DayGrid, destroyCalendar, Interaction, List, TimeGrid,} from '@event-calendar/core';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import DocumentService from '@typo3/core/document-service.js';
import Notification from '@typo3/backend/notification.js';
import {createCalendarCreationController} from './Event/calendar-event-creation';
import {createCalendarDetailsController} from './Event/calendar-details';
import {createCalendarInteractionController} from './Interaction/calendar-interaction';
import {readCalendarConfig, type Typo3TopWindow} from './Configuration/calendar-runtime-config';
import type {CalendarFilterConfiguration, CalendarFilterSelection} from './Filter/calendar-filter-state';
import {createCalendarEventSource} from './Data/calendar-event-source';

import type {CalendarEventData} from './Rendering/calendar-event-data';
import {
    createCalendarEventRenderer,
} from './Rendering/calendar-event-renderer';

type EventCalendarTheme = Record<string, string | string[]>;
type EventCalendarButtonText = Record<string, string>;
type CalendarFilterWindow = Window & {
    ximaCalendarFilterState?: CalendarFilterSelection;
    ximaCalendarFilterConfiguration?: CalendarFilterConfiguration;
};

const calendarCleanups = new WeakMap<HTMLElement, () => Promise<void>>();

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
        firstDay: 0 as const,
    };

    const typo3Top = window.top as unknown as Typo3TopWindow;
    const filterWindow = window.top as unknown as CalendarFilterWindow;
    let activeFilters: CalendarFilterSelection = filterWindow.ximaCalendarFilterState ?? {
        filters: {},
    };
    let filterConfiguration: CalendarFilterConfiguration =
        filterWindow.ximaCalendarFilterConfiguration ?? {};

    let currentEvents: CalendarEventData[] = [];
    const eventRenderer = createCalendarEventRenderer({
        locale: calendarConfig.locale,
        filterColors: calendarConfig.filterColors,
        appearanceSource: calendarConfig.eventAppearance.appearanceSource,
        colorSource: calendarConfig.eventAppearance.colorSource,
        iconSource: calendarConfig.eventAppearance.iconSource,
        getFilterConfiguration: () => filterConfiguration,
    });

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
            eventSources: [createCalendarEventSource({
                ajaxUrl: calendarConfig.ajaxUrl,
                getActiveFilters: () => activeFilters,
                renderer: eventRenderer,
                onEventsLoaded: (events) => {
                    currentEvents = events;
                },
            })],
            eventClassNames: ({event}: {event: CalendarEventData}) => eventRenderer.getClassNames(event),
            eventDidMount: ({event, el}: {
                event: CalendarEventData;
                el: HTMLElement;
            }) => {
                eventRenderer.didMount(event, el, currentEvents);
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
    filterWindow.document.addEventListener('typo3-module-loaded', cleanupPendingCreation, true);
    filterWindow.addEventListener('xima-calendar-filter-changed', onFilterChanged);

    const cleanup = async (): Promise<void> => {
        if (destroyed) {
            return;
        }

        destroyed = true;
        window.removeEventListener('pageshow', cleanupPendingCreation);
        window.removeEventListener('popstate', cleanupPendingCreation);
        filterWindow.document.removeEventListener('typo3-module-loaded', cleanupPendingCreation, true);
        filterWindow.removeEventListener('xima-calendar-filter-changed', onFilterChanged);
        interactionController.destroy();
        calendarCleanups.delete(container);
        await destroyCalendar(ec);
    };

    calendarCleanups.set(container, cleanup);
});
