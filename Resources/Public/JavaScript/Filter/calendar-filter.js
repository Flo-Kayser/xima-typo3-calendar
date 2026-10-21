import{html as x,LitElement as M,nothing as v}from"lit";var T=(r,i,e={})=>{let t=e[r]?.[String(i)];if(t)return t;let a=[...`${r}:${i}`].reduce((s,l)=>s*31+l.charCodeAt(0)>>>0,0);return`hsl(${Math.round(a*137.508%360)} 68% 46%)`};import{html as V,LitElement as P}from"lit";var m=class extends P{createRenderRoot(){return this}render(){let i=window.top,t=(i.TYPO3?.settings?.ximaCalendar?.locale??document.documentElement.lang??navigator.language)?.startsWith("de")?"Suchbegriff eingeben":i.TYPO3?.lang?.["filter.search"]??"Enter search term";return V`
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
    `}};customElements.define("xima-calendar-filter-toolbar",m);import{html as u,LitElement as O,nothing as f}from"lit";function y(r,i,e){return e?[...new Set([...r,i])]:r.filter(t=>t!==i)}function j(r,i){let e=[],t=[i];for(;t.length>0;){let a=t.pop();if(a!==void 0)for(let n of r)n.parentUid===a&&(e.push(n.value),t.push(n.value))}return e}function S(r,i,e,t){let a=j(i,e);return t?[...new Set([...r,...a])]:r.filter(n=>!a.includes(n))}function k(r,i,e){return{...r,[i]:e}}var b=class extends O{constructor(){super(...arguments);this.identifier="";this.treeTitle="";this.actionLabels=null;this.items=[];this.activeItems=[];this.expandedItems={};this.openActionValue=null}static{this.properties={identifier:{attribute:!1},treeTitle:{attribute:!1},actionLabels:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1},expandedItems:{attribute:!1}}}createRenderRoot(){return this}render(){let e=this.getLanguageLabel("filter.moreActions","More actions"),t=this.getLanguageLabel("filter.selectAllChildren","Select all nested ###name###"),a=this.getLanguageLabel("filter.deselectAllChildren","Deselect all nested ###name###");return u`
      <div class="xima-calendar-filter__tree">
        ${this.renderTreeNodes(null,e,t,a)}
      </div>
    `}renderTreeNodes(e,t,a,n){return this.items.filter(l=>l.parentUid===e).map(l=>{let d=this.items.some(o=>o.parentUid===l.value),p=this.expandedItems[String(l.value)]??!1,w=this.activeItems.includes(l.value);return u`
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
                .checked=${w}
                style=${l.color?`--xima-tree-item-color: ${l.color}`:""}
                @change=${o=>this.handleSelectionChange(l.value,o.target.checked)}
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
                    @click=${o=>{o.stopPropagation(),this.toggleActionMenu(l.value)}}
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
                          @click=${o=>{o.stopPropagation(),this.handleDescendantSelection(l.value,!0)}}
                        >${a}</button>
                        <button
                          type="button"
                          role="menuitem"
                          @click=${o=>{o.stopPropagation(),this.handleDescendantSelection(l.value,!1)}}
                        >${n}</button>
                      </div>
                    `:f}
                </div>
              `:f}
          </div>

          ${d&&p?u`
              <div class="xima-calendar-filter__tree-children">
                ${this.renderTreeNodes(l.value,t,a,n)}
              </div>
            `:f}
        </div>
      `})}getLanguageLabel(e,t){let a=e.replace("filter.","");return(this.actionLabels?.[a]??t).replace("###name###",this.treeTitle)}handleSelectionChange(e,t){this.activeItems=y(this.activeItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}toggleActionMenu(e){this.openActionValue=this.openActionValue===e?null:e,this.requestUpdate()}handleDescendantSelection(e,t){this.activeItems=S(this.activeItems,this.items,e,t),this.openActionValue=null,this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}handleExpansionChange(e,t){this.expandedItems=k(this.expandedItems,e,t),this.dispatchEvent(new CustomEvent("tree-state-change",{detail:{identifier:this.identifier,activeItems:this.activeItems,expandedItems:this.expandedItems},bubbles:!0}))}};customElements.define("xima-calendar-filter-tree",b);import{html as c,LitElement as R,nothing as L}from"lit";var g=class extends R{constructor(){super(...arguments);this.identifier="";this.items=[];this.activeItems=[]}static{this.properties={identifier:{attribute:!1},items:{attribute:!1},activeItems:{attribute:!1}}}createRenderRoot(){return this}render(){return c`
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
    `}handleChange(e,t){this.dispatchEvent(new CustomEvent("checkbox-list-change",{detail:{identifier:this.identifier,value:e,selected:t},bubbles:!0,composed:!0}))}getItemClass(e){return e?`xima-calendar-filter__checkbox-appearance--${e}`:""}};customElements.define("xima-calendar-filter-checkbox-list",g);import A from"@typo3/core/ajax/ajax-request.js";var h=class{constructor(i){this.url=i;this.saveQueue=Promise.resolve()}save(i){let e={sections:{...i.sections},checkboxLists:Object.fromEntries(Object.entries(i.checkboxLists).map(([t,a])=>[t,[...a]])),trees:Object.fromEntries(Object.entries(i.trees).map(([t,a])=>[t,{activeItems:[...a.activeItems],expandedItems:{...a.expandedItems}}]))};this.saveQueue=this.saveQueue.catch(()=>{}).then(async()=>{try{await(await new A(this.url).post(JSON.stringify(e),{headers:{"Content-Type":"application/json"}})).resolve()}catch(t){console.error("Calendar filter state could not be saved",t)}})}};import U from"@typo3/core/ajax/ajax-request.js";async function _(r){return(await new U(r).get()).resolve()}function F(r){if(!r||typeof r!="object")return!1;let i=r,e=i.filters,t=i.filterColors,a=i.state,n=i.labels;if(i.success!==!0||!e||typeof e!="object"||!t||typeof t!="object"||!a||typeof a!="object"||!n||typeof n!="object")return!1;let s=a;return!!e&&typeof e=="object"&&!!t&&typeof t=="object"&&!!s.checkboxLists&&typeof s.checkboxLists=="object"&&!!s.trees&&typeof s.trees=="object"&&!!s.sections&&typeof s.sections=="object"}function $(r,i){let{identifier:e,value:t,selected:a}=i;return{...r,checkboxLists:{...r.checkboxLists,[e]:a?[...new Set([...r.checkboxLists[e]??[],t])]:(r.checkboxLists[e]??[]).filter(n=>n!==t)}}}function I(r,i){return{...r,trees:{...r.trees,[i.identifier]:{activeItems:[...i.activeItems],expandedItems:{...i.expandedItems}}}}}function E(r){let i=Object.fromEntries(Object.entries(r.trees).map(([e,t])=>[e,[...t.activeItems]]));return Object.entries(r.checkboxLists).forEach(([e,t])=>{i[e]=[...t]}),{filters:i}}var N="xima-calendar-filter-element",C=class extends M{constructor(){super(...arguments);this.filterConfiguration=null;this.filterColors={};this.filterState=null;this.filterLabels=null;this.filterLoadError=!1;this.filterStatePersistence=null}connectedCallback(){super.connectedCallback();let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_state??e.TYPO3?.settings?.ximaCalendar?.filterStateUrl;t&&(this.filterStatePersistence=new h(t)),this.loadFilterConfiguration()}createRenderRoot(){return this}render(){return x`
      <link rel="stylesheet" href="${new URL("../../Css/calendar-filter.css",import.meta.url).href}">

      <div class="xima-calendar-filter">
        <xima-calendar-filter-toolbar></xima-calendar-filter-toolbar>

        <div class="xima-calendar-filter__body">
          ${this.filterConfiguration===null?v:Object.values(this.filterConfiguration).map(e=>this.renderFilter(e))}
        </div>
      </div>
    `}renderTreeFilter(e){if(e.items.length===0)return v;let t=this.filterState?.trees[e.identifier]??{activeItems:[],expandedItems:{}},a=e.items.map(n=>({...n,color:e.supportsColorCoding?T(e.identifier,n.value,this.filterColors):void 0}));return x`
      <section class="xima-calendar-filter__section">
        <details
          .open=${this.filterState?.sections[e.identifier]??!0}
          @toggle=${n=>this.handleSectionToggle(e.identifier,n)}
        >
          <summary>
            <span class="xima-calendar-filter__section-toggle" aria-hidden="true"></span>
            <h3>${e.title}</h3>
          </summary>

          <xima-calendar-filter-tree
            .identifier=${e.identifier}
            .treeTitle=${e.title}
            .actionLabels=${this.filterLabels}
            .items=${a}
            .activeItems=${t.activeItems}
            .expandedItems=${t.expandedItems}
            @tree-state-change=${this.handleTreeStateChange}
          ></xima-calendar-filter-tree>
        </details>
      </section>
    `}renderFilter(e){return e.type==="tree"?this.renderTreeFilter(e):this.renderCheckboxListFilter(e)}handleTreeStateChange(e){this.filterState!==null&&this.updateFilterState(t=>I(t,e.detail))}renderCheckboxListFilter(e){if(e.items.length===0)return v;let t=this.filterState?.checkboxLists[e.identifier]??[];return x`
      <section class="xima-calendar-filter__section">
        <details
          .open=${this.filterState?.sections[e.identifier]??!0}
          @toggle=${a=>this.handleSectionToggle(e.identifier,a)}
        >
          <summary>
            <span class="xima-calendar-filter__section-toggle" aria-hidden="true"></span>
            <h3>${e.title}</h3>
          </summary>
          <xima-calendar-filter-checkbox-list
            .identifier=${e.identifier}
            .items=${e.items}
            .activeItems=${t}
            @checkbox-list-change=${this.handleCheckboxListChange}
          ></xima-calendar-filter-checkbox-list>
        </details>
      </section>
    `}async loadFilterConfiguration(){let e=window.top,t=e.TYPO3?.settings?.ajaxUrls?.xima_calendar_filter_options??e.TYPO3?.settings?.ximaCalendar?.filterOptionsUrl;if(!t){console.error("Calendar filter URL is not available"),this.filterLoadError=!0,this.requestUpdate();return}try{let a=await _(t);if(!F(a))throw new Error("Filter configuration could not be loaded");this.filterConfiguration=a.filters,this.filterColors=a.filterColors,this.filterState=a.state,this.filterLabels=a.labels,this.publishFilterConfiguration(),this.publishFilterState()}catch(a){console.error("Calendar filter configuration could not be loaded",a),this.filterLoadError=!0}this.requestUpdate()}handleCheckboxListChange(e){this.filterState!==null&&this.updateFilterState(t=>$(t,e.detail))}handleSectionToggle(e,t){let a=t.currentTarget;!(a instanceof HTMLDetailsElement)||this.filterState===null||this.updateFilterState(n=>({...n,sections:{...n.sections,[e]:a.open}}))}publishFilterConfiguration(){if(this.filterConfiguration===null)return;let e=window.top;e.ximaCalendarFilterConfiguration=this.filterConfiguration,e.dispatchEvent(new CustomEvent("xima-calendar-filter-configuration-loaded",{bubbles:!0,composed:!0,detail:this.filterConfiguration}))}publishFilterState(){if(this.filterState===null)return;let e=E(this.filterState),t=window.top;t.ximaCalendarFilterState=e,t.dispatchEvent(new CustomEvent("xima-calendar-filter-changed",{bubbles:!0,composed:!0,detail:e}))}dispatchFilterChange(){this.publishFilterState(),this.requestUpdate(),this.filterState!==null&&this.filterStatePersistence?.save(this.filterState)}updateFilterState(e){this.filterState!==null&&(this.filterState=e(this.filterState),this.dispatchFilterChange())}};customElements.define(N,C);export{C as CalendarFilterElement,N as navigationComponentName};
