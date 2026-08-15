/**
 *  @class
 *  @function ProductRecommendations
 */
class ProductRecommendations extends HTMLElement {
	constructor() {
		super();
	}
	fetchProducts() {
		fetch(this.dataset.url)
			.then(response => response.text())
			.then(text => {
				const html = document.createElement('div');
				html.innerHTML = text;
				const recommendations = html.querySelector('product-recommendations');

				if (recommendations && recommendations.innerHTML.trim().length) {
					this.innerHTML = recommendations.innerHTML;
				}

				this.classList.add('product-recommendations--loaded');
				this.setupEvents();

				setTimeout(() => {
					window.dispatchEvent(new Event('resize'));

					ScrollTrigger.batch('.animations-true .product-card .product-featured-image-link', {
						start: "top 90%",
						onEnter: (elements, triggers) => {
							gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
						}
					});
				});
			})
			.catch(e => {
				console.error(e);
			});
	}
	connectedCallback() {
		this.fetchProducts();
	}
	setupEvents() {
		this.slideshow = Flickity.data(this.querySelector('slide-show'));
		this.prev = this.querySelector('.flickity-prev');
		this.next = this.querySelector('.flickity-next');

		if (this.next) {
			this.prev.addEventListener('click', () => this.navClick('prev'));
			this.next.addEventListener('click', () => this.navClick('next'));
		}

		this.setupPager();
	}
	navClick(direction) {
		if (direction == 'prev') {
			this.slideshow.previous();
		} else {
			this.slideshow.next();
		}
	}
	setupPager() {
		// Page-arrow counter ("1 / 2") shown in the top-right corner when the
		// section has more products than fit in one row — see
		// product-recommendations--pager in sections/product-recommendations.liquid.
		// `groupCells: true` (assets/slideshow.js, .carousel--paged) makes
		// Flickity treat one visible row as a "slide", so selectedIndex/slides
		// already line up with page number without any manual math here.
		const pager = this.querySelector('.product-recommendations--pager');
		if (!pager || !this.slideshow) return;

		const current = pager.querySelector('.product-recommendations--pager-current'),
			total = pager.querySelector('.product-recommendations--pager-total');
		if (!current || !total) return;

		const update = () => {
			current.textContent = this.slideshow.selectedIndex + 1;
			total.textContent = this.slideshow.slides.length;
		};

		update();
		this.slideshow.on('select', update);
	}

}

customElements.define('product-recommendations', ProductRecommendations);
