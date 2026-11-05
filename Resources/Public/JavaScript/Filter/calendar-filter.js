// Resources/Private/TypeScript/Filter/calendar-filter.ts
import { html as html5, LitElement as LitElement5, nothing as nothing4 } from "lit";

// Resources/Private/TypeScript/Utils/color-utils.ts
var getColor = (identifier, value, overrides = {}) => {
  const override = overrides[identifier]?.[String(value)];
  if (override) {
    return override;
  }
  const seed = [...`${identifier}:${value}`].reduce(
    (hash, character) => hash * 31 + character.charCodeAt(0) >>> 0,
    0
  );
  const hue = Math.round(seed * 137.508 % 360);
  return `hsl(${hue} 68% 46%)`;
};

// Resources/Private/TypeScript/Filter/Components/calendar-filter-toolbar.ts
import { html, LitElement } from "lit";
var CalendarFilterToolbar = class extends LitElement {
  createRenderRoot() {
    return this;
  }
  render() {
    const typo3Top = window.top;
    const locale = typo3Top.TYPO3?.settings?.ximaCalendar?.locale ?? document.documentElement.lang ?? navigator.language;
    const searchLabel = locale?.startsWith("de") ? "Suchbegriff eingeben" : typo3Top.TYPO3?.lang?.["filter.search"] ?? "Enter search term";
    return html`
      <div class="tree-toolbar">
        <div class="tree-toolbar__menu">
          <div class="tree-toolbar__search" hidden>
            <label
              for="xima-calendar-filter-search"
              class="visually-hidden"
            >
              ${searchLabel}
            </label>

            <input
              id="xima-calendar-filter-search"
              type="search"
              class="form-control form-control-sm search-input"
              placeholder=${searchLabel}
            />
          </div>
        </div>
      </div>
    `;
  }
};
customElements.define(
  "xima-calendar-filter-toolbar",
  CalendarFilterToolbar
);

// Resources/Private/TypeScript/Filter/Components/calendar-filter-tree.ts
import { html as html2, LitElement as LitElement2, nothing } from "lit";

// Resources/Private/TypeScript/Filter/Components/tree-utils.ts
function updateTreeSelection(activeItems, value, selected) {
  return selected ? [.../* @__PURE__ */ new Set([...activeItems, value])] : activeItems.filter((item) => item !== value);
}
function getDescendantValues(items, parentValue) {
  const descendants = [];
  const pending = [parentValue];
  while (pending.length > 0) {
    const currentValue = pending.pop();
    if (currentValue === void 0) {
      continue;
    }
    for (const item of items) {
      if (item.parentUid !== currentValue) {
        continue;
      }
      descendants.push(item.value);
      pending.push(item.value);
    }
  }
  return descendants;
}
function updateDescendantSelection(activeItems, items, parentValue, selected) {
  const descendantValues = getDescendantValues(items, parentValue);
  return selected ? [.../* @__PURE__ */ new Set([...activeItems, ...descendantValues])] : activeItems.filter((item) => !descendantValues.includes(item));
}
function updateTreeExpansion(expandedItems, value, expanded) {
  return {
    ...expandedItems,
    [value]: expanded
  };
}

// Resources/Private/TypeScript/Filter/Components/calendar-filter-tree.ts
var CalendarFilterTree = class extends LitElement2 {
  constructor() {
    super(...arguments);
    this.identifier = "";
    this.treeTitle = "";
    this.actionLabels = null;
    this.items = [];
    this.activeItems = [];
    this.expandedItems = {};
    this.openActionValue = null;
  }
  static {
    this.properties = {
      identifier: { attribute: false },
      treeTitle: { attribute: false },
      actionLabels: { attribute: false },
      items: { attribute: false },
      activeItems: { attribute: false },
      expandedItems: { attribute: false }
    };
  }
  createRenderRoot() {
    return this;
  }
  render() {
    const moreActionsLabel = this.getLanguageLabel(
      "filter.moreActions",
      "More actions"
    );
    const selectAllChildrenLabel = this.getLanguageLabel(
      "filter.selectAllChildren",
      "Select all nested ###name###"
    );
    const deselectAllChildrenLabel = this.getLanguageLabel(
      "filter.deselectAllChildren",
      "Deselect all nested ###name###"
    );
    return html2`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(
      null,
      moreActionsLabel,
      selectAllChildrenLabel,
      deselectAllChildrenLabel
    )}
      </div>
    `;
  }
  renderTreeNodes(parentUid, moreActionsLabel, selectAllChildrenLabel, deselectAllChildrenLabel) {
    const items = this.items.filter(
      (item) => item.parentUid === parentUid
    );
    return items.map((item) => {
      const hasChildren = this.items.some(
        (child) => child.parentUid === item.value
      );
      const isExpanded = this.expandedItems[String(item.value)] ?? false;
      const isSelected = this.activeItems.includes(item.value);
      return html2`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${hasChildren ? "xima-calendar-filter__tree-toggle" : "xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${isExpanded}
              aria-hidden=${!hasChildren}
              tabindex=${hasChildren ? "0" : "-1"}
              @click=${() => this.handleExpansionChange(
        item.value,
        !isExpanded
      )}
            >
              <typo3-backend-icon
                identifier=${isExpanded ? "actions-chevron-down" : "actions-chevron-end"}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${isSelected}
                style=${item.color ? `--xima-tree-item-color: ${item.color}` : ""}
                @change=${(event) => this.handleSelectionChange(
        item.value,
        event.target.checked
      )}
              />

              <span class="form-check-label">
        ${item.label}
      </span>
            </label>

            ${hasChildren ? html2`
                <div class="xima-calendar-filter__tree-actions">
                  <button
                    type="button"
                    class="xima-calendar-filter__tree-actions-toggle"
                    aria-label=${moreActionsLabel}
                    aria-haspopup="menu"
                    aria-expanded=${this.openActionValue === item.value}
                    title=${moreActionsLabel}
                    @click=${(event) => {
        event.stopPropagation();
        this.toggleActionMenu(item.value);
      }}
                  >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                  </button>

                  ${this.openActionValue === item.value ? html2`
                      <div
                        class="xima-calendar-filter__tree-actions-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          @click=${(event) => {
        event.stopPropagation();
        this.handleDescendantSelection(item.value, true);
      }}
                        >${selectAllChildrenLabel}</button>
                        <button
                          type="button"
                          role="menuitem"
                          @click=${(event) => {
        event.stopPropagation();
        this.handleDescendantSelection(item.value, false);
      }}
                        >${deselectAllChildrenLabel}</button>
                      </div>
                    ` : nothing}
                </div>
              ` : nothing}
          </div>

          ${hasChildren && isExpanded ? html2`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(
        item.value,
        moreActionsLabel,
        selectAllChildrenLabel,
        deselectAllChildrenLabel
      )}
              </div>
            ` : nothing}
        </div>
      `;
    });
  }
  getLanguageLabel(key, fallback) {
    const actionKey = key.replace("filter.", "");
    const label = this.actionLabels?.[actionKey] ?? fallback;
    return label.replace("###name###", this.treeTitle);
  }
  handleSelectionChange(value, selected) {
    this.activeItems = updateTreeSelection(
      this.activeItems,
      value,
      selected
    );
    this.dispatchEvent(
      new CustomEvent("tree-state-change", {
        detail: {
          identifier: this.identifier,
          activeItems: this.activeItems,
          expandedItems: this.expandedItems
        },
        bubbles: true
      })
    );
  }
  toggleActionMenu(value) {
    this.openActionValue = this.openActionValue === value ? null : value;
    this.requestUpdate();
  }
  handleDescendantSelection(value, selected) {
    this.activeItems = updateDescendantSelection(
      this.activeItems,
      this.items,
      value,
      selected
    );
    this.openActionValue = null;
    this.dispatchEvent(
      new CustomEvent("tree-state-change", {
        detail: {
          identifier: this.identifier,
          activeItems: this.activeItems,
          expandedItems: this.expandedItems
        },
        bubbles: true
      })
    );
  }
  handleExpansionChange(value, expanded) {
    this.expandedItems = updateTreeExpansion(
      this.expandedItems,
      value,
      expanded
    );
    this.dispatchEvent(
      new CustomEvent("tree-state-change", {
        detail: {
          identifier: this.identifier,
          activeItems: this.activeItems,
          expandedItems: this.expandedItems
        },
        bubbles: true
      })
    );
  }
};
customElements.define(
  "xima-calendar-filter-tree",
  CalendarFilterTree
);

// Resources/Private/TypeScript/Filter/Components/calendar-filter-checkbox-list.ts
import { html as html3, LitElement as LitElement3, nothing as nothing2 } from "lit";
var CalendarFilterCheckboxList = class extends LitElement3 {
  constructor() {
    super(...arguments);
    this.identifier = "";
    this.items = [];
    this.activeItems = [];
  }
  static {
    this.properties = {
      identifier: { attribute: false },
      items: { attribute: false },
      activeItems: { attribute: false }
    };
  }
  createRenderRoot() {
    return this;
  }
  render() {
    return html3`
      <div class="xima-calendar-filter__checkbox-list ${this.identifier === "statuses" ? "xima-calendar-filter__checkbox-list--statuses" : ""} ${this.hasAppearance() ? "xima-calendar-filter__checkbox-list--with-appearance" : ""}">
          ${this.items.map((item) => html3`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${item.value}
              .checked=${this.activeItems.includes(item.value)}
              @change=${(event) => this.handleChange(
      item.value,
      event.target.checked
    )}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label">
              ${item.icon ? html3`
                    <typo3-backend-icon
                      identifier=${item.icon}
                      size="small"
                    ></typo3-backend-icon>
                  ` : nothing2}
              ${item.label}
            </span>
            ${item.marker ? html3`<span class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--marker">
                  ${item.marker}
                </span>` : item.appearance ? html3`<span
                  class="xima-calendar-filter__checkbox-appearance ${this.getItemClass(item.appearance)}"
                  aria-hidden="true"
                ></span>` : this.identifier === "statuses" ? html3`<span
                    class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--empty"
                    aria-hidden="true"
                  ></span>` : nothing2}
          </label>
        `)}
      </div>
    `;
  }
  handleChange(value, selected) {
    this.dispatchEvent(
      new CustomEvent("checkbox-list-change", {
        detail: {
          identifier: this.identifier,
          value,
          selected
        },
        bubbles: true,
        composed: true
      })
    );
  }
  getItemClass(appearance) {
    return appearance ? `xima-calendar-filter__checkbox-appearance--${appearance}` : "";
  }
  hasAppearance() {
    return this.items.some((item) => Boolean(item.appearance || item.marker));
  }
};
customElements.define(
  "xima-calendar-filter-checkbox-list",
  CalendarFilterCheckboxList
);

// Resources/Private/TypeScript/Filter/Components/calendar-filter-mini-calendar.ts
import { html as html4, LitElement as LitElement4, nothing as nothing3 } from "lit";

// Resources/Private/TypeScript/Filter/Services/calendar-date-utils.ts
function formatLocalCalendarDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Resources/Private/TypeScript/Filter/Services/calendar-mini-calendar-events.ts
var miniCalendarEvents = {
  mainDateChange: "xima-calendar-main-date-change",
  navigate: "xima-calendar-mini-calendar-navigate",
  dateChange: "xima-calendar-mini-calendar-date-change",
  ready: "xima-calendar-mini-calendar-ready"
};

// Resources/Private/TypeScript/Filter/Components/calendar-filter-mini-calendar.ts
var YEARS_BEFORE_CURRENT = 3;
var YEARS_AFTER_CURRENT = 5;
var CalendarFilterMiniCalendar = class extends LitElement4 {
  constructor() {
    super(...arguments);
    this.displayedMonth = this.startOfMonth(/* @__PURE__ */ new Date());
    this.mainViewType = "";
    this.mainViewDate = this.startOfDay(/* @__PURE__ */ new Date());
    this.pendingClickedDate = null;
    this.pendingNavigationMonth = null;
    this.handleMainCalendarDateChange = (event) => {
      const detail = event.detail;
      const date = detail?.date;
      if (!date) {
        return;
      }
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return;
      }
      if (this.pendingClickedDate !== null) {
        if (detail?.viewType !== "timeGridWeek" || !this.isSameMiniWeek(parsedDate, this.pendingClickedDate)) {
          this.mainViewDate = this.startOfDay(parsedDate);
          this.mainViewType = detail?.viewType ?? "";
          this.requestUpdate();
          return;
        }
      }
      if (this.pendingNavigationMonth !== null && (detail?.viewType === "timeGridWeek" ? !this.isSameMiniWeek(parsedDate, this.pendingNavigationMonth) : !this.isSameMonth(parsedDate, this.pendingNavigationMonth))) {
        this.mainViewDate = this.startOfDay(parsedDate);
        this.mainViewType = detail?.viewType ?? "";
        this.requestUpdate();
        return;
      }
      const synchronizedDate = this.pendingClickedDate ?? this.pendingNavigationMonth ?? parsedDate;
      this.pendingClickedDate = null;
      this.pendingNavigationMonth = null;
      this.displayedMonth = this.startOfMonth(synchronizedDate);
      this.mainViewDate = this.startOfDay(synchronizedDate);
      this.mainViewType = detail?.viewType ?? "";
      this.requestUpdate();
    };
  }
  connectedCallback() {
    super.connectedCallback();
    window.top.addEventListener(
      miniCalendarEvents.mainDateChange,
      this.handleMainCalendarDateChange
    );
    window.top.dispatchEvent(new CustomEvent(miniCalendarEvents.ready));
  }
  disconnectedCallback() {
    window.top.removeEventListener(
      miniCalendarEvents.mainDateChange,
      this.handleMainCalendarDateChange
    );
    super.disconnectedCallback();
  }
  createRenderRoot() {
    return this;
  }
  render() {
    const locale = this.getLocale();
    const monthLabel = new Intl.DateTimeFormat(locale, {
      month: "long"
    }).format(this.displayedMonth);
    return html4`
      <div class="xima-calendar-filter__mini-calendar-header">
        <button
          type="button"
          class="xima-calendar-filter__mini-calendar-navigation"
          aria-label=${locale.startsWith("de") ? "Vorheriger Monat" : "Previous month"}
          @click=${() => this.changeMonth(-1)}
        >‹</button>
        <div class="xima-calendar-filter__mini-calendar-title">
          <h3>${monthLabel}</h3>
          <span class="xima-calendar-filter__mini-calendar-year-select">
            <select
              class="xima-calendar-filter__mini-calendar-year"
              name="calendar-year"
              aria-label=${locale.startsWith("de") ? "Jahr ausw\xE4hlen" : "Select year"}
              value=${String(this.displayedMonth.getFullYear())}
              @change=${(event) => this.changeYear(event)}
            >
              ${this.getYearOptions().map((year) => html4`
                <option
                  value=${year}
                  ?selected=${year === this.displayedMonth.getFullYear()}
                >${year}</option>
              `)}
            </select>
          </span>
        </div>
        <button
          type="button"
          class="xima-calendar-filter__mini-calendar-navigation"
          aria-label=${locale.startsWith("de") ? "N\xE4chster Monat" : "Next month"}
          @click=${() => this.changeMonth(1)}
        >›</button>
      </div>

      <div class="xima-calendar-filter__mini-calendar-weekdays" aria-hidden="true">
        ${this.getWeekdays(locale).map((weekday) => html4`<span>${weekday}</span>`)}
      </div>

      <div class="xima-calendar-filter__mini-calendar-grid">
        ${this.getDays().map((day) => html4`
          <button
            type="button"
            class=${this.getDayClass(day)}
            aria-current=${day.isToday ? "date" : nothing3}
            aria-label=${this.getDateLabel(day.date, locale)}
            @click=${() => this.selectDate(day.date)}
          >${day.day}</button>
        `)}
      </div>
    `;
  }
  getLocale() {
    const typo3Top = window.top;
    return typo3Top.TYPO3?.settings?.ximaCalendar?.locale ?? document.documentElement.lang ?? navigator.language;
  }
  getWeekdays(locale) {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    const monday = new Date(2024, 0, 1);
    return Array.from({ length: 7 }, (_, index) => formatter.format(new Date(
      monday.getFullYear(),
      monday.getMonth(),
      monday.getDate() + index
    )).charAt(0).toUpperCase());
  }
  getYearOptions() {
    const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
    return Array.from(
      { length: YEARS_BEFORE_CURRENT + YEARS_AFTER_CURRENT + 1 },
      (_, index) => currentYear - YEARS_BEFORE_CURRENT + index
    );
  }
  getDays() {
    const firstDay = this.startOfMonth(this.displayedMonth);
    const firstWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth() + 1,
      0
    ).getDate();
    const numberOfWeeks = Math.ceil((firstWeekday + daysInMonth) / 7);
    const today = this.startOfDay(/* @__PURE__ */ new Date());
    return Array.from({ length: numberOfWeeks * 7 }, (_, index) => {
      const date = new Date(firstDay);
      date.setDate(firstDay.getDate() + index - firstWeekday);
      return {
        date,
        day: date.getDate(),
        isCurrentMonth: date.getMonth() === this.displayedMonth.getMonth(),
        isToday: this.isSameDay(date, today),
        isInDisplayedWeek: this.mainViewType === "timeGridWeek" && this.isSameDay(
          this.startOfMiniWeek(date),
          this.startOfMiniWeek(this.mainViewDate)
        )
      };
    });
  }
  getDayClass(day) {
    return [
      "xima-calendar-filter__mini-calendar-day",
      day.isCurrentMonth ? "" : "xima-calendar-filter__mini-calendar-day--outside",
      day.isToday ? "xima-calendar-filter__mini-calendar-day--today" : "",
      day.isInDisplayedWeek ? "xima-calendar-filter__mini-calendar-day--current-week" : ""
    ].filter(Boolean).join(" ");
  }
  getDateLabel(date, locale) {
    return new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(date);
  }
  changeMonth(monthDelta) {
    const targetMonth = new Date(
      this.displayedMonth.getFullYear(),
      this.displayedMonth.getMonth() + monthDelta,
      1
    );
    this.navigateToMonth(targetMonth, monthDelta);
  }
  changeYear(event) {
    const year = Number(event.target.value);
    if (!Number.isInteger(year)) {
      return;
    }
    const monthDelta = year < this.displayedMonth.getFullYear() ? -1 : 1;
    this.navigateToMonth(new Date(year, this.displayedMonth.getMonth(), 1), monthDelta);
  }
  navigateToMonth(targetMonth, monthDelta) {
    this.pendingNavigationMonth = targetMonth;
    this.displayedMonth = this.startOfMonth(targetMonth);
    this.mainViewDate = this.startOfDay(targetMonth);
    this.requestUpdate();
    window.top.dispatchEvent(new CustomEvent(miniCalendarEvents.navigate, {
      detail: {
        direction: monthDelta < 0 ? "prev" : "next",
        date: targetMonth.toISOString()
      }
    }));
  }
  selectDate(date) {
    const clickedDate = this.startOfDay(date);
    this.pendingClickedDate = clickedDate;
    this.displayedMonth = this.startOfMonth(date);
    this.mainViewDate = clickedDate;
    this.mainViewType = "timeGridWeek";
    this.dispatchEvent(new CustomEvent("mini-calendar-date-change", {
      bubbles: true,
      composed: true,
      detail: { date: formatLocalCalendarDate(this.startOfDay(date)) }
    }));
    window.top.dispatchEvent(new CustomEvent(miniCalendarEvents.dateChange, {
      detail: { date: formatLocalCalendarDate(this.startOfDay(date)) }
    }));
    this.requestUpdate();
  }
  startOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  startOfMiniWeek(date) {
    const start = this.startOfDay(date);
    const weekday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - weekday);
    return start;
  }
  isSameDay(first, second) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth() && first.getDate() === second.getDate();
  }
  isSameMonth(first, second) {
    return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
  }
  isSameMiniWeek(first, second) {
    return this.isSameDay(this.startOfMiniWeek(first), this.startOfMiniWeek(second));
  }
};
customElements.define(
  "xima-calendar-filter-mini-calendar",
  CalendarFilterMiniCalendar
);

// Resources/Private/TypeScript/Filter/Services/calendar-filter-state-persistence.ts
import AjaxRequest from "@typo3/core/ajax/ajax-request.js";
var CalendarFilterStatePersistence = class {
  constructor(url) {
    this.url = url;
    this.saveQueue = Promise.resolve();
  }
  save(state) {
    const payload = {
      sections: { ...state.sections },
      checkboxLists: Object.fromEntries(
        Object.entries(state.checkboxLists).map(([identifier, values]) => [
          identifier,
          [...values]
        ])
      ),
      trees: Object.fromEntries(
        Object.entries(state.trees).map(([identifier, tree]) => [
          identifier,
          {
            activeItems: [...tree.activeItems],
            expandedItems: { ...tree.expandedItems }
          }
        ])
      )
    };
    this.saveQueue = this.saveQueue.catch(() => void 0).then(async () => {
      try {
        const response = await new AjaxRequest(this.url).post(
          JSON.stringify(payload),
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
        await response.resolve();
      } catch (error) {
        console.error("Calendar filter state could not be saved", error);
      }
    });
  }
};

// Resources/Private/TypeScript/Filter/Services/calendar-filter-configuration.ts
import AjaxRequest2 from "@typo3/core/ajax/ajax-request.js";
async function requestCalendarFilterConfiguration(url) {
  const response = await new AjaxRequest2(url).get();
  return response.resolve();
}
function isCalendarFilterResponse(value) {
  if (!value || typeof value !== "object") {
    return false;
  }
  const response = value;
  const filters = response.filters;
  const filterColors = response.filterColors;
  const state = response.state;
  const labels = response.labels;
  if (response.success !== true || !filters || typeof filters !== "object" || !filterColors || typeof filterColors !== "object" || !state || typeof state !== "object" || !labels || typeof labels !== "object") {
    return false;
  }
  const filterState = state;
  return Boolean(filters) && typeof filters === "object" && Boolean(filterColors) && typeof filterColors === "object" && Boolean(filterState.checkboxLists) && typeof filterState.checkboxLists === "object" && Boolean(filterState.trees) && typeof filterState.trees === "object" && Boolean(filterState.sections) && typeof filterState.sections === "object";
}

// Resources/Private/TypeScript/Filter/Services/calendar-filter-state-manager.ts
function updateCheckboxListState(state, change) {
  const { identifier, value, selected } = change;
  return {
    ...state,
    checkboxLists: {
      ...state.checkboxLists,
      [identifier]: selected ? [
        .../* @__PURE__ */ new Set([
          ...state.checkboxLists[identifier] ?? [],
          value
        ])
      ] : (state.checkboxLists[identifier] ?? []).filter((item) => item !== value)
    }
  };
}
function updateTreeState(state, change) {
  return {
    ...state,
    trees: {
      ...state.trees,
      [change.identifier]: {
        activeItems: [...change.activeItems],
        expandedItems: { ...change.expandedItems }
      }
    }
  };
}
function createFilterSelection(state) {
  const filters = Object.fromEntries(
    Object.entries(state.trees).map(([identifier, tree]) => [
      identifier,
      [...tree.activeItems]
    ])
  );
  Object.entries(state.checkboxLists).forEach(([identifier, values]) => {
    filters[identifier] = [...values];
  });
  return { filters };
}

// Resources/Private/TypeScript/Filter/calendar-filter.ts
var navigationComponentName = "xima-calendar-filter-element";
var CalendarFilterElement = class extends LitElement5 {
  constructor() {
    super(...arguments);
    this.filterConfiguration = null;
    this.filterColors = {};
    this.filterState = null;
    this.filterLabels = null;
    this.filterLoadError = false;
    this.filterStatePersistence = null;
  }
  connectedCallback() {
    super.connectedCallback();
    const typo3Top = window.top;
    const stateUrl = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterStateUrl;
    if (stateUrl) {
      this.filterStatePersistence = new CalendarFilterStatePersistence(stateUrl);
    }
    void this.loadFilterConfiguration();
  }
  createRenderRoot() {
    return this;
  }
  render() {
    return html5`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css", import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration === null ? nothing4 : Object.values(this.filterConfiguration).map((filter) => this.renderFilter(filter))}
        </div>

        <section
          class="xima-calendar-filter__mini-calendar"
          aria-label="Mini calendar"
        >
          <xima-calendar-filter-mini-calendar></xima-calendar-filter-mini-calendar>
        </section>
      </div>
    `;
  }
  renderTreeFilter(tree) {
    if (tree.items.length === 0) {
      return nothing4;
    }
    const treeState = this.filterState?.trees[tree.identifier] ?? {
      activeItems: [],
      expandedItems: {}
    };
    const items = tree.items.map((item) => ({
      ...item,
      color: tree.supportsColorCoding ? getColor(tree.identifier, item.value, this.filterColors) : void 0
    }));
    return html5`
      <section class="xima-calendar-filter__section">
        <details
          .open=${this.filterState?.sections[tree.identifier] ?? true}
          @toggle=${(event) => this.handleSectionToggle(tree.identifier, event)}
        >
          <summary>
            <span class="xima-calendar-filter__section-toggle" aria-hidden="true"></span>
            <h3>${tree.title}</h3>
          </summary>

          <xima-calendar-filter-tree
            .identifier=${tree.identifier}
            .treeTitle=${tree.title}
            .actionLabels=${this.filterLabels}
            .items=${items}
            .activeItems=${treeState.activeItems}
            .expandedItems=${treeState.expandedItems}
            @tree-state-change=${this.handleTreeStateChange}
          ></xima-calendar-filter-tree>
        </details>
      </section>
    `;
  }
  renderFilter(filter) {
    return filter.type === "tree" ? this.renderTreeFilter(filter) : this.renderCheckboxListFilter(filter);
  }
  handleTreeStateChange(event) {
    if (this.filterState === null) {
      return;
    }
    this.updateFilterState(
      (state) => updateTreeState(state, event.detail)
    );
  }
  renderCheckboxListFilter(filter) {
    if (filter.items.length === 0) {
      return nothing4;
    }
    const activeItems = this.filterState?.checkboxLists[filter.identifier] ?? [];
    return html5`
      <section class="xima-calendar-filter__section">
        <details
          .open=${this.filterState?.sections[filter.identifier] ?? true}
          @toggle=${(event) => this.handleSectionToggle(filter.identifier, event)}
        >
          <summary>
            <span class="xima-calendar-filter__section-toggle" aria-hidden="true"></span>
            <h3>${filter.title}</h3>
          </summary>
          <xima-calendar-filter-checkbox-list
            .identifier=${filter.identifier}
            .items=${filter.items}
            .activeItems=${activeItems}
            @checkbox-list-change=${this.handleCheckboxListChange}
          ></xima-calendar-filter-checkbox-list>
        </details>
      </section>
    `;
  }
  async loadFilterConfiguration() {
    const typo3Top = window.top;
    const url = typo3Top.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options ?? typo3Top.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;
    if (!url) {
      console.error("Calendar filter URL is not available");
      this.filterLoadError = true;
      this.requestUpdate();
      return;
    }
    try {
      const data = await requestCalendarFilterConfiguration(url);
      if (!isCalendarFilterResponse(data)) {
        throw new Error("Filter configuration could not be loaded");
      }
      this.filterConfiguration = data.filters;
      this.filterColors = data.filterColors;
      this.filterState = data.state;
      this.filterLabels = data.labels;
      this.publishFilterConfiguration();
      this.publishFilterState();
    } catch (error) {
      console.error("Calendar filter configuration could not be loaded", error);
      this.filterLoadError = true;
    }
    this.requestUpdate();
  }
  handleCheckboxListChange(event) {
    if (this.filterState === null) {
      return;
    }
    this.updateFilterState((state) => updateCheckboxListState(state, event.detail));
  }
  handleSectionToggle(identifier, event) {
    const details = event.currentTarget;
    if (!(details instanceof HTMLDetailsElement) || this.filterState === null) {
      return;
    }
    this.updateFilterState((state) => ({
      ...state,
      sections: {
        ...state.sections,
        [identifier]: details.open
      }
    }));
  }
  publishFilterConfiguration() {
    if (this.filterConfiguration === null) {
      return;
    }
    const typo3Top = window.top;
    typo3Top.ximaCalendarFilterConfiguration = this.filterConfiguration;
    typo3Top.dispatchEvent(new CustomEvent(
      "xima-calendar-filter-configuration-loaded",
      {
        bubbles: true,
        composed: true,
        detail: this.filterConfiguration
      }
    ));
  }
  publishFilterState() {
    if (this.filterState === null) {
      return;
    }
    const selection = createFilterSelection(this.filterState);
    const typo3Top = window.top;
    typo3Top.ximaCalendarFilterState = selection;
    typo3Top.dispatchEvent(new CustomEvent("xima-calendar-filter-changed", {
      bubbles: true,
      composed: true,
      detail: selection
    }));
  }
  dispatchFilterChange() {
    this.publishFilterState();
    this.requestUpdate();
    if (this.filterState !== null) {
      this.filterStatePersistence?.save(this.filterState);
    }
  }
  updateFilterState(update) {
    if (this.filterState === null) {
      return;
    }
    this.filterState = update(this.filterState);
    this.dispatchFilterChange();
  }
};
customElements.define(
  navigationComponentName,
  CalendarFilterElement
);
export {
  CalendarFilterElement,
  navigationComponentName
};
//# sourceMappingURL=calendar-filter.js.map
