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
		// Two different situations share this same element, and they need
		// two different fetch-timing strategies:
		//
		// - Standalone sections (e.g. sections/product-recommendations.liquid)
		//   default to `display: none` in CSS (see .product-recommendations
		//   in product.css / cart.css — it only switches to `display: block`
		//   once fetchProducts() below adds the "--loaded" class) and
		//   typically sit well below the fold. For these, fetching
		//   immediately on connect means the response often arrives long
		//   before anyone has scrolled near it, and everything downstream
		//   (lazysizes, GSAP ScrollTrigger) reacts to scroll position — so
		//   content that shows up that early can end up stuck until some
		//   unrelated later scroll/resize event wakes those systems back up.
		//   Deferring the fetch with an IntersectionObserver until the
		//   section is actually near the viewport avoids that (same approach
		//   Shopify's own reference theme, Dawn, uses).
		//
		// - .complementary-products (product-grid.css) is deliberately kept
		//   `display: block` from the start — it's part of the sticky PDP
		//   info panel (title/price/variant picker/etc, see
		//   .thb-product-detail .product-information in product.css), not a
		//   separate below-the-fold section. That panel is usually taller
		//   than the viewport, so this block near its bottom can stay
		//   geometrically off-screen — and therefore un-intersected — for
		//   the entire time the panel is stuck, however long that takes
		//   depending on the image gallery's own height. Waiting for an
		//   intersection here just reproduces the "arrives suspiciously late"
		//   symptom through a different mechanism. Fetch it immediately
		//   instead, same as before IntersectionObserver was introduced;
		//   fetchProducts() below already handles showing it correctly
		//   whenever it does scroll into view (lazysizes' load-then-unveil,
		//   ScrollTrigger.refresh()).
		if (getComputedStyle(this).display !== 'none') {
			this.fetchProducts();
			return;
		}

		if ('IntersectionObserver' in window) {
			const target = this.closest('.shopify-section') || this.parentElement || this;
			const observer = new IntersectionObserver((entries) => {
				entries.forEach((entry) => {
					if (!entry.isIntersecting) return;
					observer.unobserve(target);
					this.fetchProducts();
				});
			}, { rootMargin: '0px 0px 400px 0px' });
			observer.observe(target);
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
