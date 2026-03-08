/**
 *  @class
 *  @function MultipleMediaWithText
 */
if (!customElements.get('multiple-media-with-text')) {
  class MultipleMediaWithText extends HTMLElement {
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
      ScrollTrigger.batch(this.querySelectorAll('.multiple-media-with-text--images-image-inner'), {
        start: "top 90%",
        onEnter: (elements, triggers) => {
          gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
        },
      });
    }
  }
  customElements.define('multiple-media-with-text', MultipleMediaWithText);
}