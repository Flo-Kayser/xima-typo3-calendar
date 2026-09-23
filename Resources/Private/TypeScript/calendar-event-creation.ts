import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import Viewport from '@typo3/backend/viewport.js';
import {chooseCalendarCreationType, type CalendarCreationValues} from './calendar-creation-modal';

type CalendarSelection = {
    start: Date;
    end: Date;
    allDay: boolean;
};
type CalendarDateClick = { date: Date; allDay: boolean };
type CreateEventResponse = { success: boolean; eventUid?: number; entryUid?: number };

type Typo3TopWindow = Window & {
    TYPO3: {
        settings: { FormEngine: { moduleUrl: string } };
        ModuleMenu: { App: { getCurrentModule: () => string } };
    };
};

const EVENT_TABLE = 'tx_ximatypo3calendar_domain_model_event';
const FALLBACK_START_TIME = '09:00';
const FALLBACK_END_TIME = '09:30';
const PENDING_EVENT_STORAGE_KEY = 'xima_calendar_pending_event';

export function createCalendarCreationController(
    container: HTMLElement,
    typo3Top: Typo3TopWindow,
): {
    select: (selection: CalendarSelection) => void;
    dateClick: (click: CalendarDateClick) => void;
    cleanupPendingEvent: () => Promise<void>;
    cancelSelection: () => void;
} {
    let selectionCancelled = false;
    const canCreateEvents = (): boolean => (
        Number(container.dataset.appointmentPid) > 0
        && container.dataset.createAllowed === '1'
        && Boolean(container.dataset.createEventUrl)
    );

    const isValidTime = (value: string): boolean => {
        const match = value.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return false;
        }

        return Number(match[1]) < 24 && Number(match[2]) < 60;
    };

    const configuredStartTime = container.dataset.newEventDefaultStartTime || '';
    const configuredEndTime = container.dataset.newEventDefaultEndTime || '';
    const defaultStartTime = isValidTime(configuredStartTime) ? configuredStartTime : FALLBACK_START_TIME;
    const defaultEndTime = isValidTime(configuredEndTime) ? configuredEndTime : FALLBACK_END_TIME;
    const defaultAllDay = container.dataset.newEventDefaultAllDay === '1';
    const isMonthView = (): boolean => container.querySelector('.ec-day-grid') !== null;
    const modalLabels = {
        title: container.dataset.newEventTypeModalTitle || 'Create new record',
        event: container.dataset.newEventTypeEventLabel || 'Event',
        appointment: container.dataset.newEventTypeAppointmentLabel || 'Event Appointment',
        start: container.dataset.newEventStartLabel || 'Start',
        end: container.dataset.newEventEndLabel || 'End',
        allDay: container.dataset.newEventAllDayLabel || 'All-day',
        create: container.dataset.newEventCreateLabel || 'Create',
    };

    const setTime = (date: Date, value: string): void => {
        const match = value.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return;
        }

        date.setHours(Number(match[1]), Number(match[2]), 0, 0);
    };

    const openRecordForm = (table: string, uid: number): void => {
        const params = new URLSearchParams();
        params.set(`edit[${table}][${uid}]`, 'edit');
        params.set('module', typo3Top.TYPO3.ModuleMenu.App.getCurrentModule());
        params.set('returnUrl', document.location.pathname + document.location.search);

        const moduleUrl = typo3Top.TYPO3.settings.FormEngine.moduleUrl;
        Viewport.ContentContainer.setUrl(`${moduleUrl}&${params.toString()}`);
    };

    const createEvent = async (selection: CalendarCreationValues): Promise<void> => {
        if (!canCreateEvents()) {
            return;
        }

        const response = await new AjaxRequest(container.dataset.createEventUrl as string).post({
            start: Math.floor(selection.start.getTime() / 1000),
            end: Math.floor(selection.end.getTime() / 1000),
            allDay: selection.allDay ? 1 : 0,
            type: selection.type,
        });
        const result = await response.resolve() as CreateEventResponse;

        if (result.success && result.eventUid) {
            sessionStorage.setItem(PENDING_EVENT_STORAGE_KEY, String(result.eventUid));
            if (selection.type === 'event-appointment' && result.entryUid) {
                openRecordForm('tx_ximatypo3calendar_domain_model_entry', result.entryUid);
            } else {
                openRecordForm(EVENT_TABLE, result.eventUid);
            }
        }
    };

    const cleanupPendingEvent = async (): Promise<void> => {
        const eventUid = sessionStorage.getItem(PENDING_EVENT_STORAGE_KEY);
        const cleanupUrl = container.dataset.cleanupEventUrl;
        if (!eventUid || !cleanupUrl) {
            return;
        }

        try {
            const url = new URL(cleanupUrl, document.location.origin);
            url.searchParams.set('eventUid', eventUid);
            const response = await new AjaxRequest(url).get();
            const result = await response.resolve() as { success?: boolean };
            if (result.success) {
                sessionStorage.removeItem(PENDING_EVENT_STORAGE_KEY);
            }
        } catch {
            // Keep the UID so cleanup can be retried on the next return.
        }
    };

    const cancelSelection = (): void => {
        selectionCancelled = true;
    };

    const prepareSelection = (selection: CalendarSelection, forceAllDay = false): CalendarSelection => {
        let start = new Date(selection.start);
        let end = new Date(selection.end);
        const selectionIsAllDay = selection.allDay;
        const allDay = forceAllDay || (selectionIsAllDay && defaultAllDay);

        if (selectionIsAllDay) {
            if (allDay) {
                start.setHours(0, 0, 0, 0);
                end = new Date(end);
                end.setHours(0, 0, 0, 0);
            } else {
                setTime(start, defaultStartTime);
                end = new Date(end);
                end.setDate(end.getDate() - 1);
                setTime(end, defaultEndTime);
                if (end <= start) {
                    end.setDate(end.getDate() + 1);
                }
            }
        }

        return {start, end, allDay};
    };

    return {
        select: (selection: CalendarSelection): void => {
            if (selectionCancelled) {
                selectionCancelled = false;
                return;
            }
            const startDay = new Date(selection.start);
            const endDay = new Date(selection.end);
            startDay.setHours(0, 0, 0, 0);
            endDay.setHours(0, 0, 0, 0);
            const selectedDayCount = Math.round((endDay.getTime() - startDay.getTime()) / 86400000);
            const forceAllDay = isMonthView() && selection.allDay && selectedDayCount >= 2;
            const preparedSelection = prepareSelection(selection, forceAllDay);
            void chooseCalendarCreationType(modalLabels, preparedSelection.start, preparedSelection.end, preparedSelection.allDay).then((creation) => {
                if (creation !== null) {
                    void createEvent(creation);
                }
            });
        },
        dateClick: (click: CalendarDateClick): void => {
            const start = new Date(click.date);
            const end = new Date(start.getTime() + (click.allDay ? 86400000 : 1800000));
            const preparedSelection = prepareSelection({start, end, allDay: click.allDay});
            void chooseCalendarCreationType(modalLabels, preparedSelection.start, preparedSelection.end, preparedSelection.allDay).then((creation) => {
                if (creation !== null) {
                    void createEvent(creation);
                }
            });
        },
        cleanupPendingEvent,
        cancelSelection,
    };
}
