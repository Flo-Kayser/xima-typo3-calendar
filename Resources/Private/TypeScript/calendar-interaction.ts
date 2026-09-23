type CalendarApi = {
    getView: () => { currentStart?: Date };
    setOption: (name: string, value: unknown) => CalendarApi;
    unselect: () => CalendarApi;
};

type CalendarCreationController = {
    cancelSelection: () => void;
};

type CalendarInteractionOptions = {
    firstDay: number;
    enableDragNewEvent: boolean;
};

export function createCalendarInteractionController(
    container: HTMLElement,
    calendar: CalendarApi,
    creationController: CalendarCreationController,
    options: CalendarInteractionOptions,
): {destroy: () => void} {
    const highlightCurrentWeekday = (): void => {
        const today = new Date();
        const currentWeekday = (today.getDay() - options.firstDay + 7) % 7;
        const weekdayHeaders = container.querySelectorAll<HTMLElement>('.ec-header .ec-days .ec-day');

        weekdayHeaders.forEach((header, index) => {
            header.classList.toggle('active', index === currentWeekday);
        });
    };

    const clearSelectionOverlay = (): void => {
        document.querySelectorAll('.xima-calendar-selection-overlay').forEach(overlay => overlay.remove());
    };

    const hideSelectionPreview = (): void => {
        container.classList.add('xima-calendar-selection-cancelled');
        container.querySelectorAll<HTMLElement>('.ec-event.ec-preview, .ec-events.ec-preview').forEach(preview => {
            preview.remove();
        });
        clearSelectionOverlay();
    };

    const resetSelectionPreview = (): void => {
        container.classList.remove('xima-calendar-selection-cancelled');
    };

    const appendOverlay = (left: number, top: number, right: number, bottom: number): void => {
        const overlay = document.createElement('div');
        overlay.className = 'xima-calendar-selection-overlay';
        overlay.style.left = `${left}px`;
        overlay.style.top = `${top}px`;
        overlay.style.width = `${right - left}px`;
        overlay.style.height = `${bottom - top}px`;
        document.body.appendChild(overlay);
    };

    const updateSelectionOverlay = (): void => {
        clearSelectionOverlay();

        const calendarElement = container.querySelector<HTMLElement>('.ec.ec-selecting');
        if (!calendarElement) {
            return;
        }

        if (calendarElement.classList.contains('ec-time-grid')) {
            const previews = Array.from(calendarElement.querySelectorAll<HTMLElement>('.ec-body .ec-event.ec-preview'));
            if (previews.length === 0) {
                return;
            }

            const previewRects = previews.map(preview => preview.getBoundingClientRect());
            const selectedDays = Array.from(calendarElement.querySelectorAll<HTMLElement>('.ec-body .ec-day'))
                .filter(day => {
                    const dayRect = day.getBoundingClientRect();
                    return previewRects.some(previewRect =>
                        dayRect.right > previewRect.left && dayRect.left < previewRect.right,
                    );
                });
            if (selectedDays.length === 0) {
                return;
            }

            const bodyRect = calendarElement.querySelector<HTMLElement>('.ec-body')?.getBoundingClientRect();
            if (!bodyRect) {
                return;
            }

            previews.forEach((preview, index) => {
                const previewRect = previewRects[index];
                const day = selectedDays.find(candidate => {
                    const dayRect = candidate.getBoundingClientRect();
                    return dayRect.right > previewRect.left && dayRect.left < previewRect.right;
                });
                if (!day) {
                    return;
                }

                const dayRect = day.getBoundingClientRect();
                const left = Math.max(dayRect.left, bodyRect.left);
                const right = Math.min(dayRect.right, bodyRect.right);
                const top = Math.max(previewRect.top, bodyRect.top);
                const bottom = Math.min(previewRect.bottom, bodyRect.bottom);
                if (right <= left || bottom <= top) {
                    return;
                }

                appendOverlay(left, top, right, bottom);
            });
            return;
        }

        if (!calendarElement.classList.contains('ec-day-grid')) {
            return;
        }

        const previews = Array.from(calendarElement.querySelectorAll<HTMLElement>('.ec-events.ec-preview > .ec-event'));
        if (previews.length === 0) {
            return;
        }

        const previewRects = previews.map(preview => preview.getBoundingClientRect());
        const selectedDays = Array.from(calendarElement.querySelectorAll<HTMLElement>('.ec-body .ec-day'))
            .filter(day => {
                const dayRect = day.getBoundingClientRect();
                return previewRects.some(previewRect =>
                    dayRect.right > previewRect.left && dayRect.left < previewRect.right
                    && dayRect.bottom > previewRect.top && dayRect.top < previewRect.bottom,
                );
            });

        const rows = new Map<number, DOMRect[]>();
        selectedDays.forEach(day => {
            const rect = day.getBoundingClientRect();
            const row = Math.round(rect.top);
            const rowRects = rows.get(row) ?? [];
            rowRects.push(rect);
            rows.set(row, rowRects);
        });

        rows.forEach(rects => {
            appendOverlay(
                Math.min(...rects.map(rect => rect.left)),
                Math.min(...rects.map(rect => rect.top)),
                Math.max(...rects.map(rect => rect.right)),
                Math.max(...rects.map(rect => rect.bottom)),
            );
        });
    };

    let selectionOverlayFrame: number | undefined;
    const scheduleSelectionOverlayUpdate = (): void => {
        if (selectionOverlayFrame !== undefined) {
            return;
        }
        selectionOverlayFrame = requestAnimationFrame(() => {
            selectionOverlayFrame = undefined;
            updateSelectionOverlay();
        });
    };

    let monthNavigationLocked = false;
    const handleSelectionMonthHover = (event: PointerEvent): void => {
        if (!options.enableDragNewEvent || event.buttons === 0) {
            monthNavigationLocked = false;
            return;
        }

        const calendarElement = container.querySelector<HTMLElement>('.ec.ec-selecting');
        const body = calendarElement?.querySelector<HTMLElement>('.ec-body');
        if (!calendarElement || !body) {
            monthNavigationLocked = false;
            return;
        }

        const bodyRect = body.getBoundingClientRect();
        const dayRects = Array.from(calendarElement.querySelectorAll<HTMLElement>('.ec-body .ec-day'))
            .map(day => day.getBoundingClientRect());
        if (dayRects.length === 0) {
            monthNavigationLocked = false;
            return;
        }

        let passedRightEdge = false;
        let passedLeftEdge = false;
        if (calendarElement.classList.contains('ec-time-grid')) {
            const pointerInBody = event.clientY >= bodyRect.top && event.clientY <= bodyRect.bottom;
            passedRightEdge = event.clientX >= bodyRect.right && pointerInBody;
            passedLeftEdge = event.clientX <= bodyRect.left && pointerInBody;
        } else {
            const rows = new Map<number, DOMRect[]>();
            dayRects.forEach(rect => {
                const row = Math.round(rect.top);
                const rowRects = rows.get(row) ?? [];
                rowRects.push(rect);
                rows.set(row, rowRects);
            });

            const rowBounds = Array.from(rows.entries()).sort(([firstRow], [secondRow]) => firstRow - secondRow);
            const firstRowRects = rowBounds[0][1];
            const lastRowRects = rowBounds[rowBounds.length - 1][1];
            const firstRowTop = Math.min(...firstRowRects.map(rect => rect.top));
            const firstRowBottom = Math.max(...firstRowRects.map(rect => rect.bottom));
            const lastRowTop = Math.min(...lastRowRects.map(rect => rect.top));
            const lastRowBottom = Math.max(...lastRowRects.map(rect => rect.bottom));
            const pointerInFirstRow = event.clientY >= firstRowTop && event.clientY <= firstRowBottom;
            const pointerInLastRow = event.clientY >= lastRowTop && event.clientY <= lastRowBottom;
            passedRightEdge = event.clientX >= bodyRect.right && pointerInLastRow;
            passedLeftEdge = event.clientX <= bodyRect.left && pointerInFirstRow;
        }
        if (!passedRightEdge && !passedLeftEdge) {
            monthNavigationLocked = false;
            return;
        }
        if (monthNavigationLocked) {
            return;
        }

        const currentStart = calendar.getView().currentStart;
        if (!currentStart) {
            return;
        }

        const nextDate = new Date(currentStart);
        if (calendarElement.classList.contains('ec-time-grid')) {
            nextDate.setDate(nextDate.getDate() + (passedRightEdge ? 7 : -7));
        } else {
            nextDate.setMonth(nextDate.getMonth() + (passedRightEdge ? 1 : -1));
        }
        monthNavigationLocked = true;
        calendar.setOption('date', nextDate);
        scheduleSelectionOverlayUpdate();
    };

    const calendarObserver = new MutationObserver(() => {
        highlightCurrentWeekday();
        scheduleSelectionOverlayUpdate();
    });
    const onPointerUp = (): void => {
        window.setTimeout(() => {
            clearSelectionOverlay();
            resetSelectionPreview();
        }, 0);
    };
    const onPointerCancel = (): void => {
        clearSelectionOverlay();
        resetSelectionPreview();
    };
    const cancelSelectionOnEscape = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !container.querySelector('.ec.ec-selecting')) {
            return;
        }

        creationController.cancelSelection();
        hideSelectionPreview();
        calendar.unselect();
        window.dispatchEvent(new PointerEvent('pointercancel', {isPrimary: true}));
        event.preventDefault();
        event.stopPropagation();
    };

    calendarObserver.observe(container, {childList: true, subtree: true});
    requestAnimationFrame(highlightCurrentWeekday);
    container.addEventListener('pointermove', scheduleSelectionOverlayUpdate);
    document.addEventListener('pointermove', handleSelectionMonthHover);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerCancel);
    document.addEventListener('keydown', cancelSelectionOnEscape, true);

    return {
        destroy: (): void => {
            calendarObserver.disconnect();
            clearSelectionOverlay();
            container.removeEventListener('pointermove', scheduleSelectionOverlayUpdate);
            document.removeEventListener('pointermove', handleSelectionMonthHover);
            container.removeEventListener('pointerup', onPointerUp);
            container.removeEventListener('pointercancel', onPointerCancel);
            document.removeEventListener('keydown', cancelSelectionOnEscape, true);
        },
    };
}
