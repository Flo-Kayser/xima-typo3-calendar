import {html, LitElement, nothing} from 'lit';
import {
  updateTreeExpansion,
  updateTreeSelection,
  type TreeValue,
} from './calendar-filter-tree-utils';

export type {TreeValue} from './calendar-filter-tree-utils';

export type TreeStateChangePayload = {
  identifier: string;
  activeItems: TreeValue[];
  expandedItems: Record<TreeValue, boolean>;
};

export type TreeCalendarFilterItem = {
  label: string;
  value: TreeValue;
  selected: boolean;
  parentUid: TreeValue | null;
  color?: string;
};

export class CalendarFilterTree extends LitElement {
  static properties = {
    identifier: {attribute: false},
    items: {attribute: false},
    activeItems: {attribute: false},
    expandedItems: {attribute: false},
  };

  public identifier = '';
  public items: TreeCalendarFilterItem[] = [];
  public activeItems: TreeValue[] = [];
  public expandedItems: Record<TreeValue, boolean> = {};

  public createRenderRoot(): HTMLElement {
    return this;
  }

  public render() {
    return html`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null)}
      </div>
    `;
  }


  private renderTreeNodes(parentUid: TreeValue | null): unknown [] {
    const items = this.items.filter(
      (item) => item.parentUid === parentUid,
    );

    return items.map((item) => {
      const hasChildren = this.items.some(
        (child) => child.parentUid === item.value
      );
      const isExpanded =
        this.expandedItems[String(item.value)] ?? false;

      const isSelected = this.activeItems.includes(item.value);

      return html`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${hasChildren
                ? 'xima-calendar-filter__tree-toggle'
                : 'xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty'}
              aria-expanded=${isExpanded}
              aria-hidden=${!hasChildren}
              tabindex=${hasChildren ? '0' : '-1'}
              @click=${() => this.handleExpansionChange(
                item.value,
                !isExpanded,
              )}
            >
              <typo3-backend-icon
                identifier=${isExpanded
                  ? 'actions-chevron-down'
                  : 'actions-chevron-end'}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${isSelected}
                style=${item.color
                  ? `--xima-tree-item-color: ${item.color}`
                  : ''}
                @change=${(event: Event) => this.handleSelectionChange(
                  item.value,
                  (event.target as HTMLInputElement).checked,
                )}
              />

              <span class="form-check-label">
        ${item.label}
      </span>
            </label>
          </div>

          ${hasChildren && isExpanded
            ? html`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(item.value)}
              </div>
            `
            : nothing}
        </div>
      `;
    })
  }

  private handleSelectionChange(
    value: TreeValue,
    selected: boolean
  ): void {
    this.activeItems = updateTreeSelection(
      this.activeItems,
      value,
      selected,
    );

    this.dispatchEvent(
      new CustomEvent<TreeStateChangePayload>('tree-state-change', {
        detail: {
          identifier: this.identifier,
          activeItems: this.activeItems,
          expandedItems: this.expandedItems,
        },
        bubbles: true,
      })
    );
  }

  private handleExpansionChange(
    value: TreeValue,
    expanded: boolean
  ): void {
    this.expandedItems = updateTreeExpansion(
      this.expandedItems,
      value,
      expanded,
    );

    this.dispatchEvent(
      new CustomEvent<TreeStateChangePayload>('tree-state-change', {
        detail: {
          identifier: this.identifier,
          activeItems: this.activeItems,
          expandedItems: this.expandedItems,
        },
        bubbles: true,
      })
    );
  }
}

customElements.define(
  'xima-calendar-filter-tree',
  CalendarFilterTree,
);
