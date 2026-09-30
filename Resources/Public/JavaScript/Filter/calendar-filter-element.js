import{html as i,LitElement as m,nothing as n}from"lit";import f from"@typo3/core/ajax/ajax-request.js";import{html as p,LitElement as h}from"lit";var s=class extends h{createRenderRoot(){return this}render(){let r=window.top.TYPO3?.lang?.["filter.search"]??"Suchbegriff eingeben";return p`
      <div class="tree-toolbar">
        <div class="tree-toolbar__menu">
          <div class="tree-toolbar__search">
            <label
              for="xima-calendar-filter-search"
              class="visually-hidden"
            >
              ${r}
            </label>

            <input
              id="xima-calendar-filter-search"
              type="search"
              class="form-control form-control-sm search-input"
              placeholder=${r}
            />
          </div>
        </div>
      </div>
    `}};customElements.define("xima-calendar-filter-toolbar",s);var u="xima-calendar-filter-element",o=class extends m{filterOptions=null;filterState=null;filterLoadError=!1;connectedCallback(){super.connectedCallback(),this.loadFilterOptions()}createRenderRoot(){return this}render(){return i`
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
    `}renderTypeFilter(){return this.filterLoadError?i`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter konnten nicht geladen werden.</p>
        </section>
      `:this.filterOptions===null?i`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter werden geladen …</p>
        </section>
      `:this.filterOptions.types.length<2?n:i`
      <section class="xima-calendar-filter__section">
        <h3>Typ</h3>
        <div class="xima-calendar-filter__type-list">
          ${this.filterOptions.types.map(e=>i`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${e.value}
                @change=${()=>this.handleTypeChange(String(e.value))}
              />
              <span class="form-check-label">${e.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}renderCategoryFilter(){return this.filterOptions===null||this.filterOptions.categories.length===0?n:i`
      <section class="xima-calendar-filter__section">
        <h3>Kategorien</h3>
        <div class="xima-calendar-filter__tree">
          ${this.renderCategoryNodes(null)}
        </div>
      </section>
    `}renderCategoryNodes(e){return this.filterOptions===null?[]:this.filterOptions.categories.filter(t=>t.parentUid===e).map(t=>{let a=this.filterOptions?.categories.some(c=>c.parentUid===t.value)??!1,l=this.filterState?.expanded.categoryNodes[t.value]===!0;return i`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class="xima-calendar-filter__tree-toggle ${a?"":"xima-calendar-filter__tree-toggle--empty"}"
              aria-label=${l?"Unterkategorien ausblenden":"Unterkategorien anzeigen"}
              aria-expanded=${l}
              @click=${()=>this.toggleCategory(t)}
            >
              ${l?"\u25BE":"\u25B8"}
            </button>
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${t.value}
                @change=${()=>this.handleCategoryChange(t.value)}
              />
              <span class="form-check-label">${t.label}</span>
            </label>
          </div>
          ${a&&l?i`<div class="xima-calendar-filter__tree-children">
                ${this.renderCategoryNodes(t.value)}
              </div>`:n}
        </div>
      `})}renderStatusFilter(){return this.filterOptions===null||this.filterOptions.statuses.length===0?n:i`
      <section class="xima-calendar-filter__section">
        <h3>Status</h3>
        <div class="xima-calendar-filter__status-list">
          ${this.filterOptions.statuses.map(e=>i`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${e.value}
                @change=${()=>this.handleStatusChange(Number(e.value))}
              />
              <span class="form-check-label">${e.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}async loadFilterOptions(){let e=window.top,r=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!r){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let a=await(await new f(r).get()).resolve();if(!a.success)throw new Error("Filter options could not be loaded");this.filterOptions=a.options,this.filterState=a.state}catch(t){console.error("Calendar filter options could not be loaded",t),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.dispatchFilterChange({type:e})}toggleCategory(e){this.filterState!==null&&(this.filterState.expanded.categoryNodes[e.value]=!this.filterState.expanded.categoryNodes[e.value],this.requestUpdate())}handleCategoryChange(e){this.dispatchFilterChange({categoryUid:e})}handleStatusChange(e){this.dispatchFilterChange({status:e})}dispatchFilterChange(e){this.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}};customElements.define(u,o);export{o as CalendarFilterElement,u as navigationComponentName};
