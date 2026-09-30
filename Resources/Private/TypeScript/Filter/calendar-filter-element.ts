import {html, LitElement, nothing} from 'lit';
import AjaxRequest from '@typo3/core/ajax/ajax-request.js';

import './calendar-filter-toolbar';
import type {
  CalendarCategoryOption,
  CalendarFilterOptions,
  CalendarFilterResponse,
  CalendarFilterState,
} from './calendar-filter-state';

type Typo3TopWindow = Window & {
  TYPO3?: {
    settings?: {
      ajaxUrls?: {
        xima_calendar_filter_options?: string;
      };
      ximaCalendar?: {
        filterOptionsUrl?: string;
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

        .xima-calendar-filter__tree {
          margin-top: 0.5rem;
        }

        .xima-calendar-filter__tree-node {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          min-height: 1.75rem;
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
                class="form-check-input"
                type="checkbox"
                value=${category.value}
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
                @change=${() => this.handleStatusChange(Number(status.value))}
              />
              <span class="form-check-label">${status.label}</span>
            </label>
          `)}
        </div>
      </section>
    `;
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
    } catch (error) {
      console.error('Calendar filter options could not be loaded', error);
      this.filterLoadError = true;
    }

    this.requestUpdate();
  }

  private handleTypeChange(type: string): void {
    this.dispatchFilterChange({type});
  }

  private toggleCategory(category: CalendarCategoryOption): void {
    if (this.filterState === null) {
      return;
    }

    this.filterState.expanded.categoryNodes[category.value] =
      !this.filterState.expanded.categoryNodes[category.value];
    this.requestUpdate();
  }

  private handleCategoryChange(categoryUid: number): void {
    this.dispatchFilterChange({categoryUid});
  }

  private handleStatusChange(status: number): void {
    this.dispatchFilterChange({status});
  }

  private dispatchFilterChange(detail: Record<string, number | string>): void {
    this.dispatchEvent(new CustomEvent('xima-calendar-filter-changed', {
      bubbles: true,
      composed: true,
      detail,
    }));
  }
}

customElements.define(
  navigationComponentName,
  CalendarFilterElement
);
