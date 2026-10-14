import{html as o,LitElement as _,nothing as c}from"lit";import v from"@typo3/core/ajax/ajax-request.js";var f=(l,n,e={})=>{let t=e[l]?.[String(n)];if(t)return t;let a=[...`${l}:${n}`].reduce((i,s)=>i*31+s.charCodeAt(0)>>>0,0);return`hsl(${Math.round(a*137.508%360)} 68% 46%)`};import{html as x,LitElement as y}from"lit";var p=class extends y{createRenderRoot(){return this}render(){let n=window.top,t=(n.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":n.TYPO3?.lang?.["filter.search"]??"Enter search term";return x`
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
    `}};customElements.define("xima-calendar-filter-toolbar",p);import{html as u,LitElement as T,nothing as S}from"lit";function g(l,n,e){return e?[...new Set([...l,n])]:l.filter(t=>t!==n)}function b(l,n,e){return{...l,[n]:e}}var m=class extends T{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[];this.expandedItems={}}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){return u`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null)}
      </div>
    `}renderTreeNodes(e){return this.items.filter(a=>a.parentUid===e).map(a=>{let r=this.items.some(d=>d.parentUid===a.value),i=this.expandedItems[String(a.value)]??!1,s=this.activeItems.includes(a.value);return u`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${r?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${i}
              aria-hidden=${!r}
              tabindex=${r?"0":"-1"}
              @click=${()=>this.handleExpansionChange(a.value,!i)}
            >
              <typo3-backend-icon
                identifier=${i?"actions-chevron-down":"actions-chevron-end"}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${s}
                style=${a.color?`--xima-tree-item-color: ${a.color}`:""}
                @change=${d=>this.handleSelectionChange(a.value,d.target.checked)}
              />

              <span class="form-check-label">
        ${a.label}
      </span>
            </label>
          </div>

          ${r&&i?u`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(a.value)}
              </div>
            `:S}
        </div>
      `})}handleSelectionChange(e,t){this.activeItems=g(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=b(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",m);var C="xima-calendar-filter-element",h=class extends _{constructor(){super(...arguments);this.filterOptions=null;this.filterState=null;this.treeStates={};this.filterLoadError=!1;this.filterStateSaveQueue=Promise.resolve()}getLanguageLabel(e,t,a){let r=window.top;return(r.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?a:r.TYPO3?.lang?.[`filter.${e}`]??t}connectedCallback(){super.connectedCallback(),this.loadFilterOptions()}createRenderRoot(){return this}render(){return o`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">
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

          ${this.filterOptions===null?c:this.renderTreeFilter(this.filterOptions.categories)}

          ${this.renderStatusFilter()}
        </div>
      </div>
    `}renderTypeFilter(){return this.filterLoadError?o`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
          <p>${this.getLanguageLabel("error","Filters could not be loaded.","Filter konnten nicht geladen werden.")}</p>
        </section>
      `:this.filterOptions===null?o`
        <section class="xima-calendar-filter__section">
          <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
          <p>${this.getLanguageLabel("loading","Loading filters \u2026","Filter werden geladen \u2026")}</p>
        </section>
      `:this.filterOptions.types.length<2?c:o`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel("type","Type","Typ")}</h3>
        <div class="xima-calendar-filter__type-list">
          ${this.filterOptions.types.map(e=>o`
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
    `}renderTreeFilter(e){if(this.filterOptions===null||this.filterOptions.categories.items.length===0)return c;let t=this.treeStates[e.identifier]??{activeItems:[],expandedItems:{}},r=window.top.TYPO3?.settings?.ximaCalendar?.filterColors??{},i=e.items.map(s=>({...s,color:e.colorCoded?f(e.identifier,s.value,r):void 0}));return o`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${e.identifier}
          .items=${i}
          .activeItems=${t.activeItems}
          .expandedItems=${t.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `}handleTreeStateChange(e){let t=e.detail.activeItems.filter(r=>typeof r=="number"),a=Object.fromEntries(Object.entries(e.detail.expandedItems).filter(([r])=>Number.isInteger(Number(r))));if(this.treeStates={...this.treeStates,[e.detail.identifier]:{activeItems:t,expandedItems:a}},e.detail.identifier==="categories"&&this.filterState!==null){this.updateFilterState(r=>({...r,activeCategories:t,expanded:{...r.expanded,categoryNodes:a}}));return}this.requestUpdate()}renderStatusFilter(){return this.filterOptions===null||this.filterOptions.statuses.length===0?c:o`
      <section class="xima-calendar-filter__section">
        <h3>${this.getLanguageLabel("status","Status","Status")}</h3>
        <div class="xima-calendar-filter__status-list">
          ${this.filterOptions.statuses.map(e=>o`
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
    `}getStatusPreviewClass(e){switch(String(e)){case"0":return"xima-calendar-filter__status-label--draft";case"1":return"xima-calendar-filter__status-label--review";case"3":return"xima-calendar-filter__status-label--rejected";case"canceled":return"xima-calendar-filter__status-label--canceled";default:return""}}async loadFilterOptions(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let r=await(await new v(t).get()).resolve();if(!this.isCalendarFilterResponse(r))throw new Error("Filter options could not be loaded");this.filterOptions=r.options,this.filterState=r.state,this.treeStates={[r.options.categories.identifier]:{activeItems:r.state.activeCategories,expandedItems:r.state.expanded.categoryNodes}},this.publishFilterState()}catch(a){console.error("Calendar filter options could not be loaded",a),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.filterState!==null&&this.updateFilterState(t=>({...t,activeTypes:this.toggleValue(t.activeTypes,e)}))}handleStatusChange(e){this.filterState!==null&&this.updateFilterState(t=>({...t,activeStatuses:this.toggleValue(t.activeStatuses,e)}))}toggleValue(e,t){return e.includes(t)?e.filter(a=>a!==t):[...e,t]}publishFilterState(){if(this.filterState===null)return;let e={types:[...this.filterState.activeTypes],categories:[...this.filterState.activeCategories],statuses:[...this.filterState.activeStatuses]},t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.persistFilterState()}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}isCalendarFilterResponse(e){if(!e||typeof e!="object")return!1;let t=e,a=t.options,r=t.state;if(t.success!==!0||!a||typeof a!="object"||!r||typeof r!="object")return!1;let i=a,s=r;return Array.isArray(i.types)&&Array.isArray(i.statuses)&&!!i.categories&&Array.isArray(i.categories.items)&&Array.isArray(s.activeTypes)&&Array.isArray(s.activeCategories)&&Array.isArray(s.activeStatuses)&&!!s.expanded&&typeof s.expanded=="object"}persistFilterState(){if(this.filterState===null)return;let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;if(!t)return;let a={activeTypes:[...this.filterState.activeTypes],activeCategories:[...this.filterState.activeCategories],activeStatuses:[...this.filterState.activeStatuses],expanded:{categoryNodes:{...this.filterState.expanded.categoryNodes}}};this.filterStateSaveQueue=this.filterStateSaveQueue.catch(()=>{}).then(async()=>{try{await(await new v(t).post(a)).resolve()}catch(r){console.error("Calendar filter state could not be saved",r)}})}};customElements.define(C,h);export{h as CalendarFilterElement,C as navigationComponentName};
