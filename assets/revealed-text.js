/**
 *  @class
 *  @function RevealedText
 */
if (!customElements.get('revealed-text')) {
  class RevealedText extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.container = this.querySelector('.revealed-text--inner');
      this.content = this.querySelector('.revealed-text--heading');
      this.splittext = new SplitText(this.content, {
        type: 'lines',
      });

      let _this = this;
      this.tl = gsap.timeline({
        scrollTrigger: {
          trigger: _this.container,
          start: "center center",
          pin: true,
          scrub: 1,
          invalidateOnRefresh: 1,
          anticipatePin: 1,
        }
      });
      this.setupScroll();
    }

    setupScroll() {
      document.fonts.ready.then(() => {
        this.splittext.lines.forEach((line) => {
          this.tl
            .fromTo(line, {
              opacity: 0.2,
              filter: "blur(5px)",
            }, {
              opacity: 1,
              filter: "blur(0px)",
              ease: "none",
              duration: 0.5,
            });
        });
      });

    }
  }
  customElements.define('revealed-text', RevealedText);
}