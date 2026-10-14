import {html, LitElement, nothing} from 'lit';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import {getColor, type ColorOverrides} from '../color-utils';

import './calendar-filter-toolbar';
import './calendar-filter-tree';
import type {TreeStateChangePayload} from './calendar-filter-tree';
import {CalendarFilterStatePersistence} from './calendar-filter-state-persistence';

import type {
  CalendarFilterOptions,
  CalendarFilterResponse,
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
  private filterOptions: CalendarFilterOptions | null = null;

  private filterState: CalendarFilterState | null = null;

  private filterLoadError = false;

  private filterStatePersistence: CalendarFilterStatePersistence | null = null;

  private getLanguageLabel(key: string, englishFallback: string, germanFallback: string): string {
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const locale = typo3Top.TYPO3?.settings?.ximaCalendar?.locale
      ?? document.documentElement.lang
      ?? navigator.language;
    if (locale?.startsWith('de')) {
      return germanFallback;
    }

    return typo3Top.TYPO3?.lang?.[`filter.${key}`] ?? englishFallback;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const stateUrl = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state
      ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterStateUrl;
    if (stateUrl) {
      this.filterStatePersistence = new CalendarFilterStatePersistence(stateUrl);
    }

    void this.loadFilterOptions();
  }

  public createRenderRoot(): HTMLElement {
    return this;
  }

  public render() {
    return html`
      <link rel="stylesheet" href="${new URL('../../Css/calendar-filter.css', import.meta.url).href}">
      <style>
        xima-calendar-filter-element {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }

        .xima-calendar-filter {
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 0;
        }

        .xima-calendar-filter__body {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: 0.75rem;
        }

        .xima-calendar-filter__section {
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--typo3-component-border-color);
        }

        .xima-calendar-filter__section h3 {
          margin: 0;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .xima-calendar-filter__type-list,
        .xima-calendar-filter__status-list {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-top: 0.5rem;
        }

        .xima-calendar-filter .form-check {
          margin: 0;
        }

        .xima-calendar-filter__status-label {
          display: inline-block;
          padding: 0.05rem 0.25rem;
          border-radius: 0.2rem;
        }

        .xima-calendar-filter__status-label--draft {
          background:
            repeating-linear-gradient(135deg, transparent 0, transparent 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 8px),
            repeating-linear-gradient(45deg, transparent 0, transparent 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 8px);
        }

        .xima-calendar-filter__status-label--review {
          border: 2px dashed var(--typo3-component-color);
        }

        .xima-calendar-filter__status-label--canceled {
          background: none;
        }

        .xima-calendar-filter__status-label--rejected {
          background: none;
          border: 2px solid var(--typo3-component-color);
        }

      </style>

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.renderTypeFilter()}

          ${this.filterOptions === null
            ? nothing
            : Object.values(this.filterOptions.trees).map((tree) => this.renderTreeFilter(tree))}

          ${this.renderStatusFilter()}
        </div>
      </div>
    `;
  }

  private renderTypeFilter() {
    if (this.filterLoadError) {
      return html`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel('type', 'Type', 'Typ')}</h3>
          <p>${this.getLanguageLabel('error', 'Filters could not be loaded.', 'Filter konnten nicht geladen werden.')}</p>
        </section>
      `;
    }

    if (this.filterOptions === null) {
      return html`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel('type', 'Type', 'Typ')}</h3>
          <p>${this.getLanguageLabel('loading', 'Loading filters …', 'Filter werden geladen …')}</p>
        </section>
      `;
    }

    if (this.filterOptions.types.length < 2) {
      return nothing;
    }

    return html`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel('type', 'Type', 'Typ')}</h3>
        <div class="xima-calendar-filter__type-list">
          ${this.filterOptions.types.map((type) => html`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${type.value}
                ?checked=${this.filterState?.activeTypes.includes(String(type.value)) ?? false}
                @change=${() => this.handleTypeChange(String(type.value))}
              />
              <span class="form-check-label">${type.label}</span>
            </label>
          `)}
        </div>
      </section>
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

  private handleTreeStateChange(
    event: CustomEvent<TreeStateChangePayload>,
  ): void {
    this.updateFilterState((state) => ({
      ...state,
      trees: {
        ...state.trees,
        [event.detail.identifier]: {
          activeItems: [...event.detail.activeItems],
          expandedItems: {...event.detail.expandedItems},
        },
      },
    }));
  }

  private renderStatusFilter() {
    if (this.filterOptions === null || this.filterOptions.statuses.length === 0) {
      return nothing;
    }

    return html`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel('status', 'Status', 'Status')}</h3>
        <div class="xima-calendar-filter__status-list">
          ${this.filterOptions.statuses.map((status) => html`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${status.value}
                ?checked=${this.filterState?.activeStatuses.includes(status.value) ?? false}
                @change=${() => this.handleStatusChange(status.value)}
              />
              <span class="form-check-label xima-calendar-filter__status-label ${this.getStatusPreviewClass(status.value)}">${status.label}</span>
            </label>
          `)}
        </div>
      </section>
    `;
  }

  private getStatusPreviewClass(status: number | string): string {
    switch (String(status)) {
      case '0':
        return 'xima-calendar-filter__status-label--draft';
      case '1':
        return 'xima-calendar-filter__status-label--review';
      case '3':
        return 'xima-calendar-filter__status-label--rejected';
      case 'canceled':
        return 'xima-calendar-filter__status-label--canceled';
      default:
        return '';
    }
  }

  private async loadFilterOptions(): Promise<void> {
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
      const response = await new AjaxRequest(url).get();
      const data: unknown = await response.resolve();
      if (!this.isCalendarFilterResponse(data)) {
        throw new Error('Filter options could not be loaded');
      }

      this.filterOptions = data.options;
      this.filterState = data.state;
      this.publishFilterState();
    } catch (error) {
      console.error('Calendar filter options could not be loaded', error);
      this.filterLoadError = true;
    }

    this.requestUpdate();
  }

  private handleTypeChange(type: string): void {
    if (this.filterState === null) {
      return;
    }

    this.updateFilterState((state) => ({
      ...state,
      activeTypes: this.toggleValue(state.activeTypes, type),
    }));
  }

  private handleStatusChange(status: number | string): void {
    if (this.filterState === null) {
      return;
    }

    this.updateFilterState((state) => ({
      ...state,
      activeStatuses: this.toggleValue(state.activeStatuses, status),
    }));
  }

  private toggleValue<T extends string | number>(values: T[], value: T): T[] {
    return values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value];
  }

  private publishFilterState(): void {
    if (this.filterState === null) {
      return;
    }

    const selection: CalendarFilterSelection = {
      types: [...this.filterState.activeTypes],
      trees: Object.fromEntries(
        Object.entries(this.filterState.trees).map(([identifier, tree]) => [
          identifier,
          [...tree.activeItems],
        ]),
      ),
      categories: (this.filterState.trees.categories?.activeItems ?? [])
        .filter((value): value is number => typeof value === 'number'),
      statuses: [...this.filterState.activeStatuses],
    };
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

  private isCalendarFilterResponse(
    value: unknown,
  ): value is CalendarFilterResponse {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const response = value as Record<string, unknown>;
    const options = response.options;
    const state = response.state;

    if (
      response.success !== true
      || !options
      || typeof options !== 'object'
      || !state
      || typeof state !== 'object'
    ) {
      return false;
    }

    const filterOptions = options as Record<string, unknown>;
    const filterState = state as Record<string, unknown>;

    return Array.isArray(filterOptions.types)
      && Array.isArray(filterOptions.statuses)
      && Boolean(filterOptions.trees)
      && typeof filterOptions.trees === 'object'
      && Array.isArray(filterState.activeTypes)
      && Array.isArray(filterState.activeStatuses)
      && Boolean(filterState.trees)
      && typeof filterState.trees === 'object';
  }

}

customElements.define(
  navigationComponentName,
  CalendarFilterElement
);
