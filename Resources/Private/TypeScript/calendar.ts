import Calendar from '@event-calendar/core';
import DayGrid from '@event-calendar/day-grid';
import TimeGrid from '@event-calendar/time-grid';
import List from '@event-calendar/list';
import Interaction from '@event-calendar/interaction';
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

const startOfDay = (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
};

const getDayCellDate = (cell: HTMLElement): Date | null => {
    const value = cell.querySelector('time[datetime]')?.getAttribute('datetime');
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : startOfDay(date);
};

const applyMultiDayWidth = (event: CalendarEventData, element: HTMLElement): void => {
    if (!event.start || !event.end) {
        return;
    }

    if (element.closest('.ec-popup')) {
        return;
    }

    const day = element.closest<HTMLElement>('.ec-day');
    const row = day?.parentElement;
    if (!day || !row || !row.classList.contains('ec-days')) {
        return;
    }

    const cells = Array.from(row.querySelectorAll<HTMLElement>(':scope > .ec-day'));
    const startIndex = cells.indexOf(day);
    const endDate = startOfDay(new Date(event.end));
    if (startIndex < 0 || Number.isNaN(endDate.getTime())) {
        return;
    }

    let endIndex = startIndex;
    while (endIndex + 1 < cells.length) {
        const nextDate = getDayCellDate(cells[endIndex + 1]);
        if (!nextDate || nextDate > endDate) {
            break;
        }
        endIndex++;
    }

    if (endIndex === startIndex) {
        return;
    }

    const targetEvents = cells[endIndex].querySelector<HTMLElement>(':scope > .ec-events');
    const targetRight = targetEvents?.getBoundingClientRect().right
        ?? cells[endIndex].getBoundingClientRect().right;
    const eventLeft = element.getBoundingClientRect().left;
    if (targetRight === undefined || targetRight <= eventLeft) {
        return;
    }

    element.style.width = `${targetRight - eventLeft}px`;
};

const applyEventSpacing = (): void => {
    document.querySelectorAll<HTMLElement>('#xima-calendar-mount .ec-day-grid .ec-event:not(.ec-preview)').forEach((element) => {
        const start = element.dataset.ximaEventStart;
        const end = element.dataset.ximaEventEnd;
        if (start && end) {
            applyMultiDayWidth({start, end}, element);
        }

        const categoryColor = element.dataset.ximaCategoryColor;
        const categoryTextColor = element.dataset.ximaCategoryTextColor;
        if (categoryColor && categoryTextColor) {
            element.style.setProperty('--xima-category-color', categoryColor);
            element.style.setProperty('--xima-category-text-color', categoryTextColor);
        }

        const nativeMargin = Number.parseFloat(element.style.marginTop);
        if (Number.isNaN(nativeMargin) || nativeMargin <= 5) {
            return;
        }

        const appliedMargin = Number.parseFloat(element.dataset.ximaAppliedMarginTop ?? '');
        if (appliedMargin === nativeMargin) {
            return;
        }

        const spacing = nativeMargin <= 35
            ? 2
            : nativeMargin <= 65
                ? 4
                : 6;
        const margin = nativeMargin + spacing;
        element.style.marginTop = `${margin}px`;
        element.dataset.ximaAppliedMarginTop = `${margin}`;
    });
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

    const ec = new Calendar({
        target: container,
        props: {
            plugins: [DayGrid, TimeGrid, List, Interaction],
            options: {
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
                eventAllUpdated: () => window.requestAnimationFrame(applyEventSpacing),
                eventDidMount: ({event, el}: {
                    event: CalendarEventData;
                    el: HTMLElement;
                }) => {
                    applyCategoryColor(event, el, calendarConfig.categoryColors);
                    if (event.start) {
                        el.dataset.ximaEventStart = String(event.start);
                    }
                    if (event.end) {
                        el.dataset.ximaEventEnd = String(event.end);
                    }
                    applyMultiDayWidth(event, el);
                    window.requestAnimationFrame(() => applyMultiDayWidth(event, el));
                    window.requestAnimationFrame(applyEventSpacing);
                },
                eventClick: detailsController.eventClick,
            },
        },
    });

    createCalendarInteractionController(container, ec, creationController, {
        firstDay: calendarOptions.firstDay,
        enableDragNewEvent,
    });
    window.addEventListener('resize', () => window.requestAnimationFrame(applyEventSpacing));
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
