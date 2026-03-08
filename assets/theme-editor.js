window.addEventListener('load', () => {

	document.addEventListener('shopify:section:load', function (event) {
		const section = event.target;

		if (section.classList.contains('product-section')) {
			window.dispatchEvent(new Event('resize'));
		}
		if (section.querySelectorAll('product-card').length > 0) {
			ScrollTrigger.batch('.animations-true .product-card .product-featured-image-link, .animations-true .products .gallery--item figure', {
				start: "top 90%",
				onEnter: (elements, triggers) => {
					gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
				}
			});
		}
		if (section.querySelectorAll('.blog-post').length > 0) {
			ScrollTrigger.batch('.animations-true .blog-post .featured-image--link', {
				start: "top 90%",
				onEnter: (elements, triggers) => {
					gsap.to(elements, { scale: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
				}
			});
		}
		if (section.querySelectorAll('.multicolumn--column-inner').length > 0) {
			ScrollTrigger.batch('.animations-true .multicolumn--column-inner', {
				start: "top 90%",
				onEnter: (elements, triggers) => {
					gsap.to(elements, { y: 1, opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
				}
			});
		}
		setTimeout(() => {
			ScrollTrigger.refresh();
		}, 100);
	});
});
