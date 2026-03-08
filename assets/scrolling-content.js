/**
 *  @class
 *  @function ScrollingContent
 */
if (!customElements.get('scrolling-content')) {
  class ScrollingContent extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.container = this.querySelector('.scrolling-content--inner');
      this.rows = this.querySelectorAll('.scrolling-content--section');
      this.setAnimations();

      window.addEventListener('resize', () => {
        this.initCards();
      });
    }
    getOffset() {
      return gsap.getProperty('html', '--header-height');
    }
    setAnimations() {
      this.rows.forEach((row, index) => {
        ScrollTrigger.matchMedia({
          "(min-width: 768px)": () => {
            ScrollTrigger.create({
              trigger: row,
              start: `top top+=${this.getOffset()}`,
              endTrigger: this.container,
              end: `bottom bottom`,
              pin: true,
              scrub: true,
              pinSpacing: false,
              anticipatePin: 1,
              fastScrollEnd: true,
              invalidateOnRefresh: true,
              //markers: true,
              id: "section-" + index
            });
          }
        });
        // ScrollTrigger.create({
        //   trigger: row,
        //   start: `top top+=${this.getOffset()}`,
        //   endTrigger: this.container,
        //   end: `bottom bottom`,
        //   pin: true,
        //   scrub: true,
        //   pinSpacing: false,
        //   anticipatePin: 1,
        //   fastScrollEnd: true,
        //   invalidateOnRefresh: true,
        //   //markers: true,
        //   id: "section-" + index
        // });
      });
    }

  }
  customElements.define('scrolling-content', ScrollingContent);
}