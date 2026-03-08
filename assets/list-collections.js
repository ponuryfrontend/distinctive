/**
 *  @class
 *  @function Listcollections
 */
if (!customElements.get('list-collections')) {
  class Listcollections extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.setAnimations();

      if (Shopify.designMode) {
        this.addEventListener('shopify:section:load', (event) => {
          this.setAnimations();

          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);
        });
      }
    }
    setAnimations() {
      ScrollTrigger.batch(this.querySelectorAll('.collection-card--image-image'), {
        start: "top 90%",
        onEnter: (elements, triggers) => {
          gsap.fromTo(elements, { scale: 1.15 }, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing, clearProps: 'transform' });
        },
      });
    }
  }
  customElements.define('list-collections', Listcollections);
}