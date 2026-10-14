import {html, LitElement, nothing} from 'lit';
import type {CalendarFilterOption} from '../calendar-filter-state';

export type CheckboxListValue = string | number;

export type CheckboxListChangePayload = {
  identifier: string;
  value: CheckboxListValue;
  selected: boolean;
};

export class CalendarFilterCheckboxList extends LitElement {
  static properties = {
    identifier: {attribute: false},
    items: {attribute: false},
    activeItems: {attribute: false},
  };

  public identifier = '';
  public items: CalendarFilterOption[] = [];
  public activeItems: CheckboxListValue[] = [];

  public createRenderRoot(): HTMLElement {
    return this;
  }

  public render() {
    return html`
      <div class="xima-calendar-filter__checkbox-list">
          ${this.items.map((item) => html`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${item.value}
              .checked=${this.activeItems.includes(item.value)}
              @change=${(event: Event) => this.handleChange(
                item.value,
                (event.target as HTMLInputElement).checked,
              )}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label ${this.getItemClass(item.appearance)}">
              ${item.icon
                ? html`
                    <typo3-backend-icon
                      identifier=${item.icon}
                      size="small"
                    ></typo3-backend-icon>
                  `
                : nothing}
              ${item.label}
            </span>
          </label>
        `)}
      </div>
    `;
  }

  private handleChange(
    value: CheckboxListValue,
    selected: boolean,
  ): void {
    this.dispatchEvent(
      new CustomEvent<CheckboxListChangePayload>('checkbox-list-change', {
        detail: {
          identifier: this.identifier,
          value,
          selected,
        },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private getItemClass(appearance: string | undefined): string {
    return appearance
      ? `xima-calendar-filter__checkbox-label--${appearance}`
      : '';
  }
}

customElements.define(
  'xima-calendar-filter-checkbox-list',
  CalendarFilterCheckboxList,
);
