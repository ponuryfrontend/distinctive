/**
 *  @class
 *  @function ScrollingBoxes
 */
if (!customElements.get('scrolling-boxes')) {
  class ScrollingBoxes extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.inner = this.querySelector('.scrolling-boxes--inner');
      this.sectionIndex = this.dataset.sectionIndex;
      if (Shopify.designMode) {
        const section = this.closest('.shopify-section');
        this.sectionIndex = [...section.parentNode.children].indexOf(section) + 1;
      }

      const videoContainers = this.querySelectorAll('.scrolling-boxes--box .scrolling-boxes--video');

      videoContainers.forEach((container) => {
        const video = container.querySelector('video');
        if (container.classList.contains('hover-play')) {
          video.currentTime = 0.1;
          container.parentElement.addEventListener('mouseenter', () => video.play());
          container.parentElement.addEventListener('mouseleave', () => video.pause());
        } else {
          video.play();
        }
      });

      this.setupScroll();
    }

    setupScroll() {
      const start = this.sectionIndex == 1 ? "top top" : "center center",
        dir = document.dir === 'rtl' ? 1 : -1;

      let endX = dir * (this.inner.scrollWidth - document.documentElement.clientWidth);

      gsap.to(this.inner, {
        x: () => endX + "px",
        ease: "none",
        scrollTrigger: {
          trigger: this.inner,
          start: start,
          invalidateOnRefresh: true,
          pin: true,
          scrub: 1,
          onRefresh: () => {
            endX = dir * (this.inner.scrollWidth - document.documentElement.clientWidth);
          }
        }
      });
    }
  }
  customElements.define('scrolling-boxes', ScrollingBoxes);
}
