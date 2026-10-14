import{html as f,LitElement as L,nothing as b}from"lit";var g=(a,i,e={})=>{let t=e[a]?.[String(i)];if(t)return t;let r=[...`${a}:${i}`].reduce((s,l)=>s*31+l.charCodeAt(0)>>>0,0);return`hsl(${Math.round(r*137.508%360)} 68% 46%)`};import{html as k,LitElement as S}from"lit";var d=class extends S{createRenderRoot(){return this}render(){let i=window.top,t=(i.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":i.TYPO3?.lang?.["filter.search"]??"Enter search term";return k`
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
    `}};customElements.define("xima-calendar-filter-toolbar",d);import{html as p,LitElement as w,nothing as I}from"lit";function v(a,i,e){return e?[...new Set([...a,i])]:a.filter(t=>t!==i)}function C(a,i,e){return{...a,[i]:e}}var u=class extends w{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[];this.expandedItems={}}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){return p`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null)}
      </div>
    `}renderTreeNodes(e){return this.items.filter(r=>r.parentUid===e).map(r=>{let n=this.items.some(c=>c.parentUid===r.value),s=this.expandedItems[String(r.value)]??!1,l=this.activeItems.includes(r.value);return p`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${n?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${s}
              aria-hidden=${!n}
              tabindex=${n?"0":"-1"}
              @click=${()=>this.handleExpansionChange(r.value,!s)}
            >
              <typo3-backend-icon
                identifier=${s?"actions-chevron-down":"actions-chevron-end"}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${l}
                style=${r.color?`--xima-tree-item-color: ${r.color}`:""}
                @change=${c=>this.handleSelectionChange(r.value,c.target.checked)}
              />

              <span class="form-check-label">
        ${r.label}
      </span>
            </label>
          </div>

          ${n&&s?p`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(r.value)}
              </div>
            `:I}
        </div>
      `})}handleSelectionChange(e,t){this.activeItems=v(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=C(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",u);import{html as m,LitElement as F,nothing as _}from"lit";var h=class extends F{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[]}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1}}}createRenderRoot(){return this}render(){return m`
      <div class="xima-calendar-filter__checkbox-list">
          ${this.items.map(e=>m`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${e.value}
              .checked=${this.activeItems.includes(e.value)}
              @change=${t=>this.handleChange(e.value,t.target.checked)}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label ${this.getItemClass(e.appearance)}">
              ${e.icon?m`
                    <typo3-backend-icon
                      identifier=${e.icon}
                      size="small"
                    ></typo3-backend-icon>
                  `:_}
              ${e.label}
            </span>
          </label>
        `)}
      </div>
    `}handleChange(e,t){this.dispatchEvent(new CustomEvent("checkbox-list-change",{detail:{identifier:this.identifier,value:e,selected:t},bubbles:!0,composed:!0}))}getItemClass(e){return e?`xima-calendar-filter__checkbox-label--${e}`:""}};customElements.define("xima-calendar-filter-checkbox-list",h);import $ from"@typo3/core/ajax/ajax-request.js";var o=class{constructor(i){this.url=i;this.saveQueue=Promise.resolve()}save(i){let e={checkboxLists:Object.fromEntries(Object.entries(i.checkboxLists).map(([t,r])=>[t,[...r]])),trees:Object.fromEntries(Object.entries(i.trees).map(([t,r])=>[t,{activeItems:[...r.activeItems],expandedItems:{...r.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new $(this.url).post(JSON.stringify(e),{headers:{"Content-Type":"application/json"}})).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};import E from"@typo3/core/ajax/ajax-request.js";async function T(a){return(await new E(a).get()).resolve()}function y(a){if(!a||typeof a!="object")return!1;let i=a,e=i.filters,t=i.state;if(i.success!==!0||!e||typeof e!="object"||!t||typeof t!="object")return!1;let r=t;return!!e&&typeof e=="object"&&!!r.checkboxLists&&typeof r.checkboxLists=="object"&&!!r.trees&&typeof r.trees=="object"}var O="xima-calendar-filter-element",x=class extends L{constructor(){super(...arguments);this.filterConfiguration=null;this.filterState=null;this.filterLoadError=!1;this.filterStatePersistence=null}getLanguageLabel(e,t,r){let n=window.top;return(n.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?r:n.TYPO3?.lang?.[`filter.${e}`]??t}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new o(t)),this.loadFilterOptions()}createRenderRoot(){return this}render(){return f`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration===null?b:Object.values(this.filterConfiguration).map(e=>this.renderFilter(e))}
        </div>
      </div>
    `}renderTreeFilter(e){if(e.items.length===0)return b;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},n=window.top.TYPO3?.settings?.ximaCalendar?.filterColors??{},s=e.items.map(l=>({...l,color:e.colorCoded?g(e.identifier,l.value,n):void 0}));return f`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${e.identifier}
          .items=${s}
          .activeItems=${t.activeItems}
          .expandedItems=${t.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxListFilter(e)}handleTreeStateChange(e){this.updateFilterState(t=>({...t,trees:{...t.trees,[e.detail.identifier]:{activeItems:[...e.detail.activeItems],expandedItems:{...e.detail.expandedItems}}}}))}renderCheckboxListFilter(e){if(e.items.length===0)return b;let t=this.filterState?.checkboxLists[e.identifier]??[];return f`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>
        <xima-calendar-filter-checkbox-list
          .identifier=${e.identifier}
          .items=${e.items}
          .activeItems=${t}
          @checkbox-list-change=${this.handleCheckboxListChange}
        ></xima-calendar-filter-checkbox-list>
      </section>
    `}async loadFilterOptions(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let r=await T(t);if(!y(r))throw new Error("Filter options could not be loaded");this.filterConfiguration=r.filters,this.filterState=r.state,this.publishFilterState()}catch(r){console.error("Calendar filter options could not be loaded",r),this.filterLoadError=!0}this.requestUpdate()}handleCheckboxListChange(e){if(this.filterState===null)return;let{identifier:t,value:r,selected:n}=e.detail;this.updateFilterState(s=>({...s,checkboxLists:{...s.checkboxLists,[t]:n?[...new Set([...s.checkboxLists[t]??[],r])]:(s.checkboxLists[t]??[]).filter(l=>l!==r)}}))}publishFilterState(){if(this.filterState===null)return;let e={filters:Object.fromEntries(Object.entries(this.filterState.trees).map(([r,n])=>[r,[...n.activeItems]]))};Object.entries(this.filterState.checkboxLists).forEach(([r,n])=>{e.filters[r]=[...n]});let t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}};customElements.define(O,x);export{x as CalendarFilterElement,O as navigationComponentName};
