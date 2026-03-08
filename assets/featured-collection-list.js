/**
 *  @class
 *  @function FeaturedCollectionList
 */

if (!customElements.get('featured-collection-list')) {
  class FeaturedCollectionList extends HTMLElement {
    constructor() {
      super();
      this.buttons = Array.from(this.querySelectorAll('.featured-collection-list--button'));
    }
    connectedCallback() {
      this.setupAnimations();
      this.buttons.forEach((button) => {
        const image = button.querySelector('.featured-collection-list--image');
        if (image) {
          button.addEventListener('mousemove', (event) => {
            this.onMove(event, image);
          });
        }
      });
      if (Shopify.designMode) {
        this.addEventListener('shopify:section:load', () => {
          this.setupAnimations();

          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);
        });
      }
    }
    onMove(event, image) {
      if (event.layerX > 0 && event.layerY > 0 && event.target.classList.contains('featured-collection-list--span')) {
        image.style.transform = `translate3d(${event.layerX}px, ${event.layerY}px, 0px)`;
      }
    }
    setupAnimations() {
      ScrollTrigger.batch(this.querySelectorAll('.featured-collection-list--span span'), {
        onEnter: (elements) => {
          gsap.to(elements, { y: 0, stagger: 0.1, ease: window.theme.settings.animation_easing });
        },
      });
    }
  }
  customElements.define('featured-collection-list', FeaturedCollectionList);
}
