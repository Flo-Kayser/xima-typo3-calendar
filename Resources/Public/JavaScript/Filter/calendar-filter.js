import{html as g,LitElement as M,nothing as C}from"lit";var T=(i,a,e={})=>{let t=e[i]?.[String(a)];if(t)return t;let r=[...`${i}:${a}`].reduce((o,l)=>o*31+l.charCodeAt(0)>>>0,0);return`hsl(${Math.round(r*137.508%360)} 68% 46%)`};import{html as V,LitElement as P}from"lit";var f=class extends P{createRenderRoot(){return this}render(){let a=window.top,t=(a.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":a.TYPO3?.lang?.["filter.search"]??"Enter search term";return V`
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
    `}};customElements.define("xima-calendar-filter-toolbar",f);import{html as u,LitElement as R,nothing as m}from"lit";function y(i,a,e){return e?[...new Set([...i,a])]:i.filter(t=>t!==a)}function O(i,a){let e=[],t=[a];for(;t.length>0;){let r=t.pop();if(r!==void 0)for(let n of i)n.parentUid===r&&(e.push(n.value),t.push(n.value))}return e}function k(i,a,e,t){let r=O(a,e);return t?[...new Set([...i,...r])]:i.filter(n=>!r.includes(n))}function S(i,a,e){return{...i,[a]:e}}var b=class extends R{constructor(){super(...arguments);this.identifier="";this.treeTitle="";this.actionLabels=null;this.items=[];this.activeItems=[];this.expandedItems={};this.openActionValue=null}static{this.properties={identifier:{attribute:!1},treeTitle:{attribute:!1},actionLabels:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){let e=this.getLanguageLabel("filter.moreActions","More actions"),t=this.getLanguageLabel("filter.selectAllChildren","Select all nested ###name###"),r=this.getLanguageLabel("filter.deselectAllChildren","Deselect all nested ###name###");return u`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null,e,t,r)}
      </div>
    `}renderTreeNodes(e,t,r,n){return this.items.filter(l=>l.parentUid===e).map(l=>{let d=this.items.some(s=>s.parentUid===l.value),p=this.expandedItems[String(l.value)]??!1,E=this.activeItems.includes(l.value);return u`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${d?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${p}
              aria-hidden=${!d}
              tabindex=${d?"0":"-1"}
              @click=${()=>this.handleExpansionChange(l.value,!p)}
            >
              <typo3-backend-icon
                identifier=${p?"actions-chevron-down":"actions-chevron-end"}
                size="small"
              ></typo3-backend-icon>
            </button>

            <label class="form-check">
              <input
                class="xima-calendar-filter__tree-checkbox"
                type="checkbox"
                .checked=${E}
                style=${l.color?`--xima-tree-item-color: ${l.color}`:""}
                @change=${s=>this.handleSelectionChange(l.value,s.target.checked)}
              />

              <span class="form-check-label">
        ${l.label}
      </span>
            </label>

            ${d?u`
                <div class="xima-calendar-filter__tree-actions">
                  <button
                    type="button"
                    class="xima-calendar-filter__tree-actions-toggle"
                    aria-label=${t}
                    aria-haspopup="menu"
                    aria-expanded=${this.openActionValue===l.value}
                    title=${t}
                    @click=${s=>{s.stopPropagation(),this.toggleActionMenu(l.value)}}
                  >
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                    <span aria-hidden="true"></span>
                  </button>

                  ${this.openActionValue===l.value?u`
                      <div
                        class="xima-calendar-filter__tree-actions-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          @click=${s=>{s.stopPropagation(),this.handleDescendantSelection(l.value,!0)}}
                        >${r}</button>
                        <button
                          type="button"
                          role="menuitem"
                          @click=${s=>{s.stopPropagation(),this.handleDescendantSelection(l.value,!1)}}
                        >${n}</button>
                      </div>
                    `:m}
                </div>
              `:m}
          </div>

          ${d&&p?u`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(l.value,t,r,n)}
              </div>
            `:m}
        </div>
      `})}getLanguageLabel(e,t){let r=e.replace("filter.","");return(this.actionLabels?.[r]??t).replace("###name###",this.treeTitle)}handleSelectionChange(e,t){this.activeItems=y(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}toggleActionMenu(e){this.openActionValue=this.openActionValue===e?null:e,this.requestUpdate()}handleDescendantSelection(e,t){this.activeItems=k(this.activeItems,this.items,e,t),this.openActionValue=null,this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=S(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",b);import{html as c,LitElement as j,nothing as L}from"lit";var x=class extends j{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[]}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1}}}createRenderRoot(){return this}render(){return c`
      <div class="xima-calendar-filter__checkbox-list ${this.identifier==="statuses"?"xima-calendar-filter__checkbox-list--statuses":""}">
          ${this.items.map(e=>c`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${e.value}
              .checked=${this.activeItems.includes(e.value)}
              @change=${t=>this.handleChange(e.value,t.target.checked)}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label">
              ${e.icon?c`
                    <typo3-backend-icon
                      identifier=${e.icon}
                      size="small"
                    ></typo3-backend-icon>
                  `:L}
              ${e.label}
            </span>
            ${e.marker?c`<span class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--marker">
                  ${e.marker}
                </span>`:e.appearance?c`<span
                  class="xima-calendar-filter__checkbox-appearance ${this.getItemClass(e.appearance)}"
                  aria-hidden="true"
                ></span>`:this.identifier==="statuses"?c`<span
                    class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--empty"
                    aria-hidden="true"
                  ></span>`:L}
          </label>
        `)}
      </div>
    `}handleChange(e,t){this.dispatchEvent(new CustomEvent("checkbox-list-change",{detail:{identifier:this.identifier,value:e,selected:t},bubbles:!0,composed:!0}))}getItemClass(e){return e?`xima-calendar-filter__checkbox-appearance--${e}`:""}};customElements.define("xima-calendar-filter-checkbox-list",x);import A from"@typo3/core/ajax/ajax-request.js";var h=class{constructor(a){this.url=a;this.saveQueue=Promise.resolve()}save(a){let e={checkboxLists:Object.fromEntries(Object.entries(a.checkboxLists).map(([t,r])=>[t,[...r]])),trees:Object.fromEntries(Object.entries(a.trees).map(([t,r])=>[t,{activeItems:[...r.activeItems],expandedItems:{...r.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new A(this.url).post(JSON.stringify(e),{headers:{"Content-Type":"application/json"}})).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};import U from"@typo3/core/ajax/ajax-request.js";async function F(i){return(await new U(i).get()).resolve()}function _(i){if(!i||typeof i!="object")return!1;let a=i,e=a.filters,t=a.filterColors,r=a.state,n=a.labels;if(a.success!==!0||!e||typeof e!="object"||!t||typeof t!="object"||!r||typeof r!="object"||!n||typeof n!="object")return!1;let o=r;return!!e&&typeof e=="object"&&!!t&&typeof t=="object"&&!!o.checkboxLists&&typeof o.checkboxLists=="object"&&!!o.trees&&typeof o.trees=="object"}function I(i,a){let{identifier:e,value:t,selected:r}=a;return{...i,checkboxLists:{...i.checkboxLists,[e]:r?[...new Set([...i.checkboxLists[e]??[],t])]:(i.checkboxLists[e]??[]).filter(n=>n!==t)}}}function $(i,a){return{...i,trees:{...i.trees,[a.identifier]:{activeItems:[...a.activeItems],expandedItems:{...a.expandedItems}}}}}function w(i){let a=Object.fromEntries(Object.entries(i.trees).map(([e,t])=>[e,[...t.activeItems]]));return Object.entries(i.checkboxLists).forEach(([e,t])=>{a[e]=[...t]}),{filters:a}}var N="xima-calendar-filter-element",v=class extends M{constructor(){super(...arguments);this.filterConfiguration=null;this.filterColors={};this.filterState=null;this.filterLabels=null;this.filterLoadError=!1;this.filterStatePersistence=null}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new h(t)),this.loadFilterConfiguration()}createRenderRoot(){return this}render(){return g`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration===null?C:Object.values(this.filterConfiguration).map(e=>this.renderFilter(e))}
        </div>
      </div>
    `}renderTreeFilter(e){if(e.items.length===0)return C;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},r=e.items.map(n=>({...n,color:e.supportsColorCoding?T(e.identifier,n.value,this.filterColors):void 0}));return g`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${e.identifier}
          .treeTitle=${e.title}
          .actionLabels=${this.filterLabels}
          .items=${r}
          .activeItems=${t.activeItems}
          .expandedItems=${t.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxListFilter(e)}handleTreeStateChange(e){this.filterState!==null&&this.updateFilterState(t=>$(t,e.detail))}renderCheckboxListFilter(e){if(e.items.length===0)return C;let t=this.filterState?.checkboxLists[e.identifier]??[];return g`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>
        <xima-calendar-filter-checkbox-list
          .identifier=${e.identifier}
          .items=${e.items}
          .activeItems=${t}
          @checkbox-list-change=${this.handleCheckboxListChange}
        ></xima-calendar-filter-checkbox-list>
      </section>
    `}async loadFilterConfiguration(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let r=await F(t);if(!_(r))throw new Error("Filter configuration could not be loaded");this.filterConfiguration=r.filters,this.filterColors=r.filterColors,this.filterState=r.state,this.filterLabels=r.labels,this.publishFilterConfiguration(),this.publishFilterState()}catch(r){console.error("Calendar filter configuration could not be loaded",r),this.filterLoadError=!0}this.requestUpdate()}handleCheckboxListChange(e){this.filterState!==null&&this.updateFilterState(t=>I(t,e.detail))}publishFilterConfiguration(){if(this.filterConfiguration===null)return;let e=window.top;e.ximaCalendarFilterConfiguration=this.filterConfiguration,e.dispatchEvent(new CustomEvent("xima-calendar-filter-configuration-loaded",{bubbles:!0,composed:!0,detail:this.filterConfiguration}))}publishFilterState(){if(this.filterState===null)return;let e=w(this.filterState),t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}};customElements.define(N,v);export{v as CalendarFilterElement,N as navigationComponentName};
