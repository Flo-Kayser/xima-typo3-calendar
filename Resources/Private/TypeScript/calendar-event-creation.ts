import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import Notification from '@typo3/backend/notification.js';
import Viewport from '@typo3/backend/viewport.js';
import {chooseCalendarCreationType, type CalendarCreationValues} from './calendar-creation-modal';
import type {CalendarConfig} from './calendar-runtime-config';

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
const PENDING_EVENT_STORAGE_KEY = 'xima_calendar_pending_event';
const PENDING_ENTRY_STORAGE_KEY = 'xima_calendar_pending_entry';

export function createCalendarCreationController(
    container: HTMLElement,
    typo3Top: Typo3TopWindow,
    calendarConfig: CalendarConfig,
): {
    select: (selection: CalendarSelection) => void;
    dateClick: (click: CalendarDateClick) => void;
    cleanupPendingCreation: () => Promise<boolean>;
    cancelSelection: () => void;
} {
    let selectionCancelled = false;
    const canCreate = (type: CalendarCreationValues['type']): boolean => (
        calendarConfig.appointmentPid > 0
        && Boolean(calendarConfig.createEventUrl)
        && (type === 'event'
            ? calendarConfig.canCreateEvent && calendarConfig.canCreateAppointment
            : calendarConfig.canCreateAppointment)
    );

    const defaultStartTime = calendarConfig.defaultStartTime;
    const defaultEndTime = calendarConfig.defaultEndTime;
    const defaultAllDay = calendarConfig.defaultAllDay;
    const isMonthView = (): boolean => container.querySelector('.ec-day-grid') !== null;
    const modalLabels = calendarConfig.labels;

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

    const showCreationError = (): void => {
        Notification.error(
            'Error',
            'The event could not be created. Please try again.',
        );
    };

    const createEvent = async (selection: CalendarCreationValues): Promise<void> => {
        if (!canCreate(selection.type)) {
            return;
        }

        const response = await new AjaxRequest(calendarConfig.createEventUrl).post({
            start: Math.floor(selection.start.getTime() / 1000),
            end: Math.floor(selection.end.getTime() / 1000),
            allDay: selection.allDay ? 1 : 0,
            type: selection.type,
        });
        const result = await response.resolve() as CreateEventResponse;

        if (!result.success) {
            throw new Error('Event creation failed');
        }

        if (selection.type === 'event-appointment' && result.entryUid) {
            sessionStorage.setItem(PENDING_ENTRY_STORAGE_KEY, String(result.entryUid));
            openRecordForm('tx_ximatypo3calendar_domain_model_entry', result.entryUid);
        } else if (result.eventUid) {
            sessionStorage.setItem(PENDING_EVENT_STORAGE_KEY, String(result.eventUid));
            openRecordForm(EVENT_TABLE, result.eventUid);
        } else {
            throw new Error('Creation response is incomplete');
        }
    };

    const openCreationDialog = (
        start: Date,
        end: Date,
        allDay: boolean,
    ): void => {
        void chooseCalendarCreationType(modalLabels, start, end, allDay)
            .then((creation) => {
                if (creation !== null) {
                    return createEvent(creation);
                }
            })
            .catch(showCreationError);
    };

    const cleanupPendingCreation = async (): Promise<boolean> => {
        const eventUid = sessionStorage.getItem(PENDING_EVENT_STORAGE_KEY);
        const entryUid = sessionStorage.getItem(PENDING_ENTRY_STORAGE_KEY);
        const cleanupUrl = calendarConfig.cleanupEventUrl;
        if ((!eventUid && !entryUid) || !cleanupUrl) {
            return false;
        }

        try {
            const url = new URL(cleanupUrl, document.location.origin);
            if (eventUid) {
                url.searchParams.set('eventUid', eventUid);
            } else if (entryUid) {
                url.searchParams.set('entryUid', entryUid);
            }
            const response = await new AjaxRequest(url).get();
            const result = await response.resolve() as { success?: boolean };
            if (result.success) {
                if (eventUid) {
                    sessionStorage.removeItem(PENDING_EVENT_STORAGE_KEY);
                } else {
                    sessionStorage.removeItem(PENDING_ENTRY_STORAGE_KEY);
                }
                return true;
            }
        } catch {
        }

        return false;
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
            openCreationDialog(preparedSelection.start, preparedSelection.end, preparedSelection.allDay);
        },
        dateClick: (click: CalendarDateClick): void => {
            const start = new Date(click.date);
            const end = new Date(start.getTime() + (click.allDay ? 86400000 : 1800000));
            const preparedSelection = prepareSelection({start, end, allDay: click.allDay});
            openCreationDialog(preparedSelection.start, preparedSelection.end, preparedSelection.allDay);
        },
        cleanupPendingCreation,
        cancelSelection,
    };
}
