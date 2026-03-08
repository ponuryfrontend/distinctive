/**
 *  @class
 *  @function CollectionTabs
 */

if (!customElements.get('collection-tabs')) {
  class CollectionTabs extends HTMLElement {

    constructor() {
      super();
      this.buttons = Array.from(this.querySelectorAll('button'));
      this.links = this.closest('.section-header')?.querySelectorAll('.linked-to-tab') || [];
      this.target = this.dataset.target;
    }
    connectedCallback() {
      this.buttons.forEach((button, i) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this.onTabClick(button, i);
        });
      });
      if (Shopify.designMode) {
        this.addEventListener('shopify:block:select', (event) => {
          let index = this.buttons.indexOf(event.target);
          if (index > -1) {
            this.onTabClick(this.buttons[index], index);
          }
        });
      }
    }
    onTabClick(button, index) {
      let handle = button.dataset.collection;

      this.buttons.forEach(el => el.classList.remove('active'));
      button.classList.add('active');

      if (this.links.length) {
        this.setActiveLink(index);
      }
      if (handle) {
        this.toggleCollection(handle);
      }
    }
    setActiveLink(index) {
      this.links.forEach(el => el.classList.remove('active'));
      this.links[index].classList.add('active');
    }
    toggleCollection(handle) {
      let slider = document.getElementById(this.target),
        products = slider.querySelectorAll(`.columns:not([data-collection="${handle}"])`),
        active_products = slider.querySelectorAll(`[data-collection="${handle}"]`),
        flkty = Flickity.data(slider);

      products.forEach(el => {
        el.classList.remove('carousel__slide');
        slider.append(el);
      });
      active_products.forEach(el => el.classList.add('carousel__slide'));

      flkty.insert(active_products);
      flkty.reloadCells();
      flkty.select(0, 0, 1);
    }
  }
  customElements.define('collection-tabs', CollectionTabs);
}
