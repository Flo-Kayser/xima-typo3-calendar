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
    createAllowed: boolean;
    enableDragNewEvent: boolean;
    enableClickNewEvent: boolean;
    defaultStartTime: string;
    defaultEndTime: string;
    defaultAllDay: boolean;
    labels: CalendarModalLabels;
};

const defaultConfig: CalendarConfig = {
    ajaxUrl: '',
    createEventUrl: '',
    cleanupEventUrl: '',
    appointmentPid: 0,
    createAllowed: false,
    enableDragNewEvent: false,
    enableClickNewEvent: false,
    defaultStartTime: '09:00',
    defaultEndTime: '09:30',
    defaultAllDay: false,
    labels: {
        title: 'Create new record',
        event: 'Event',
        appointment: 'Event Appointment',
        start: 'Start',
        end: 'End',
        allDay: 'All-day',
        create: 'Create',
    },
};

export function readCalendarConfig(container: HTMLElement): CalendarConfig {
    let rawConfig: Partial<CalendarConfig> = {};
    try {
        rawConfig = JSON.parse(container.dataset.calendarConfig ?? '{}') as Partial<CalendarConfig>;
    } catch {
        return defaultConfig;
    }

    return {
        ...defaultConfig,
        ...rawConfig,
        labels: {
            ...defaultConfig.labels,
            ...(rawConfig.labels ?? {}),
        },
    };
}
