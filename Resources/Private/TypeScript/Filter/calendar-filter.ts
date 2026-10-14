import {html, LitElement, nothing} from 'lit';
import {type ColorOverrides, getColor} from '../color-utils';

import './components/calendar-filter-toolbar';
import './components/calendar-filter-tree';
import './components/calendar-filter-checkbox-list';
import type {TreeStateChangePayload} from './components/calendar-filter-tree';
import type {CheckboxListChangePayload} from './components/calendar-filter-checkbox-list';
import {CalendarFilterStatePersistence} from './services/calendar-filter-state-persistence';
import {
  isCalendarFilterResponse,
  requestCalendarFilterConfiguration,
} from './services/calendar-filter-configuration';
import {
  createFilterSelection,
  updateCheckboxListState,
  updateTreeState,
} from './services/calendar-filter-state-manager';

import type {
  CalendarFilter,
  CalendarFilterConfiguration,
  CalendarFilterSelection,
  CalendarFilterState,
  TreeCalendarFilter,
} from './calendar-filter-state';

type Typo3TopWindow = Window & {
  ximaCalendarFilterState?: CalendarFilterSelection;
  TYPO3?: {
    lang?: Record<string, string>;
    settings?: {
      ajaxUrls?: {
        xima_calendar_filter_options?: string;
        xima_calendar_filter_state?: string;
      };
      ximaCalendar?: {
        filterOptionsUrl?: string;
        filterStateUrl?: string;
        filterColors?: ColorOverrides;
        locale?: string;
      };
    };
  };
};

export const navigationComponentName =
  'xima-calendar-filter-element';

export class CalendarFilterElement extends LitElement {
  private filterConfiguration: CalendarFilterConfiguration | null = null;

  private filterState: CalendarFilterState | null = null;

  private filterLoadError = false;

  private filterStatePersistence: CalendarFilterStatePersistence | null = null;


  public connectedCallback(): void {
    super.connectedCallback();
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const stateUrl = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state
      ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterStateUrl;
    if (stateUrl) {
      this.filterStatePersistence = new CalendarFilterStatePersistence(stateUrl);
    }

    void this.loadFilterConfiguration();
  }

  public createRenderRoot(): HTMLElement {
    return this;
  }

  public render() {
    return html`
      <link rel="stylesheet" href="${new URL('../../Css/calendar-filter.css', import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration === null
            ? nothing
            : Object.values(this.filterConfiguration).map((filter) => this.renderFilter(filter))}
        </div>
      </div>
    `;
  }

  private renderTreeFilter(tree: TreeCalendarFilter) {
    if (tree.items.length === 0) {
      return nothing;
    }

    const treeState = this.filterState?.trees[tree.identifier] ?? {
      activeItems: [],
      expandedItems: {},
    };
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const filterColors = typo3Top.TYPO3?.settings?.ximaCalendar?.filterColors ?? {};
    const items = tree.items.map((item) => ({
      ...item,
      color: tree.colorCoded
        ? getColor(tree.identifier, item.value, filterColors)
        : undefined,
    }));

    return html`
      <section class="xima-calendar-filter__section">
        <h3>${tree.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${tree.identifier}
          .items=${items}
          .activeItems=${treeState.activeItems}
          .expandedItems=${treeState.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `;
  }

  private renderFilter(filter: CalendarFilter) {
    return filter.type === 'tree'
      ? this.renderTreeFilter(filter)
      : this.renderCheckboxListFilter(filter);
  }

  private handleTreeStateChange(
    event: CustomEvent<TreeStateChangePayload>,
  ): void {
    if (this.filterState === null) {
      return;
    }

    this.updateFilterState((state) =>
      updateTreeState(state, event.detail),
    );
  }

  private renderCheckboxListFilter(filter: Extract<CalendarFilter, { type: 'checkbox-list' }>) {
    if (filter.items.length === 0) {
      return nothing;
    }

    const activeItems = this.filterState?.checkboxLists[filter.identifier] ?? [];

    return html`
      <section class="xima-calendar-filter__section">
        <h3>${filter.title}</h3>
        <xima-calendar-filter-checkbox-list
          .identifier=${filter.identifier}
          .items=${filter.items}
          .activeItems=${activeItems}
          @checkbox-list-change=${this.handleCheckboxListChange}
        ></xima-calendar-filter-checkbox-list>
      </section>
    `;
  }

  private async loadFilterConfiguration(): Promise<void> {
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const url = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options
      ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;
    if (!url) {
      console.error('Calendar filter URL is not available');
      this.filterLoadError = true;
      this.requestUpdate();
      return;
    }

    try {
      const data: unknown = await requestCalendarFilterConfiguration(url);
      if (!isCalendarFilterResponse(data)) {
        throw new Error('Filter configuration could not be loaded');
      }

      this.filterConfiguration = data.filters;
      this.filterState = data.state;
      this.publishFilterState();
    } catch (error) {
      console.error('Calendar filter configuration could not be loaded', error);
      this.filterLoadError = true;
    }

    this.requestUpdate();
  }

  private handleCheckboxListChange(
    event: CustomEvent<CheckboxListChangePayload>,
  ): void {
    if (this.filterState === null) {
      return;
    }
    this.updateFilterState((state) =>
      updateCheckboxListState(state, event.detail));
  }

  private publishFilterState(): void {
    if (this.filterState === null) {
      return;
    }

    const selection = createFilterSelection(this.filterState);
    const typo3Top = window.top as unknown as Typo3TopWindow;

    typo3Top.ximaCalendarFilterState = selection;

    typo3Top.dispatchEvent(new CustomEvent('xima-calendar-filter-changed', {
      bubbles: true,
      composed: true,
      detail: selection,
    }));
  }

  private dispatchFilterChange(): void {
    this.publishFilterState();
    this.requestUpdate();
    if (this.filterState !== null) {
      this.filterStatePersistence?.save(this.filterState);
    }
  }

  private updateFilterState(
    update: (state: CalendarFilterState) => CalendarFilterState,
  ): void {
    if (this.filterState === null) {
      return;
    }

    this.filterState = update(this.filterState);
    this.dispatchFilterChange();
  }

}

customElements.define(
  navigationComponentName,
  CalendarFilterElement
);
