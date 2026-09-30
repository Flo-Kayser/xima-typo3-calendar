import{html as r,LitElement as u,nothing as n}from"lit";import c from"@typo3/core/ajax/ajax-request.js";import{html as h,LitElement as f}from"lit";var s=class extends f{createRenderRoot(){return this}render(){let t=window.top.TYPO3?.lang?.["filter.search"]??"Suchbegriff eingeben";return h`
      <div class="tree-toolbar">
        <div class="tree-toolbar__menu">
          <div class="tree-toolbar__search">
            <label
              for="xima-calendar-filter-search"
              class="visually-hidden"
            >
              ${t}
            </label>

            <input
              id="xima-calendar-filter-search"
              type="search"
              class="form-control form-control-sm search-input"
              placeholder=${t}
            />
          </div>
        </div>
      </div>
    `}};customElements.define("xima-calendar-filter-toolbar",s);var m="xima-calendar-filter-element",o=class extends u{filterOptions=null;filterState=null;filterLoadError=!1;filterStateSaveQueue=Promise.resolve();connectedCallback(){super.connectedCallback(),this.loadFilterOptions()}createRenderRoot(){return this}render(){return r`
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
    `}renderTypeFilter(){return this.filterLoadError?r`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter konnten nicht geladen werden.</p>
        </section>
      `:this.filterOptions===null?r`
        <section class="xima-calendar-filter__section">
          <h3>Typ</h3>
          <p>Filter werden geladen …</p>
        </section>
      `:this.filterOptions.types.length<2?n:r`
      <section class="xima-calendar-filter__section">
        <h3>Typ</h3>
        <div class="xima-calendar-filter__type-list">
          ${this.filterOptions.types.map(e=>r`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${e.value}
                ?checked=${this.filterState?.activeTypes.includes(String(e.value))??!1}
                @change=${()=>this.handleTypeChange(String(e.value))}
              />
              <span class="form-check-label">${e.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}renderCategoryFilter(){return this.filterOptions===null||this.filterOptions.categories.length===0?n:r`
      <section class="xima-calendar-filter__section">
        <h3>Kategorien</h3>
        <div class="xima-calendar-filter__tree">
          ${this.renderCategoryNodes(null)}
        </div>
      </section>
    `}renderCategoryNodes(e){return this.filterOptions===null?[]:this.filterOptions.categories.filter(i=>i.parentUid===e).map(i=>{let a=this.filterOptions?.categories.some(p=>p.parentUid===i.value)??!1,l=this.filterState?.expanded.categoryNodes[i.value]===!0;return r`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class="xima-calendar-filter__tree-toggle ${a?"":"xima-calendar-filter__tree-toggle--empty"}"
              aria-label=${l?"Unterkategorien ausblenden":"Unterkategorien anzeigen"}
              aria-expanded=${l}
              @click=${()=>this.toggleCategory(i)}
            >
              ${l?"\u25BE":"\u25B8"}
            </button>
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${i.value}
                ?checked=${this.filterState?.activeCategories.includes(i.value)??!1}
                @change=${()=>this.handleCategoryChange(i.value)}
              />
              <span class="form-check-label">${i.label}</span>
            </label>
          </div>
          ${a&&l?r`<div class="xima-calendar-filter__tree-children">
                ${this.renderCategoryNodes(i.value)}
              </div>`:n}
        </div>
      `})}renderStatusFilter(){return this.filterOptions===null||this.filterOptions.statuses.length===0?n:r`
      <section class="xima-calendar-filter__section">
        <h3>Status</h3>
        <div class="xima-calendar-filter__status-list">
          ${this.filterOptions.statuses.map(e=>r`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${e.value}
                ?checked=${this.filterState?.activeStatuses.includes(e.value)??!1}
                @change=${()=>this.handleStatusChange(e.value)}
              />
              <span class="form-check-label">${e.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}async loadFilterOptions(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let a=await(await new c(t).get()).resolve();if(!a.success)throw new Error("Filter options could not be loaded");this.filterOptions=a.options,this.filterState=a.state,this.publishFilterState()}catch(i){console.error("Calendar filter options could not be loaded",i),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.filterState!==null&&(this.filterState.activeTypes=this.toggleValue(this.filterState.activeTypes,e),this.dispatchFilterChange())}toggleCategory(e){this.filterState!==null&&(this.filterState.expanded.categoryNodes[e.value]=!this.filterState.expanded.categoryNodes[e.value],this.requestUpdate(),this.persistFilterState())}handleCategoryChange(e){this.filterState!==null&&(this.filterState.activeCategories=this.toggleValue(this.filterState.activeCategories,e),this.dispatchFilterChange())}handleStatusChange(e){this.filterState!==null&&(this.filterState.activeStatuses=this.toggleValue(this.filterState.activeStatuses,e),this.dispatchFilterChange())}toggleValue(e,t){return e.includes(t)?e.filter(i=>i!==t):[...e,t]}publishFilterState(){if(this.filterState===null)return;let e={types:[...this.filterState.activeTypes],categories:this.getCategoryFilterUids(this.filterState.activeCategories),statuses:[...this.filterState.activeStatuses]},t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.persistFilterState()}persistFilterState(){if(this.filterState===null)return;let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;if(!t)return;let i={activeTypes:[...this.filterState.activeTypes],activeCategories:[...this.filterState.activeCategories],activeStatuses:[...this.filterState.activeStatuses],expanded:{categoryNodes:{...this.filterState.expanded.categoryNodes}}};this.filterStateSaveQueue=this.filterStateSaveQueue.catch(()=>{}).then(async()=>{try{await(await new c(t).post(i)).resolve()}catch(a){console.error("Calendar filter state could not be saved",a)}})}getCategoryFilterUids(e){if(this.filterOptions===null)return[...e];let t=new Set(e),i=!0;for(;i;){i=!1;for(let a of this.filterOptions.categories)a.parentUid!==null&&t.has(a.parentUid)&&!t.has(a.value)&&(t.add(a.value),i=!0)}return[...t]}};customElements.define(m,o);export{o as CalendarFilterElement,m as navigationComponentName};
