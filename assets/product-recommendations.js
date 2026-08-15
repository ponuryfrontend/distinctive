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

				// The product images just inserted above already carry a real
				// src (a tiny width=20 blur-up placeholder) with the full-size
				// version waiting in data-srcset — lazysizes' own unveil()
				// refuses to swap that in while the placeholder itself hasn't
				// finished loading yet (its internal guard checks
				// img.complete). Right after innerHTML assignment the browser
				// hasn't had a chance to even fetch that tiny placeholder, so
				// calling unveil() immediately was a no-op every time — it
				// only "worked" once some unrelated later scroll/resize event
				// gave the placeholder time to finish loading first. Wait for
				// each image's own load (already-cached placeholders fire
				// .complete immediately) before unveiling it for real.
				if (typeof lazySizes !== 'undefined') {
					this.querySelectorAll('.lazyload').forEach((el) => {
						if (el.complete) {
							lazySizes.loader.unveil(el);
						} else {
							el.addEventListener('load', () => lazySizes.loader.unveil(el), { once: true });
						}
					});
				}

				setTimeout(() => {
					window.dispatchEvent(new Event('resize'));

					ScrollTrigger.batch('.animations-true .product-card .product-featured-image-link', {
						start: "top 90%",
						onEnter: (elements, triggers) => {
							gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
						}
					});

					// The cards just inserted start at opacity: 0 (see
					// .animations-true .product-card .product-featured-image-link in
					// product-grid.css) until the batch above fires onEnter — but
					// ScrollTrigger's trigger-position math is cached from the last
					// refresh, normally the initial page load, before this content
					// existed. Adding a big chunk of markup changes the page's
					// scrollable height, so without an explicit refresh here the
					// batch can check stale positions and never fire, leaving these
					// cards invisible until something unrelated elsewhere on the
					// page happens to trigger GSAP's own refresh. Same fix already
					// used in gallery.js / media-grid.js / list-collections.js for
					// this exact "content added after initial load" situation.
					setTimeout(() => {
						ScrollTrigger.refresh();
					}, 100);
				});
			})
			.catch(e => {
				console.error(e);
			});
	}
	connectedCallback() {
		// Fetching immediately on connect (i.e. as soon as this element exists
		// in the DOM, typically right at page load) means the response —
		// including its images — often arrives while this block is still far
		// below the fold. Everything downstream (lazysizes, the GSAP
		// ScrollTrigger reveal animation) is built to react to scroll
		// position, so content that shows up long before anyone has scrolled
		// near it ends up stuck until some unrelated later scroll/resize
		// event happens to wake those systems back up.
		// Deferring the fetch itself until this element is actually near the
		// viewport sidesteps all of that: by the time the images arrive,
		// the section is already visible, so the normal scroll-driven
		// lazy-load and entrance-animation logic just works, same as any
		// other product grid on the page. (This is the same approach
		// Shopify's own reference theme, Dawn, uses for its product
		// recommendations.)
		if ('IntersectionObserver' in window) {
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					observer.unobserve(this);
					this.fetchProducts();
				});
			}, { rootMargin: '0px 0px 400px 0px' });
			observer.observe(this);
		} else {
			this.fetchProducts();
		}
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
