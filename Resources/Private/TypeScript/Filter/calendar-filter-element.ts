import {html, LitElement, nothing} from 'lit';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';
import {getCategoryColor, type CategoryColors} from '../calendar-category-color';

import './calendar-filter-toolbar';
import type {
  CalendarCategoryOption,
  CalendarFilterOptions,
  CalendarFilterResponse,
  CalendarFilterSelection,
  CalendarFilterState,
} from './calendar-filter-state';

type Typo3TopWindow = Window & {
  ximaCalendarFilterState?: CalendarFilterSelection;
  TYPO3?: {
    settings?: {
      ajaxUrls?: {
        xima_calendar_filter_options?: string;
        xima_calendar_filter_state?: string;
      };
      ximaCalendar?: {
        filterOptionsUrl?: string;
        filterStateUrl?: string;
        categoryColors?: CategoryColors;
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

  private filterStateSaveQueue: Promise<void> = Promise.resolve();

  public connectedCallback(): void {
    super.connectedCallback();
    void this.loadFilterOptions();
  }

  public createRenderRoot(): Element {
    return this;
  }

  public render() {
    return html`
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
          background: repeating-linear-gradient(
            135deg,
            transparent 0,
            transparent 6px,
            color-mix(in srgb, var(--typo3-component-color) 28%, transparent) 6px,
            color-mix(in srgb, var(--typo3-component-color) 28%, transparent) 8px
          );
        }

        .xima-calendar-filter__status-label--review {
          border: 2px dashed var(--typo3-component-color);
        }

        .xima-calendar-filter__status-label--canceled {
          background:
            repeating-linear-gradient(135deg, transparent 0, transparent 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 8px),
            repeating-linear-gradient(45deg, transparent 0, transparent 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 7px, color-mix(in srgb, var(--typo3-component-color) 24%, transparent) 8px);
        }

        .xima-calendar-filter__tree {
          margin-top: 0.5rem;
        }

        .xima-calendar-filter__tree-node {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          min-height: 1.75rem;
        }

        .xima-calendar-filter__category-checkbox {
          appearance: none;
          width: 1rem;
          height: 1rem;
          flex: 0 0 1rem;
          margin: 0;
          border: 2px solid var(--xima-category-color);
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }

        .xima-calendar-filter__category-checkbox:checked {
          background: var(--xima-category-color);
          box-shadow: inset 0 0 0 2px var(--typo3-component-bg);
        }

        .xima-calendar-filter__tree-toggle {
          width: 1.25rem;
          padding: 0;
          border: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
        }

        .xima-calendar-filter__tree-toggle--empty {
          visibility: hidden;
        }

        .xima-calendar-filter__tree-children {
          margin-inline-start: 1rem;
        }
      </style>

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.renderTypeFilter()}

          ${this.renderCategoryFilter()}

          ${this.renderStatusFilter()}
        </div>
      </div>
    `;
  }

  private renderTypeFilter() {
    if (this.filterLoadError) {
      return html`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter konnten nicht geladen werden.</p>
        </section>
      `;
    }

    if (this.filterOptions === null) {
      return html`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter werden geladen …</p>
        </section>
      `;
    }

    if (this.filterOptions.types.length < 2) {
      return nothing;
    }

    return html`
      <section class="xima-calendar-filter__section">
        <h3>Typ</h3>
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

  private renderCategoryFilter() {
    if (this.filterOptions === null || this.filterOptions.categories.length === 0) {
      return nothing;
    }

    return html`
      <section class="xima-calendar-filter__section">
        <h3>Kategorien</h3>
        <div class="xima-calendar-filter__tree">
          ${this.renderCategoryNodes(null)}
        </div>
      </section>
    `;
  }

  private renderCategoryNodes(parentUid: number | null): unknown[] {
    if (this.filterOptions === null) {
      return [];
    }

    const nodes = this.filterOptions.categories.filter(
      (category) => category.parentUid === parentUid,
    );

    return nodes.map((category) => {
      const hasChildren = this.filterOptions?.categories.some(
        (child) => child.parentUid === category.value,
      ) ?? false;
      const isExpanded = this.filterState?.expanded.categoryNodes[category.value] === true;

      return html`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class="xima-calendar-filter__tree-toggle ${hasChildren ? '' : 'xima-calendar-filter__tree-toggle--empty'}"
              aria-label=${isExpanded ? 'Unterkategorien ausblenden' : 'Unterkategorien anzeigen'}
              aria-expanded=${isExpanded}
              @click=${() => this.toggleCategory(category)}
            >
              ${isExpanded ? '▾' : '▸'}
            </button>
            <label class="form-check">
              <input
                class="xima-calendar-filter__category-checkbox"
                type="checkbox"
                value=${category.value}
                style=${`--xima-category-color: ${this.getCategoryColor(category.value)}`}
                ?checked=${this.filterState?.activeCategories.includes(category.value) ?? false}
                @change=${() => this.handleCategoryChange(category.value)}
              />
              <span class="form-check-label">${category.label}</span>
            </label>
          </div>
          ${hasChildren && isExpanded
            ? html`<div class="xima-calendar-filter__tree-children">
                ${this.renderCategoryNodes(category.value)}
              </div>`
            : nothing}
        </div>
      `;
    });
  }

  private renderStatusFilter() {
    if (this.filterOptions === null || this.filterOptions.statuses.length === 0) {
      return nothing;
    }

    return html`
      <section class="xima-calendar-filter__section">
        <h3>Status</h3>
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
      const data = await response.resolve() as CalendarFilterResponse;
      if (!data.success) {
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

    this.filterState.activeTypes = this.toggleValue(this.filterState.activeTypes, type);
    this.dispatchFilterChange();
  }

  private toggleCategory(category: CalendarCategoryOption): void {
    if (this.filterState === null) {
      return;
    }

    this.filterState.expanded.categoryNodes[category.value] =
      !this.filterState.expanded.categoryNodes[category.value];
    this.requestUpdate();
    this.persistFilterState();
  }

  private handleCategoryChange(categoryUid: number): void {
    if (this.filterState === null) {
      return;
    }

    this.filterState.activeCategories = this.toggleValue(this.filterState.activeCategories, categoryUid);
    this.dispatchFilterChange();
  }

  private handleStatusChange(status: number | string): void {
    if (this.filterState === null) {
      return;
    }

    this.filterState.activeStatuses = this.toggleValue(this.filterState.activeStatuses, status);
    this.dispatchFilterChange();
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
      categories: this.getCategoryFilterUids(this.filterState.activeCategories),
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
    this.persistFilterState();
  }

  private persistFilterState(): void {
    if (this.filterState === null) {
      return;
    }

    const typo3Top = window.top as unknown as Typo3TopWindow;
    const url = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state
      ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterStateUrl;
    if (!url) {
      return;
    }

    const state = {
      activeTypes: [...this.filterState.activeTypes],
      activeCategories: [...this.filterState.activeCategories],
      activeStatuses: [...this.filterState.activeStatuses],
      expanded: {
        categoryNodes: {...this.filterState.expanded.categoryNodes},
      },
    };

    this.filterStateSaveQueue = this.filterStateSaveQueue
      .catch(() => undefined)
      .then(async () => {
        try {
          const response = await new AjaxRequest(url).post(state);
          await response.resolve();
        } catch (error) {
          console.error('Calendar filter state could not be saved', error);
        }
      });
  }

  private getCategoryFilterUids(categoryUids: number[]): number[] {
    if (this.filterOptions === null) {
      return [...categoryUids];
    }

    const result = new Set(categoryUids);
    let changed = true;
    while (changed) {
      changed = false;
      for (const category of this.filterOptions.categories) {
        if (category.parentUid !== null && result.has(category.parentUid) && !result.has(category.value)) {
          result.add(category.value);
          changed = true;
        }
      }
    }

    return [...result];
  }

  private getCategoryColor(categoryUid: number): string {
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const overrides = typo3Top.TYPO3?.settings?.ximaCalendar?.categoryColors ?? {};
    return getCategoryColor(categoryUid, overrides);
  }
}

customElements.define(
  navigationComponentName,
  CalendarFilterElement
);
