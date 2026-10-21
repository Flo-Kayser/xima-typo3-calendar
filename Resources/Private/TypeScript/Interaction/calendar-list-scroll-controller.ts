import type {CalendarEventData} from '../Rendering/calendar-event-data';
import {scrollCalendarListToRelevantDate} from './calendar-list-scroll';

type CalendarListView = {
    type: string;
    currentStart: Date;
};

export type CalendarListScrollController = {
    viewChanged(view: CalendarListView): void;
    eventsLoaded(events: CalendarEventData[]): void;
    destroy(): void;
};

export const createCalendarListScrollController = (
    container: HTMLElement,
): CalendarListScrollController => {
    let currentEvents: CalendarEventData[] = [];
    let currentViewStart = new Date();
    let scrollFrame: number | null = null;

    const scheduleScroll = (): void => {
        if (scrollFrame !== null) {
            window.cancelAnimationFrame(scrollFrame);
        }

        scrollFrame = window.requestAnimationFrame(() => {
            scrollFrame = window.requestAnimationFrame(() => {
                scrollFrame = null;
                scrollCalendarListToRelevantDate({
                    container,
                    viewStart: currentViewStart,
                    events: currentEvents,
                });
            });
        });
    };

    return {
        viewChanged(view): void {
            currentViewStart = view.currentStart;

            if (view.type.startsWith('list')) {
                scheduleScroll();
            }
        },

        eventsLoaded(events): void {
            currentEvents = events;
            scheduleScroll();
        },

        destroy(): void {
            if (scrollFrame !== null) {
                window.cancelAnimationFrame(scrollFrame);
            }
        },
    };
};
