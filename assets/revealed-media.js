/**
 *  @class
 *  @function RevealedMedia
 */
if (!customElements.get('revealed-media')) {
  class RevealedMedia extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.container = this.querySelector('.revealed-media--inner');
      this.image = this.querySelector('.revealed-media--media');
      this.content = this.querySelector('.revealed-media--content');

      let _this = this;
      this.tl = gsap.timeline({
        scrollTrigger: {
          trigger: _this.container,
          start: "center center",
          pin: true,
          scrub: 0.5,
          invalidateOnRefresh: 1,
          anticipatePin: 1,
        }
      });
      this.setupScroll();
    }

    setupScroll() {
      let _this = this;
      this.tl
        .fromTo(_this.image, {
          clipPath: "inset(25% 35% 25%)",
        }, {
          clipPath: "inset(0% 0% 0%)",
          ease: "none",
          duration: 1,
        })
        .fromTo(_this.content,
          {
            filter: "blur(20px)",
          },
          {
            autoAlpha: 1,
            filter: "blur(0px)",
            ease: "none",
            duration: 0.5,
          });
    }
  }
  customElements.define('revealed-media', RevealedMedia);
}