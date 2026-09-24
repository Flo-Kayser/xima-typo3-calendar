import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import TimeGrid from '@event-calendar/time-grid';
import List from '@event-calendar/list';
import Interaction from '@event-calendar/interaction';
import DocumentService from '@typo3/core/document-service.js';
import Notification from '@typo3/backend/notification.js';
import {createCalendarCreationController} from './calendar-event-creation';
import {createCalendarDetailsController} from './calendar-details';
import {createCalendarInteractionController} from './calendar-interaction';
import {readCalendarConfig} from './calendar-runtime-config';

type EventCalendarTheme = Record<string, string | string[]>;
type EventCalendarButtonText = Record<string, string>;
type Typo3TopWindow = Window & {
    TYPO3: {
        settings: {
            FormEngine: {
                moduleUrl: string;
            };
        };
        ModuleMenu: {
            App: {
                getCurrentModule: () => string;
            };
        };
    };
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
    const detailsController = createCalendarDetailsController(container, typo3Top);
    const creationController = createCalendarCreationController(container, typo3Top, calendarConfig);

    const ec = new Calendar({
        target: container,
        props: {
            plugins: [DayGrid, TimeGrid, List, Interaction],
            options: {
                ...calendarOptions,
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
                        url: calendarConfig.ajaxUrl,
                    },
                ],
                eventClick: detailsController.eventClick,
            },
        },
    });

    createCalendarInteractionController(container, ec, creationController, {
        firstDay: calendarOptions.firstDay,
        enableDragNewEvent,
    });

    const cleanupPendingCreation = (): void => {
        void creationController.cleanupPendingCreation().then((cleanedUp) => {
            if (cleanedUp) {
                ec.refetchEvents();
            }
        });
    };
    cleanupPendingCreation();
    window.addEventListener('pageshow', cleanupPendingCreation);

    document.querySelectorAll<HTMLInputElement>('.xima-cal-filter__checkbox').forEach(cb => {
        cb.addEventListener('change', () => ec.refetchEvents());
    });
});
