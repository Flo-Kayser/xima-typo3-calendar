import{html as o,LitElement as _,nothing as d}from"lit";import I from"@typo3/core/ajax/ajax-request.js";var x=(l,a,e={})=>{let t=e[l]?.[String(a)];if(t)return t;let r=[...`${l}:${a}`].reduce((n,s)=>n*31+s.charCodeAt(0)>>>0,0);return`hsl(${Math.round(r*137.508%360)} 68% 46%)`};import{html as C,LitElement as y}from"lit";var u=class extends y{createRenderRoot(){return this}render(){let a=window.top,t=(a.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":a.TYPO3?.lang?.["filter.search"]??"Enter search term";return C`
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
    `}};customElements.define("xima-calendar-filter-toolbar",u);import{html as h,LitElement as k,nothing as S}from"lit";function v(l,a,e){return e?[...new Set([...l,a])]:l.filter(t=>t!==a)}function T(l,a,e){return{...l,[a]:e}}var m=class extends k{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[];this.expandedItems={}}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){return h`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null)}
      </div>
    `}renderTreeNodes(e){return this.items.filter(r=>r.parentUid===e).map(r=>{let i=this.items.some(p=>p.parentUid===r.value),n=this.expandedItems[String(r.value)]??!1,s=this.activeItems.includes(r.value);return h`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${i?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${n}
              aria-hidden=${!i}
              tabindex=${i?"0":"-1"}
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
                .checked=${s}
                style=${r.color?`--xima-tree-item-color: ${r.color}`:""}
                @change=${p=>this.handleSelectionChange(r.value,p.target.checked)}
              />

              <span class="form-check-label">
        ${r.label}
      </span>
            </label>
          </div>

          ${i&&n?h`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(r.value)}
              </div>
            `:S}
        </div>
      `})}handleSelectionChange(e,t){this.activeItems=v(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=T(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",m);import{html as f,LitElement as $,nothing as w}from"lit";var b=class extends ${constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[]}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1}}}createRenderRoot(){return this}render(){return f`
      <div class="xima-calendar-filter__checkbox-list">
          ${this.items.map(e=>f`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${e.value}
              .checked=${this.activeItems.includes(e.value)}
              @change=${t=>this.handleChange(e.value,t.target.checked)}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label ${this.getItemClass(e.appearance)}">
              ${e.icon?f`
                    <typo3-backend-icon
                      identifier=${e.icon}
                      size="small"
                    ></typo3-backend-icon>
                  `:w}
              ${e.label}
            </span>
          </label>
        `)}
      </div>
    `}handleChange(e,t){this.dispatchEvent(new CustomEvent("checkbox-list-change",{detail:{identifier:this.identifier,value:e,selected:t},bubbles:!0,composed:!0}))}getItemClass(e){return e?`xima-calendar-filter__checkbox-label--${e}`:""}};customElements.define("xima-calendar-filter-checkbox-list",b);import L from"@typo3/core/ajax/ajax-request.js";var c=class{constructor(a){this.url=a;this.saveQueue=Promise.resolve()}save(a){let e={activeTypes:[...a.activeTypes],checkboxLists:Object.fromEntries(Object.entries(a.checkboxLists).map(([t,r])=>[t,[...r]])),trees:Object.fromEntries(Object.entries(a.trees).map(([t,r])=>[t,{activeItems:[...r.activeItems],expandedItems:{...r.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new L(this.url).post(JSON.stringify(e),{headers:{"Content-Type":"application/json"}})).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};var F="xima-calendar-filter-element",g=class extends _{constructor(){super(...arguments);this.filterOptions=null;this.filterState=null;this.filterLoadError=!1;this.filterStatePersistence=null}getLanguageLabel(e,t,r){let i=window.top;return(i.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?r:i.TYPO3?.lang?.[`filter.${e}`]??t}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new c(t)),this.loadFilterOptions()}createRenderRoot(){return this}render(){return o`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">

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
    `}renderTreeFilter(e){if(e.items.length===0)return d;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},i=window.top.TYPO3?.settings?.ximaCalendar?.filterColors??{},n=e.items.map(s=>({...s,color:e.colorCoded?x(e.identifier,s.value,i):void 0}));return o`
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
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxListFilter(e)}handleTreeStateChange(e){this.updateFilterState(t=>({...t,trees:{...t.trees,[e.detail.identifier]:{activeItems:[...e.detail.activeItems],expandedItems:{...e.detail.expandedItems}}}}))}renderCheckboxListFilter(e){if(e.items.length===0)return d;let t=this.filterState?.checkboxLists[e.identifier]??[];return o`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>
        <xima-calendar-filter-checkbox-list
          .identifier=${e.identifier}
          .items=${e.items}
          .activeItems=${t}
          @checkbox-list-change=${this.handleCheckboxListChange}
        ></xima-calendar-filter-checkbox-list>
      </section>
    `}async loadFilterOptions(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let i=await(await new I(t).get()).resolve();if(!this.isCalendarFilterResponse(i))throw new Error("Filter options could not be loaded");this.filterOptions=i.options,this.filterState=i.state,this.publishFilterState()}catch(r){console.error("Calendar filter options could not be loaded",r),this.filterLoadError=!0}this.requestUpdate()}handleTypeChange(e){this.filterState!==null&&this.updateFilterState(t=>({...t,activeTypes:this.toggleValue(t.activeTypes,e)}))}handleCheckboxListChange(e){if(this.filterState===null)return;let{identifier:t,value:r,selected:i}=e.detail;this.updateFilterState(n=>({...n,checkboxLists:{...n.checkboxLists,[t]:i?[...new Set([...n.checkboxLists[t]??[],r])]:(n.checkboxLists[t]??[]).filter(s=>s!==r)}}))}toggleValue(e,t){return e.includes(t)?e.filter(r=>r!==t):[...e,t]}publishFilterState(){if(this.filterState===null)return;let e={types:[...this.filterState.activeTypes],filters:Object.fromEntries(Object.entries(this.filterState.trees).map(([r,i])=>[r,[...i.activeItems]]))};Object.entries(this.filterState.checkboxLists).forEach(([r,i])=>{e.filters[r]=[...i]});let t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}isCalendarFilterResponse(e){if(!e||typeof e!="object")return!1;let t=e,r=t.options,i=t.state;if(t.success!==!0||!r||typeof r!="object"||!i||typeof i!="object")return!1;let n=r,s=i;return Array.isArray(n.types)&&!!n.filters&&typeof n.filters=="object"&&Array.isArray(s.activeTypes)&&!!s.checkboxLists&&typeof s.checkboxLists=="object"&&!!s.trees&&typeof s.trees=="object"}};customElements.define(F,g);export{g as CalendarFilterElement,F as navigationComponentName};
