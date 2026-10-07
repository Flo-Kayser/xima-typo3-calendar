import{html as i,LitElement as m,nothing as s}from"lit";import p from"@typo3/core/ajax/ajax-request.js";var d=(l,e={})=>{let r=e[String(l)];return r||`hsl(${Math.round(l*137.508%360)} 68% 46%)`};import{html as g,LitElement as h}from"lit";var o=class extends h{createRenderRoot(){return this}render(){let e=window.top,t=(e.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":e.TYPO3?.lang?.["filter.search"]??"Enter search term";return g`
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
    `}};customElements.define("xima-calendar-filter-toolbar",o);var f="xima-calendar-filter-element",c=class extends m{filterOptions=null;filterState=null;filterLoadError=!1;filterStateSaveQueue=Promise.resolve();getLanguageLabel(e,r,t){let a=window.top;return(a.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?t:a.TYPO3?.lang?.[`filter.${e}`]??r}connectedCallback(){super.connectedCallback(),this.loadFilterOptions()}createRenderRoot(){return this}render(){return i`
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
    `}renderTypeFilter(){return this.filterLoadError?i`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
          <p>${this.getLanguageLabel("error","Filters could not be loaded.","Filter konnten nicht geladen werden.")}</p>
        </section>
      `:this.filterOptions===null?i`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
          <p>${this.getLanguageLabel("loading","Loading filters \u2026","Filter werden geladen \u2026")}</p>
        </section>
      `:this.filterOptions.types.length<2?s:i`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
        <div class="xima-calendar-filter__type-list">
          ${this.filterOptions.types.map(e=>i`
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
    `}renderCategoryFilter(){return this.filterOptions===null||this.filterOptions.categories.length===0?s:i`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel("categories","Categories","Kategorien")}</h3>
        <div class="xima-calendar-filter__tree">
          ${this.renderCategoryNodes(null)}
        </div>
      </section>
    `}renderCategoryNodes(e){return this.filterOptions===null?[]:this.filterOptions.categories.filter(t=>t.parentUid===e).map(t=>{let a=this.filterOptions?.categories.some(u=>u.parentUid===t.value)??!1,n=this.filterState?.expanded.categoryNodes[t.value]===!0;return i`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class="xima-calendar-filter__tree-toggle ${a?"":"xima-calendar-filter__tree-toggle--empty"}"
              aria-label=${n?this.getLanguageLabel("hideSubcategories","Hide subcategories","Unterkategorien ausblenden"):this.getLanguageLabel("showSubcategories","Show subcategories","Unterkategorien anzeigen")}
              aria-expanded=${n}
              @click=${()=>this.toggleCategory(t)}
            >
              ${n?"\u25BE":"\u25B8"}
            </button>
            <label class="form-check">
              <input
                class="xima-calendar-filter__category-checkbox"
                type="checkbox"
                value=${t.value}
                style=${`--xima-category-color: ${this.getCategoryColor(t.value)}`}
                ?checked=${this.filterState?.activeCategories.includes(t.value)??!1}
                @change=${()=>this.handleCategoryChange(t.value)}
              />
              <span class="form-check-label">${t.label}</span>
            </label>
          </div>
          ${a&&n?i`<div class="xima-calendar-filter__tree-children">
                ${this.renderCategoryNodes(t.value)}
              </div>`:s}
        </div>
      `})}renderStatusFilter(){return this.filterOptions===null||this.filterOptions.statuses.length===0?s:i`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel("status","Status","Status")}</h3>
        <div class="xima-calendar-filter__status-list">
          ${this.filterOptions.statuses.map(e=>i`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${e.value}
                ?checked=${this.filterState?.activeStatuses.includes(e.value)??!1}
                @change=${()=>this.handleStatusChange(e.value)}
              />
              <span class="form-check-label xima-calendar-filter__status-label ${this.getStatusPreviewClass(e.value)}">${e.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}getStatusPreviewClass(e){switch(String(e)){case"0":return"xima-calendar-filter__status-label--draft";case"1":return"xima-calendar-filter__status-label--review";case"3":return"xima-calendar-filter__status-label--rejected";case"canceled":return"xima-calendar-filter__status-label--canceled";default:return""}}async loadFilterOptions(){let e=window.top,r=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!r){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let a=await(await new p(r).get()).resolve();if(!a.success)throw new Error("Filter options could not be loaded");this.filterOptions=a.options,this.filterState=a.state,this.publishFilterState()}catch(t){console.error("Calendar filter options could not be loaded",t),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.filterState!==null&&(this.filterState.activeTypes=this.toggleValue(this.filterState.activeTypes,e),this.dispatchFilterChange())}toggleCategory(e){this.filterState!==null&&(this.filterState.expanded.categoryNodes[e.value]=!this.filterState.expanded.categoryNodes[e.value],this.requestUpdate(),this.persistFilterState())}handleCategoryChange(e){this.filterState!==null&&(this.filterState.activeCategories=this.toggleValue(this.filterState.activeCategories,e),this.dispatchFilterChange())}handleStatusChange(e){this.filterState!==null&&(this.filterState.activeStatuses=this.toggleValue(this.filterState.activeStatuses,e),this.dispatchFilterChange())}toggleValue(e,r){return e.includes(r)?e.filter(t=>t!==r):[...e,r]}publishFilterState(){if(this.filterState===null)return;let e={types:[...this.filterState.activeTypes],categories:this.getCategoryFilterUids(this.filterState.activeCategories),statuses:[...this.filterState.activeStatuses]},r=window.top;r.ximaCalendarFilterState=e,r.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.persistFilterState()}persistFilterState(){if(this.filterState===null)return;let e=window.top,r=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;if(!r)return;let t={activeTypes:[...this.filterState.activeTypes],activeCategories:[...this.filterState.activeCategories],activeStatuses:[...this.filterState.activeStatuses],expanded:{categoryNodes:{...this.filterState.expanded.categoryNodes}}};this.filterStateSaveQueue=this.filterStateSaveQueue.catch(()=>{}).then(async()=>{try{await(await new p(r).post(t)).resolve()}catch(a){console.error("Calendar filter state could not be saved",a)}})}getCategoryFilterUids(e){if(this.filterOptions===null)return[...e];let r=new Set(e),t=!0;for(;t;){t=!1;for(let a of this.filterOptions.categories)a.parentUid!==null&&r.has(a.parentUid)&&!r.has(a.value)&&(r.add(a.value),t=!0)}return[...r]}getCategoryColor(e){let t=window.top.TYPO3?.settings?.ximaCalendar?.categoryColors??{};return d(e,t)}};customElements.define(f,c);export{c as CalendarFilterElement,f as navigationComponentName};
