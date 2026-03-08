class FacetFiltersForm extends HTMLElement {
  static get observedAttributes() {
    return ['selected-index'];
  }
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);

    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);

    this.querySelector('form').addEventListener('input', this.debouncedOnSubmit.bind(this));
  }
  get selectedIndex() {
    return parseInt(this.getAttribute('selected-index')) || 0;
  }
  set selectedIndex(index) {
    this.setAttribute('selected-index', index);
  }
  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener('popstate', onHistoryChange);
  }

  static toggleActiveFacets(disable = true) {
    document.querySelectorAll('.js-facet-remove').forEach((element) => {
      element.classList.toggle('disabled', disable);
    });
  }

  static toggleActiveTabs() {
    document.querySelectorAll('.facets-popup-modal--tabs-button').forEach((element, i) => {
      element.classList.toggle('active', i == FacetFiltersForm.selectedIndex);
    });
    document.querySelectorAll('.facets-popup-modal--tab').forEach((element, i) => {
      element.classList.toggle('active', i == FacetFiltersForm.selectedIndex);
    });
  }

  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const container = document.getElementsByClassName('thb-filter-count');
    document.getElementById('ProductGridContainer').querySelector('.collection').classList.add('loading');

    for (var item of container) {
      item.classList.add('loading');
    }

    sections.forEach((section) => {
      const url = `${window.location.pathname}?section_id=${section.section}&${searchParams}`;
      const filterDataUrl = element => element.url === url;

      if (FacetFiltersForm.filterData.some(filterDataUrl)) {
        FacetFiltersForm.renderSectionFromCache(filterDataUrl, event);
      } else {
        FacetFiltersForm.renderSectionFromFetch(url, event);
      }
    });
    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }

  static renderSectionFromFetch(url, event) {
    fetch(url)
      .then(response => response.text())
      .then((responseText) => {
        const html = responseText;
        FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, {
          html,
          url
        }];
        FacetFiltersForm.renderFilters(html, event);
        FacetFiltersForm.renderProductGridContainer(html);
        FacetFiltersForm.renderProductCount(html);

      });
  }

  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }

  static renderProductGridContainer(html) {
    document.getElementById('ProductGridContainer').innerHTML = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductGridContainer').innerHTML;

    ScrollTrigger.batch('.animations-true .product-card .product-featured-image-link, .animations-true .products .gallery--item figure', {
      start: "top 90%",
      onEnter: (elements, triggers) => {
        gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
      }
    });

    document.getElementById('Facets-Toggle-Fixed')?.setElements();
  }

  static renderProductCount(html) {
    const countHtml = new DOMParser().parseFromString(html, 'text/html').getElementById('ProductCount');
    const container = document.getElementsByClassName('thb-filter-count');

    if (countHtml) {
      for (var item of container) {
        item.innerHTML = countHtml.innerHTML;
        item.classList.remove('loading');
      }
    }

  }

  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, 'text/html');

    const facetDetailsElements = parsedHTML.querySelectorAll('#FacetsModal-inner .facets-popup-modal--tab');
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest('.facets-popup-modal--tab') : undefined;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter(element => !matchesIndex(element));

    facetsToRender.forEach((element) => {
      document.querySelector(`.facets-popup-modal--tab[data-index="${element.dataset.index}"]`).innerHTML = element.innerHTML;
    });

    FacetFiltersForm.renderTabs(parsedHTML);
    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);

    if (typeof SelectWidth !== 'undefined') {
      new SelectWidth();
    }
  }

  static renderTabs(html) {
    const tabsToRender = html.querySelector('#FacetsModal-inner .facets-popup-modal--tabs');
    const buttons = Array.from(html.querySelectorAll('.facets-popup-modal--tabs-button'));
    const index = FacetFiltersForm.selectedIndex;

    const tabSelectors = ['#FacetsModal-inner .facets-popup-modal--tabs, #FacetsModal-inner .facets-popup-modal__content-info'];

    tabSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveTabs();
  }

  static renderActiveFacets(html) {
    const activeFacetElementSelectors = ['.active-facets'];

    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });

    FacetFiltersForm.toggleActiveFacets(false);
  }

  static renderAdditionalElements(html) {
    const facetButtons = ['#Facets-Toggle', '#Facets-Toggle-Fixed', '#FacetFiltersForm-buttons', '.thb-filter-sort-count--bar', '.thb-filter-sort-count--modal'];

    facetButtons.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });
  }

  static updateURLHash(searchParams) {
    history.pushState({
      searchParams
    }, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
  }

  static getSections() {
    return [
      {
        section: document.getElementById('product-grid').dataset.id,
      }];
  }

  onSubmitHandler(event) {
    event.preventDefault();
    const formData = new FormData(event.target.closest('form'));
    const searchParams = new URLSearchParams(formData);


    if (searchParams.get('filter.v.price.gte') === "0.00") {
      searchParams.delete('filter.v.price.gte');
    }
    if (document.querySelector('.price_slider')) {
      if (searchParams.get('filter.v.price.lte') === parseFloat(document.querySelector('.price_slider').dataset.max).toFixed(2)) {
        searchParams.delete('filter.v.price.lte');
      }
    }
    FacetFiltersForm.renderPage(searchParams.toString(), event);
  }

  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url = event.currentTarget.href.indexOf('?') == -1 ? '' : event.currentTarget.href.slice(event.currentTarget.href.indexOf('?') + 1);
    FacetFiltersForm.renderPage(url);
  }
}

FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define('facet-filters-form', FacetFiltersForm);
FacetFiltersForm.setListeners();


class FacetRemove extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll('a').forEach((item) => {
      item.addEventListener('click', (event) => {
        event.preventDefault();
        const form = this.closest('facet-filters-form');
        form.onActiveFilterClick(event);
      });
    });
  }
}

customElements.define('facet-remove', FacetRemove);

/**
 *  @class
 *  @function PriceSlider
 */
class PriceSlider extends HTMLElement {

  constructor() {
    super();
  }
  connectedCallback() {
    let slider = this.querySelector('.price_slider'),
      amounts = this.querySelector('.price_slider_amount'),
      args = {
        start: [parseFloat(slider.dataset.minValue || 0), parseFloat(slider.dataset.maxValue || slider.dataset.max)],
        connect: true,
        step: 10,
        direction: document.dir,
        handleAttributes: [
          { 'aria-label': 'lower' },
          { 'aria-label': 'upper' },
        ],
        range: {
          'min': 0,
          'max': parseFloat(slider.dataset.max)
        }
      },
      event = new CustomEvent('input'),
      form = this.closest('facet-filters-form') || document.querySelector('facet-filters-form');

    if (slider.classList.contains('noUi-target')) {
      slider.noUiSlider.destroy();
    }
    noUiSlider.create(slider, args);

    slider.noUiSlider.on('update', function (values) {
      amounts.querySelector('.field__input_min').value = values[0];
      amounts.querySelector('.field__input_max').value = values[1];
    });
    slider.noUiSlider.on('change', function (values) {
      form.querySelector('form').dispatchEvent(event);
    });
  }
}
customElements.define('price-slider', PriceSlider);


/**
 *  @class
 *  @function FacetsButtons
 */
if (!customElements.get('facet-buttons')) {
  class FacetButtons extends HTMLElement {
    constructor() {
      super();

    }
    connectedCallback() {
      this.setupObservers();

      this.debouncedOnDom = debounce((event) => {
        this.setupObservers();
      }, 500);

      var observer = new MutationObserver(this.debouncedOnDom.bind(this));
      observer.observe(this, { childList: true });
    }
    setupObservers() {
      this.buttons = this.querySelectorAll('button');
      this.drawer = document.getElementById(this.dataset.target);
      this.links = this.drawer.querySelectorAll('.facets-popup-modal--tabs-button');
      this.panels = this.drawer.querySelectorAll('.facets-popup-modal--tab');

      this.buttons.forEach((item, i) => {
        item.addEventListener('click', (e) => this.onClick(e, i));
      });
      this.links.forEach((item, i) => {
        item.addEventListener('click', (e) => this.onClick(e, i));
      });
    }
    onClick(e, i) {

      this.links.forEach((link) => {
        link.classList.remove('active');
      });
      this.links[i].classList.add('active');

      this.panels.forEach((panel) => {
        panel.classList.remove('active');
      });
      this.panels[i].classList.add('active');

      FacetFiltersForm.selectedIndex = i;
      e.preventDefault();
    }
  }

  customElements.define('facet-buttons', FacetButtons);
}

/**
 *  @class
 *  @function FacetToggle
 */
if (!customElements.get('facet-toggle')) {
  class FacetToggle extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.setElements();
      this.addEventListener('click', this.onClick.bind(this));
      this.setupObservers();
    }
    disconnectedCallback() {
      this.observer.unobserve(this.wrapper);
    }
    setupObservers() {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
    setElements() {
      this.drawer = document.getElementById(this.dataset.target);
      this.wrapper = this.closest('.collection-container').querySelector('#product-grid');
      this.form = this.closest('#FacetFiltersForm');
    }
    onClick() {
      this.drawer.show();
    }
    onScroll() {
      let total = this.wrapper.offsetTop + this.wrapper.offsetHeight - window.innerHeight + 90;
      if (window.scrollY < this.wrapper.offsetTop) {
        this.classList.remove('sticky');
      } else if (window.scrollY > this.wrapper.offsetTop && window.scrollY < total) {
        this.classList.add('sticky');
      } else if (window.scrollY >= total) {
        this.classList.remove('sticky');
      }
    }
  }

  customElements.define('facet-toggle', FacetToggle);
}