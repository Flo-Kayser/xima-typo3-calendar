import {html, LitElement} from 'lit';

type Typo3TopWindow = Window & {
  TYPO3?: {
    lang?: Record<string, string>;
  };
};

export class CalendarFilterToolbar extends LitElement {
  public createRenderRoot(): Element {
    return this;
  }

  public render() {
    const typo3Top = window.top as unknown as Typo3TopWindow;
    const searchLabel = typo3Top.TYPO3?.lang?.['filter.search']
      ?? 'Suchbegriff eingeben';

    return html`
      <div class="tree-toolbar">
        <div class="tree-toolbar__menu">
          <div class="tree-toolbar__search">
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
}

customElements.define(
  'xima-calendar-filter-toolbar',
  CalendarFilterToolbar
);
