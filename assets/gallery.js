/**
 *  @class
 *  @function Gallery
 */
if (!customElements.get('theme-gallery')) {
  class ThemeGallery extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.galleryVideoList = Array.from(this.querySelectorAll('.gallery--item .gallery--video'));

      this.hoverPlayList = this.galleryVideoList.filter((item) => {
        return item.classList.contains('hover-play') && item;
      });

      this.autoPlayList = this.galleryVideoList.filter((item) => {
        return !item.classList.contains('hover-play') && item;
      });

      this.autoPlayList.forEach((item, i) => {
        item.querySelector('video').play();
      });

      this.setHoverPlayList();

      this.setAnimations();

      if (Shopify.designMode) {
        this.addEventListener('shopify:section:load', (event) => {
          this.setAnimations();

          setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);
        });
      }
    }

    setHoverPlayList() {
      this.hoverPlayList.forEach((item, i) => {
        item.querySelector('video').currentTime = 0.1;
        item.parentElement.addEventListener('mouseenter', () => this.playVideo(item));
        item.parentElement.addEventListener('mouseleave', () => this.pauseVideo(item));
      });
    }

    playVideo(videoContainer) {
      videoContainer.querySelector('video').play();
    }
    pauseVideo(videoContainer) {
      videoContainer.querySelector('video').pause();
    }

    setAnimations() {
      ScrollTrigger.batch(this.querySelectorAll('figure'), {
        start: "top 90%",
        onEnter: (elements, triggers) => {
          gsap.to(elements, { opacity: 1, stagger: 0.15, ease: window.theme.settings.animation_easing });
        },
      });
    }
  }
  customElements.define('theme-gallery', ThemeGallery);
}