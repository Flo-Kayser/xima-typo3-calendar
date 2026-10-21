import{html as x,LitElement as W,nothing as v}from"lit";var T=(r,a,e={})=>{let t=e[r]?.[String(a)];if(t)return t;let i=[...`${r}:${a}`].reduce((h,l)=>h*31+l.charCodeAt(0)>>>0,0);return`hsl(${Math.round(i*137.508%360)} 68% 46%)`};import{html as V,LitElement as P}from"lit";var m=class extends P{createRenderRoot(){return this}render(){let a=window.top,t=(a.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":a.TYPO3?.lang?.["filter.search"]??"Enter search term";return V`
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
    `}};customElements.define("xima-calendar-filter-toolbar",m);import{html as d,LitElement as R,nothing as f}from"lit";function y(r,a,e){return e?[...new Set([...r,a])]:r.filter(t=>t!==a)}function O(r,a){let e=[],t=[a];for(;t.length>0;){let i=t.pop();if(i!==void 0)for(let n of r)n.parentUid===i&&(e.push(n.value),t.push(n.value))}return e}function k(r,a,e,t){let i=O(a,e);return t?[...new Set([...r,...i])]:r.filter(n=>!i.includes(n))}function S(r,a,e){return{...r,[a]:e}}var b=class extends R{constructor(){super(...arguments);this.identifier="";this.treeTitle="";this.items=[];this.activeItems=[];this.expandedItems={};this.openActionValue=null}static{this.properties={identifier:{attribute:!1},treeTitle:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){let e=this.getLanguageLabel("filter.moreActions","More actions","Weitere Aktionen"),t=this.getLanguageLabel("filter.selectAllChildren","Select all nested ###name###","Alle Unter-###name### ausw\xE4hlen"),i=this.getLanguageLabel("filter.deselectAllChildren","Deselect all nested ###name###","Alle Unter-###name### abw\xE4hlen");return d`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null,e,t,i)}
      </div>
    `}renderTreeNodes(e,t,i,n){return this.items.filter(l=>l.parentUid===e).map(l=>{let c=this.items.some(s=>s.parentUid===l.value),u=this.expandedItems[String(l.value)]??!1,E=this.activeItems.includes(l.value);return d`
        <div class="xima-calendar-filter__tree-item">
          <div class="xima-calendar-filter__tree-node">
            <button
              type="button"
              class=${c?"xima-calendar-filter__tree-toggle":"xima-calendar-filter__tree-toggle xima-calendar-filter__tree-toggle--empty"}
              aria-expanded=${u}
              aria-hidden=${!c}
              tabindex=${c?"0":"-1"}
              @click=${()=>this.handleExpansionChange(l.value,!u)}
            >
              <typo3-backend-icon
                identifier=${u?"actions-chevron-down":"actions-chevron-end"}
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

            ${c?d`
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

                  ${this.openActionValue===l.value?d`
                      <div
                        class="xima-calendar-filter__tree-actions-menu"
                        role="menu"
                      >
                        <button
                          type="button"
                          role="menuitem"
                          @click=${s=>{s.stopPropagation(),this.handleDescendantSelection(l.value,!0)}}
                        >${i}</button>
                        <button
                          type="button"
                          role="menuitem"
                          @click=${s=>{s.stopPropagation(),this.handleDescendantSelection(l.value,!1)}}
                        >${n}</button>
                      </div>
                    `:f}
                </div>
              `:f}
          </div>

          ${c&&u?d`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(l.value,t,i,n)}
              </div>
            `:f}
        </div>
      `})}getLanguageLabel(e,t,i){let n=window.top;return((document.documentElement.lang||navigator.language).toLowerCase().startsWith("de")?i:n.TYPO3?.lang?.[e]??t).replace("###name###",this.treeTitle)}handleSelectionChange(e,t){this.activeItems=y(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}toggleActionMenu(e){this.openActionValue=this.openActionValue===e?null:e,this.requestUpdate()}handleDescendantSelection(e,t){this.activeItems=k(this.activeItems,this.items,e,t),this.openActionValue=null,this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=S(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",b);import{html as o,LitElement as j,nothing as _}from"lit";var g=class extends j{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[]}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1}}}createRenderRoot(){return this}render(){return o`
      <div class="xima-calendar-filter__checkbox-list ${this.identifier==="statuses"?"xima-calendar-filter__checkbox-list--statuses":""}">
          ${this.items.map(e=>o`
          <label class="form-check">
            <input
              class="form-check-input"
              type="checkbox"
              value=${e.value}
              .checked=${this.activeItems.includes(e.value)}
              @change=${t=>this.handleChange(e.value,t.target.checked)}
            />
            <span class="form-check-label xima-calendar-filter__checkbox-label">
              ${e.icon?o`
                    <typo3-backend-icon
                      identifier=${e.icon}
                      size="small"
                    ></typo3-backend-icon>
                  `:_}
              ${e.label}
            </span>
            ${e.marker?o`<span class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--marker">
                  ${e.marker}
                </span>`:e.appearance?o`<span
                  class="xima-calendar-filter__checkbox-appearance ${this.getItemClass(e.appearance)}"
                  aria-hidden="true"
                ></span>`:this.identifier==="statuses"?o`<span
                    class="xima-calendar-filter__checkbox-appearance xima-calendar-filter__checkbox-appearance--empty"
                    aria-hidden="true"
                  ></span>`:_}
          </label>
        `)}
      </div>
    `}handleChange(e,t){this.dispatchEvent(new CustomEvent("checkbox-list-change",{detail:{identifier:this.identifier,value:e,selected:t},bubbles:!0,composed:!0}))}getItemClass(e){return e?`xima-calendar-filter__checkbox-appearance--${e}`:""}};customElements.define("xima-calendar-filter-checkbox-list",g);import U from"@typo3/core/ajax/ajax-request.js";var p=class{constructor(a){this.url=a;this.saveQueue=Promise.resolve()}save(a){let e={checkboxLists:Object.fromEntries(Object.entries(a.checkboxLists).map(([t,i])=>[t,[...i]])),trees:Object.fromEntries(Object.entries(a.trees).map(([t,i])=>[t,{activeItems:[...i.activeItems],expandedItems:{...i.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new U(this.url).post(JSON.stringify(e),{headers:{"Content-Type":"application/json"}})).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};import A from"@typo3/core/ajax/ajax-request.js";async function w(r){return(await new A(r).get()).resolve()}function F(r){if(!r||typeof r!="object")return!1;let a=r,e=a.filters,t=a.filterColors,i=a.state;if(a.success!==!0||!e||typeof e!="object"||!t||typeof t!="object"||!i||typeof i!="object")return!1;let n=i;return!!e&&typeof e=="object"&&!!t&&typeof t=="object"&&!!n.checkboxLists&&typeof n.checkboxLists=="object"&&!!n.trees&&typeof n.trees=="object"}function I(r,a){let{identifier:e,value:t,selected:i}=a;return{...r,checkboxLists:{...r.checkboxLists,[e]:i?[...new Set([...r.checkboxLists[e]??[],t])]:(r.checkboxLists[e]??[]).filter(n=>n!==t)}}}function $(r,a){return{...r,trees:{...r.trees,[a.identifier]:{activeItems:[...a.activeItems],expandedItems:{...a.expandedItems}}}}}function L(r){let a=Object.fromEntries(Object.entries(r.trees).map(([e,t])=>[e,[...t.activeItems]]));return Object.entries(r.checkboxLists).forEach(([e,t])=>{a[e]=[...t]}),{filters:a}}var M="xima-calendar-filter-element",C=class extends W{constructor(){super(...arguments);this.filterConfiguration=null;this.filterColors={};this.filterState=null;this.filterLoadError=!1;this.filterStatePersistence=null}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new p(t)),this.loadFilterConfiguration()}createRenderRoot(){return this}render(){return x`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration===null?v:Object.values(this.filterConfiguration).map(e=>this.renderFilter(e))}
        </div>
      </div>
    `}renderTreeFilter(e){if(e.items.length===0)return v;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},i=e.items.map(n=>({...n,color:e.supportsColorCoding?T(e.identifier,n.value,this.filterColors):void 0}));return x`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>

        <xima-calendar-filter-tree
          .identifier=${e.identifier}
          .treeTitle=${e.title}
          .items=${i}
          .activeItems=${t.activeItems}
          .expandedItems=${t.expandedItems}
          @tree-state-change=${this.handleTreeStateChange}
        ></xima-calendar-filter-tree>
      </section>
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxListFilter(e)}handleTreeStateChange(e){this.filterState!==null&&this.updateFilterState(t=>$(t,e.detail))}renderCheckboxListFilter(e){if(e.items.length===0)return v;let t=this.filterState?.checkboxLists[e.identifier]??[];return x`
      <section class="xima-calendar-filter__section">
        <h3>${e.title}</h3>
        <xima-calendar-filter-checkbox-list
          .identifier=${e.identifier}
          .items=${e.items}
          .activeItems=${t}
          @checkbox-list-change=${this.handleCheckboxListChange}
        ></xima-calendar-filter-checkbox-list>
      </section>
    `}async loadFilterConfiguration(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let i=await w(t);if(!F(i))throw new Error("Filter configuration could not be loaded");this.filterConfiguration=i.filters,this.filterColors=i.filterColors,this.filterState=i.state,this.publishFilterConfiguration(),this.publishFilterState()}catch(i){console.error("Calendar filter configuration could not be loaded",i),this.filterLoadError=!0}this.requestUpdate()}handleCheckboxListChange(e){this.filterState!==null&&this.updateFilterState(t=>I(t,e.detail))}publishFilterConfiguration(){if(this.filterConfiguration===null)return;let e=window.top;e.ximaCalendarFilterConfiguration=this.filterConfiguration,e.dispatchEvent(new CustomEvent("xima-calendar-filter-configuration-loaded",{bubbles:!0,composed:!0,detail:this.filterConfiguration}))}publishFilterState(){if(this.filterState===null)return;let e=L(this.filterState),t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}};customElements.define(M,C);export{C as CalendarFilterElement,M as navigationComponentName};
