/**
 *  @class
 *  @function MediaGrid
 */
if (!customElements.get('media-grid')) {
  class MediaGrid extends HTMLElement {
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
      ScrollTrigger.batch(this.querySelectorAll('.media-grid--bg'), {
        start: "top 90%",
        onEnter: (elements, triggers) => {
          gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
        },
      });
    }
  }
  customElements.define('media-grid', MediaGrid);
}