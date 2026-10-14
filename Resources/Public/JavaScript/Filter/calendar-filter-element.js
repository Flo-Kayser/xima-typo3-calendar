import{html as o,LitElement as S,nothing as d}from"lit";import w from"@typo3/core/ajax/ajax-request.js";var g=(s,i,e={})=>{let t=e[s]?.[String(i)];if(t)return t;let r=[...`${s}:${i}`].reduce((n,l)=>n*31+l.charCodeAt(0)>>>0,0);return`hsl(${Math.round(r*137.508%360)} 68% 46%)`};import{html as x,LitElement as y}from"lit";var u=class extends y{createRenderRoot(){return this}render(){let i=window.top,t=(i.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":i.TYPO3?.lang?.["filter.search"]??"Enter search term";return x`
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
    `}};customElements.define("xima-calendar-filter-toolbar",u);import{html as m,LitElement as T,nothing as C}from"lit";function b(s,i,e){return e?[...new Set([...s,i])]:s.filter(t=>t!==i)}function v(s,i,e){return{...s,[i]:e}}var h=class extends T{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[];this.expandedItems={}}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){return m`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null)}
      </div>
    `}renderTreeNodes(e){return this.items.filter(r=>r.parentUid===e).map(r=>{let a=this.items.some(p=>p.parentUid===r.value),n=this.expandedItems[String(r.value)]??!1,l=this.activeItems.includes(r.value);return m`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${a?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${n}
              aria-hidden=${!a}
              tabindex=${a?"0":"-1"}
              @click=${()=>this.handleExpansionChange(r.value,!n)}
            >
              <typo3-backend-icon
                identifier=${n?"actions-chevron-down":"actions-chevron-end"}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${l}
                style=${r.color?`--xima-tree-item-color: ${r.color}`:""}
                @change=${p=>this.handleSelectionChange(r.value,p.target.checked)}
              />

              <span class="form-check-label">
        ${r.label}
      </span>
            </label>
          </div>

          ${a&&n?m`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(r.value)}
              </div>
            `:C}
        </div>
      `})}handleSelectionChange(e,t){this.activeItems=b(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=v(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",h);import _ from"@typo3/core/ajax/ajax-request.js";var c=class{constructor(i){this.url=i;this.saveQueue=Promise.resolve()}save(i){let e={activeTypes:[...i.activeTypes],activeStatuses:[...i.activeStatuses],trees:Object.fromEntries(Object.entries(i.trees).map(([t,r])=>[t,{activeItems:[...r.activeItems],expandedItems:{...r.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new _(this.url).post(e)).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};var $="xima-calendar-filter-element",f=class extends S{constructor(){super(...arguments);this.filterOptions=null;this.filterState=null;this.filterLoadError=!1;this.filterStatePersistence=null}getLanguageLabel(e,t,r){let a=window.top;return(a.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?r:a.TYPO3?.lang?.[`filter.${e}`]??t}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new c(t)),this.loadFilterOptions()}createRenderRoot(){return this}render(){return o`
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

          ${this.filterOptions===null?d:Object.values(this.filterOptions.filters).map(e=>this.renderFilter(e))}
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
      `:this.filterOptions.types.length<2?d:o`
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
    `}renderTreeFilter(e){if(e.items.length===0)return d;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},a=window.top.TYPO3?.settings?.ximaCalendar?.filterColors??{},n=e.items.map(l=>({...l,color:e.colorCoded?g(e.identifier,l.value,a):void 0}));return o`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${e.identifier}
          .items=${n}
          .activeItems=${t.activeItems}
          .expandedItems=${t.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxFilter(e)}handleTreeStateChange(e){this.updateFilterState(t=>({...t,trees:{...t.trees,[e.detail.identifier]:{activeItems:[...e.detail.activeItems],expandedItems:{...e.detail.expandedItems}}}}))}renderCheckboxFilter(e){if(e.items.length===0)return d;let t=e.identifier==="statuses"?this.filterState?.activeStatuses??[]:[];return o`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>
        <div class="xima-calendar-filter__status-list">
          ${e.items.map(r=>o`
            <label class="form-check">
              <input
                class="form-check-input"
                type="checkbox"
                value=${r.value}
                ?checked=${t.includes(r.value)}
                @change=${()=>this.handleStatusChange(r.value)}
              />
              <span class="form-check-label xima-calendar-filter__status-label ${this.getStatusPreviewClass(r.value)}">${r.label}</span>
            </label>
          `)}
        </div>
      </section>
    `}getStatusPreviewClass(e){switch(String(e)){case"0":return"xima-calendar-filter__status-label--draft";case"1":return"xima-calendar-filter__status-label--review";case"3":return"xima-calendar-filter__status-label--rejected";case"canceled":return"xima-calendar-filter__status-label--canceled";default:return""}}async loadFilterOptions(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let a=await(await new w(t).get()).resolve();if(!this.isCalendarFilterResponse(a))throw new Error("Filter options could not be loaded");this.filterOptions=a.options,this.filterState=a.state,this.publishFilterState()}catch(r){console.error("Calendar filter options could not be loaded",r),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.filterState!==null&&this.updateFilterState(t=>({...t,activeTypes:this.toggleValue(t.activeTypes,e)}))}handleStatusChange(e){this.filterState!==null&&this.updateFilterState(t=>({...t,activeStatuses:this.toggleValue(t.activeStatuses,e)}))}toggleValue(e,t){return e.includes(t)?e.filter(r=>r!==t):[...e,t]}publishFilterState(){if(this.filterState===null)return;let e={types:[...this.filterState.activeTypes],filters:Object.fromEntries(Object.entries(this.filterState.trees).map(([r,a])=>[r,[...a.activeItems]]))};e.filters.statuses=[...this.filterState.activeStatuses],e.categories=(this.filterState.trees.categories?.activeItems??[]).filter(r=>typeof r=="number"),e.statuses=[...this.filterState.activeStatuses];let t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}isCalendarFilterResponse(e){if(!e||typeof e!="object")return!1;let t=e,r=t.options,a=t.state;if(t.success!==!0||!r||typeof r!="object"||!a||typeof a!="object")return!1;let n=r,l=a;return Array.isArray(n.types)&&!!n.filters&&typeof n.filters=="object"&&Array.isArray(l.activeTypes)&&Array.isArray(l.activeStatuses)&&!!l.trees&&typeof l.trees=="object"}};customElements.define($,f);export{f as CalendarFilterElement,$ as navigationComponentName};
