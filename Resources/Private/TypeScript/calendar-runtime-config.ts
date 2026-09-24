export type CalendarModalLabels = {
    title: string;
    event: string;
    appointment: string;
    start: string;
    end: string;
    allDay: string;
    create: string;
};

export type CalendarConfig = {
    ajaxUrl: string;
    createEventUrl: string;
    cleanupEventUrl: string;
    appointmentPid: number;
    canCreateEvent: boolean;
    canCreateAppointment: boolean;
    enableDragNewEvent: boolean;
    enableClickNewEvent: boolean;
    defaultStartTime: string;
    defaultEndTime: string;
    defaultAllDay: boolean;
    labels: CalendarModalLabels;
};

const isString = (value: unknown): value is string => typeof value === 'string';
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const isCalendarModalLabels = (value: unknown): value is CalendarModalLabels => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const labels = value as Record<string, unknown>;
    return ['title', 'event', 'appointment', 'start', 'end', 'allDay', 'create']
        .every((key) => isString(labels[key]));
};

const isCalendarConfig = (value: unknown): value is CalendarConfig => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const config = value as Record<string, unknown>;
    return isString(config.ajaxUrl)
        && isString(config.createEventUrl)
        && isString(config.cleanupEventUrl)
        && isNumber(config.appointmentPid)
        && isBoolean(config.canCreateEvent)
        && isBoolean(config.canCreateAppointment)
        && isBoolean(config.enableDragNewEvent)
        && isBoolean(config.enableClickNewEvent)
        && isString(config.defaultStartTime)
        && isString(config.defaultEndTime)
        && isBoolean(config.defaultAllDay)
        && isCalendarModalLabels(config.labels);
};

export function readCalendarConfig(container: HTMLElement): CalendarConfig | null {
    let rawConfig: unknown;
    try {
        rawConfig = JSON.parse(container.dataset.calendarConfig ?? 'null') as unknown;
    } catch {
        return null;
    }

    return isCalendarConfig(rawConfig) ? rawConfig : null;
}
