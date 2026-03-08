/**
 *  @class
 *  @function ProductSidePanelLinks
 */
if (!customElements.get('side-panel-links')) {
  class SidePanelLinks extends HTMLElement {
    constructor() {
      super();
      this.links = this.querySelectorAll('button');
    }
    connectedCallback() {
      this.setupObservers();
    }
    setupObservers() {
      this.links.forEach((item, i) => {
        let id = item.dataset.id,
          drawer = document.querySelector(id);

        item.addEventListener('click', (e) => {
          document.body.classList.add('open-cc');
          drawer.classList.add('active');
        });
      });
    }
  }

  customElements.define('side-panel-links', SidePanelLinks);
}