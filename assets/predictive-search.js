/**
 *  @class
 *  @function PredictiveSearch
 */
class PredictiveSearch {
  constructor() {
    this.container = document.getElementById('Search-Drawer');
    this.form = this.container.querySelector('.search-drawer--searchform');
    this.button = document.querySelectorAll('.thb-quick-search');
    this.input = this.container.querySelector('input[type="search"]');
    this.predictiveSearchResultsWrapper = this.container.querySelector('.search-drawer--inner');
    this.predictiveSearchResults = this.predictiveSearchResultsWrapper.querySelector('.thb-predictive-search');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.form.addEventListener('submit', this.onFormSubmit.bind(this));

    this.input.addEventListener('input', debounce((event) => {
      this.onChange(event);
    }, 300).bind(this));

    this.button.forEach((item, i) => {
      item.addEventListener('click', (event) => {
        var _this = this;
        event.preventDefault();
        document.body.classList.toggle('open-search');
        document.body.classList.toggle('open-cc');
        if (document.body.classList.contains('open-search')) {
          setTimeout(function () {
            _this.input.focus({
              preventScroll: true
            });
          }, 100);
          dispatchCustomEvent('search:open');
        }

        return false;
      });
    });
  }

  getQuery() {
    return this.input.value.trim();
  }

  onChange() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      this.container.classList.remove('active');
      return;
    }
    this.container.classList.add('active');
    this.getSearchResults(searchTerm);
  }

  onFormSubmit(event) {
    if (!this.getQuery().length) {
      event.preventDefault();
    }
  }

  onFocus() {
    const searchTerm = this.getQuery();

    if (!searchTerm.length) {
      return;
    }

    this.getSearchResults(searchTerm);
  }

  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();

    this.predictiveSearchResults.classList.add('loading');

    fetch(`${theme.routes.predictive_search_url}?q=${encodeURIComponent(searchTerm)}&${encodeURIComponent('resources[type]')}=product,collection,article,query&${encodeURIComponent('resources[limit]')}=6&section_id=predictive-search`)
      .then((response) => {
        this.predictiveSearchResults.classList.remove('loading');
        if (!response.ok) {
          var error = new Error(response.status);
          throw error;
        }

        return response.text();
      })
      .then((text) => {
        const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector('#shopify-section-predictive-search').innerHTML;

        this.renderSearchResults(resultsMarkup);
      })
      .catch((error) => {
        throw error;
      });
  }

  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;

    let _this = this,
      submitButton = this.container.querySelector('#search-results-submit');

    if (document.body.classList.contains('animations-true')) {
      gsap.to(this.predictiveSearchResults.querySelectorAll('.product-card .product-featured-image-link'), { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
    }
    submitButton.addEventListener('click', () => {
      _this.form.submit();
    });
  }

  close() {
    this.container.classList.remove('active');
  }
}
window.addEventListener('load', () => {
  if (typeof PredictiveSearch !== 'undefined') {
    new PredictiveSearch();
  }
});