import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import type {CalendarFilterState} from './calendar-filter-state';

export class CalendarFilterStatePersistence {
  private saveQueue: Promise<void> = Promise.resolve();

  public constructor(
    private readonly url: string,
  ) {}

  public save(state: CalendarFilterState): void {
    const payload = {
      activeTypes: [...state.activeTypes],
      activeStatuses: [...state.activeStatuses],
      trees: Object.fromEntries(
        Object.entries(state.trees).map(([identifier, tree]) => [
          identifier,
          {
            activeItems: [...tree.activeItems],
            expandedItems: {...tree.expandedItems},
          },
        ]),
      ),
    };

    this.saveQueue = this.saveQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          const response = await new AjaxRequest(this.url).post(payload);
          await response.resolve();
        } catch (error) {
          console.error('Calendar filter state could not be saved', error);
        }
      });
  }
}
