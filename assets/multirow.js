/**
 *  @class
 *  @function MultiRow
 */
if (!customElements.get('multi-row')) {
  class MultiRow extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.container = this.querySelector('.multi-row--inner');
      this.rows = Array.from(this.querySelectorAll('.multi-row--row'));
      this.spacer = 100;
      this.tl = gsap.timeline();

      this.initCards();
      this.setupScroll();
      window.addEventListener('resize', () => {
        this.initCards();
      });
      document.fonts.ready.then(() => {
        this.initCards();
      });
    }
    initCards() {
      this.totalOffset = 0;
      this.totalHeight = 0;
      let property = gsap.getProperty('html', '--header-height');

      this.rows.forEach((row, index) => {

        if (index > 0) {
          this.totalOffset += row.querySelector('.multi-row--content-heading').offsetHeight;
          row.dataset.offset = this.totalOffset;
        } else {
          this.totalOffset = 0 + property;
          row.dataset.offset = this.totalOffset;
        }
        this.totalHeight += row.offsetHeight;
      });

      gsap.set(this.container, { minHeight: this.totalHeight + this.totalOffset + ((this.rows.length - 1) * property) });
    }
    setupScroll() {

      let getOffset = (row) => {
        return row.dataset.offset;
      };
      this.rows.forEach((row, index) => {
        ScrollTrigger.create({
          trigger: row,
          start: `top top+=${getOffset(row)}`,
          endTrigger: this.container,
          end: `bottom bottom`,
          pinnedContainer: this.container,
          pin: true,
          scrub: true,
          pinSpacing: false,
          anticipatePin: 1,
          fastScrollEnd: true,
          invalidateOnRefresh: true,
          //markers: true,
          id: "card-" + index
        });
      });
      ScrollTrigger.addEventListener('refreshInit', this.initCards.bind(this));
    }
  }
  customElements.define('multi-row', MultiRow);
}