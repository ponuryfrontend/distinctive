/**
 *  @class
 *  @function SlideShow
 */
if (!customElements.get('slide-show')) {
  class SlideShow extends HTMLElement {
    constructor() {
      super();

    }
    connectedCallback() {
      const slideshow = this,
        dataset = slideshow.dataset;

      const slideshow_slides = Array.from(slideshow.querySelectorAll('.carousel__slide'));

      // Early return guard — prevents setup when there are no slides
      if (slideshow_slides.length < 1) return;

      const
        autoplay = dataset.autoplay == 'false' ? false : parseInt(dataset.autoplay, 10),
        align = dataset.align == 'center' ? 'center' : 'left',
        fade = dataset.fade === 'true',
        pageDots = dataset.dots === 'true',
        prev_buttons = slideshow.querySelectorAll('.flickity-prev'),
        next_buttons = slideshow.querySelectorAll('.flickity-next'),
        header = document.querySelector('theme-header'),
        custom_dots = slideshow.querySelector('.flickity-dots'),
        autoplay_progress = slideshow.querySelector('.slideshow--autoplay-progress'),
        progress_bar = slideshow.parentNode.querySelector('.flickity-progress--bar:not(.slideshow--autoplay-progress)'),
        animations = [],
        rightToLeft = document.dir === 'rtl';

      // let (not const) — prepareAnimations() below can turn this back off if
      // it throws, so the rest of the callback doesn't keep trying to play
      // entrance animations that were never actually built.
      let animations_enabled = document.body.classList.contains('animations-true') && typeof gsap !== 'undefined';

      // Cache classList checks — avoids repeated DOM reads throughout connectedCallback
      const
        isMainSlideshow = slideshow.classList.contains('main-slideshow'),
        isTestimonials = slideshow.classList.contains('testimonials--carousel'),
        isProducts = slideshow.classList.contains('products'),
        isCustomerReviews = slideshow.classList.contains('customer-reviews--carousel'),
        isCollectionGrid = slideshow.classList.contains('collection-grid__carousel'),
        isQuickView = slideshow.classList.contains('product-images-quick-view'),
        isPaged = slideshow.classList.contains('carousel--paged');

      // ES6 shorthand properties
      const args = {
        wrapAround: true,
        cellAlign: align,
        pageDots,
        contain: true,
        fade,
        autoPlay: autoplay,
        rightToLeft,
        prevNextButtons: false,
        cellSelector: '.carousel__slide',
        on: {}
      };
      this.paused = false;

      // Cache custom dots li elements once
      const cachedDots = custom_dots ? Array.from(custom_dots.querySelectorAll('li')) : null;

      if (custom_dots) {
        args.pageDots = false;
        args.pauseAutoPlayOnHover = false;
      }

      if (dataset.adapt == 'true') {
        args.adaptiveHeight = true;
      }
      if (isCustomerReviews) {
        // wrapAround is already true by default
        args.resize = true;
      }
      if (isCollectionGrid || isQuickView) {
        args.wrapAround = false;
      }
      // Main Slideshow
      if (isMainSlideshow) {
        if (animations_enabled) {
          // prepareAnimations runs entirely before `new Flickity(...)` below.
          // An uncaught error in here (e.g. a plugin like SplitText missing
          // or failing on a particular slide's markup) used to abort the
          // rest of connectedCallback silently — Flickity never got
          // constructed, so the carousel was stuck showing only the first
          // slide with no drag/autoplay/dots. Catch and degrade instead:
          // the slideshow still initializes, just without entrance
          // animations.
          try {
            slideshow.prepareAnimations(slideshow, animations);
          } catch (e) {
            console.error('Slideshow: entrance animations failed to set up, continuing without them.', e);
            animations_enabled = false;
          }
        }

        // Cache closest shopify section once for use in both ready and change
        const shopifySection = slideshow.closest('.shopify-section');

        args.on = {
          staticClick: function () {
            this.unpausePlayer();
          },
          ready: function () {
            let flkty = this;

            // Transparent Header padding.
            if (header?.classList.contains('transparent--true')) {
              let i = dataset.sectionIndex;

              if (Shopify.designMode) {
                let children = [...shopifySection.parentNode.children];
                i = children.indexOf(shopifySection) + 1;
              }
              if (i == 1 && slideshow.classList.contains('section-spacing--disable-top')) {
                slideshow.classList.add('slideshow--top');
              }

              if (i == 1 && slideshow.classList.contains('change-header--true')) {
                let color_text = getComputedStyle(this.selectedElement).getPropertyValue('--color-text');

                header.style.setProperty('--color-header-transparent-text', color_text);
              }
            }
            // Animations.
            if (animations_enabled) {
              slideshow.animateSlides(0, animations);
            }

            // Fonts resize
            document.fonts.ready.then(() => flkty.resize());

            // Video Support.
            const video_container = flkty.cells[0].element.querySelector('.slideshow__slide-video-bg');
            if (video_container) {
              const iframe = video_container.querySelector('iframe');
              const video = video_container.querySelector('video');

              if (iframe) {
                iframe.onload = () => slideshow.videoPlay(video_container);
              } else if (video) {
                video.onloadstart = () => slideshow.videoPlay(video_container);
              }
            }

            // Custom Dots.
            if (cachedDots) {
              cachedDots.forEach((dot, i) => {
                dot.addEventListener('click', () => flkty.select(i));
              });

              cachedDots[this.selectedIndex].classList.add('is-selected');
            }
          },
          change: function (index) {
            let flkty = this,
              previousIndex = fizzyUIUtils.modulo(flkty.selectedIndex - 1, flkty.slides.length);

            // Animations — delay reverse so outgoing content waits for slide transition to finish
            if (animations_enabled) {
              gsap.delayedCall(0.7, () => slideshow.animateReverse(previousIndex, animations));
              slideshow.animateSlides(index, animations);
            }

            // Color changes — single getComputedStyle call avoids two forced reflows
            const styles = getComputedStyle(this.selectedElement),
              color_text = styles.getPropertyValue('--color-text'),
              color_text_rgb = styles.getPropertyValue('--color-text-rgb');

            if (animations_enabled) {
              slideshow.style.setProperty('--color-text', color_text);
              slideshow.style.setProperty('--color-text-rgb', color_text_rgb);
            }
            // Transparent Header padding.
            if (header?.classList.contains('transparent--true')) {
              let i = dataset.sectionIndex;
              if (Shopify.designMode) {
                let children = [...shopifySection.parentNode.children];
                i = children.indexOf(shopifySection) + 1;
              }
              if (i == 1 && slideshow.classList.contains('change-header--true')) {
                header.style.setProperty('--color-header-transparent-text', color_text);
              }
            }

            // AutoPlay Progress
            if (autoplay) {
              if (flkty.player.state !== 'paused') {
                flkty.stopPlayer();
                flkty.playPlayer();
              }
            }

            // Video Support.
            // previous slide
            const video_container_prev = flkty.cells[previousIndex].element.querySelector('.slideshow__slide-video-bg');
            if (video_container_prev) {
              slideshow.videoPause(video_container_prev);
            }
            // current slide
            const video_container = flkty.cells[index].element.querySelector('.slideshow__slide-video-bg');
            if (video_container) {
              const iframe = video_container.querySelector('iframe');
              if (iframe) {
                if (iframe.classList.contains('lazyload')) {
                  iframe.addEventListener('lazybeforeunveil', () => slideshow.videoPlay(video_container));
                  lazySizes.loader.checkElems();
                } else {
                  slideshow.videoPlay(video_container);
                }
              } else if (video_container.querySelector('video')) {
                slideshow.videoPlay(video_container);
              }
            }

            // Custom Dots.
            if (cachedDots) {
              slideshow.updateDots(cachedDots, this.selectedIndex);
            }

          }
        };
        if (slideshow.classList.contains('desktop-height-image') || slideshow.classList.contains('mobile-height-image')) {
          args.adaptiveHeight = true;
        }
      }

      // Testimonials
      if (isTestimonials) {
        args.on = {
          ready: function () {
            let flkty = this;

            // Custom Dots.
            if (cachedDots) {
              cachedDots.forEach((dot, i) => {
                dot.addEventListener('click', () => flkty.select(i));
              });

              cachedDots[this.selectedIndex].classList.add('is-selected');
            }
            // AutoPlay Progress
            if (autoplay && autoplay_progress) {
              slideshow.setupAutoplayProgress(slideshow, autoplay_progress);
            }
          },
          change: function (index) {
            let flkty = this;

            // Custom Dots.
            if (cachedDots) {
              slideshow.updateDots(cachedDots, this.selectedIndex);
            }

            if (autoplay && autoplay_progress) {
              slideshow.autoPlayProgressTL.progress(0);

              if (flkty.player.state !== 'paused') {
                slideshow.autoPlayProgressTL.play();
              }
            }

          }
        };
      }
      // Product Carousels
      if (isProducts) {
        args.wrapAround = false;
        args.on.ready = function () {
          let flickity = this;
          if (next_buttons.length) {
            let resizeTimer;
            window.addEventListener('resize', function () {
              clearTimeout(resizeTimer);
              resizeTimer = setTimeout(() => {
                slideshow.centerArrows(flickity, slideshow, prev_buttons[0], next_buttons[0]);
              }, 100);
            });
          }
          slideshow.centerArrows(flickity, slideshow, prev_buttons[0], next_buttons[0]);
        };
      }
      // Paged carousels — group cells into full-row "pages" so arrows step a
      // whole row at a time and selectedIndex/slides map directly to page
      // number (used by the "1 / 2" pager in product-recommendations.js).
      if (isPaged) {
        args.groupCells = true;
        args.wrapAround = false;
      }
      if (progress_bar) {
        args.wrapAround = false;
        args.on.scroll = function (progress) {
          progress = Math.max(0, Math.min(1, progress));
          progress_bar.style.width = progress * 100 + '%';
        };
      }

      // Initiate
      const flkty = new Flickity(slideshow, args);

      dataset.initiated = true;

      // Arrows
      if (prev_buttons) {
        prev_buttons.forEach(function (prev_button) {
          prev_button.addEventListener('click', () => {
            rightToLeft ? flkty.next() : flkty.previous();
          });
          prev_button.addEventListener('keyup', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            rightToLeft ? flkty.next() : flkty.previous();
          });
        });
        next_buttons.forEach(function (next_button) {
          next_button.addEventListener('click', () => {
            rightToLeft ? flkty.previous() : flkty.next();
          });
          next_button.addEventListener('keyup', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            rightToLeft ? flkty.previous() : flkty.next();
          });
        });
      }
      // Theme editor
      if (Shopify.designMode) {
        slideshow.addEventListener('shopify:block:select', (event) => {
          const index = slideshow_slides.indexOf(event.target);
          flkty.select(index);
        });
      }

      this.addEventListener('change', this.reInit.bind(this));
    }
    reInit() {
      this.reloadCells();
    }

    updateDots(dots, selectedIndex) {
      dots.forEach(dot => dot.classList.remove('is-selected'));
      dots[selectedIndex].classList.add('is-selected');
    }

    setupAutoplayProgress(slideshow, autoplay_progress) {

      slideshow.autoPlayProgressTL = gsap.timeline({
        inherit: false
      });
      slideshow.autoPlayProgressTL
        .fromTo(autoplay_progress, {
          scaleX: 0
        }, {
          duration: parseInt(slideshow.dataset.autoplay, 10) / 1000,
          scaleX: 1,
          ease: 'linear'
        });
      slideshow.addEventListener('mouseenter', function () {
        slideshow.autoPlayProgressTL.pause().progress(0);
      });
      slideshow.addEventListener('mouseleave', function () {
        slideshow.autoPlayProgressTL.play();
      });
    }

    videoPause(video_container) {
      setTimeout(() => {
        if (video_container.dataset.provider === 'hosted') {
          video_container.querySelector('video').pause();
        } else {
          const iframe = video_container.querySelector('iframe');
          const message = iframe.dataset.provider === 'youtube' ?
            { event: 'command', func: 'pauseVideo', args: '' } :
            { method: 'pause' };
          iframe.contentWindow.postMessage(JSON.stringify(message), '*');
        }
      }, 10);
    }
    videoPlay(video_container) {
      setTimeout(() => {
        if (video_container.dataset.provider === 'hosted') {
          video_container.querySelector('video').play();
        } else {
          const iframe = video_container.querySelector('iframe');
          const message = iframe.dataset.provider === 'youtube'
            ? { event: 'command', func: 'playVideo', args: '' }
            : { method: 'play' };
          iframe.contentWindow.postMessage(JSON.stringify(message), '*');
        }
      }, 10);
    }
    prepareAnimations(slideshow, animations) {
      if (!slideshow.dataset.animationsReady) {
        // Cache NodeList — reused for both SplitText passes, avoids double querySelector
        const split_text_els = slideshow.querySelectorAll('.slideshow__slide-heading, p:not(.subheading)');
        new SplitText(split_text_els, { type: 'lines', linesClass: 'line-child' });
        new SplitText(split_text_els, { type: 'lines', linesClass: 'line-parent' });

        slideshow.querySelectorAll('.slideshow__slide').forEach((item, i) => {
          // Cache per-slide element refs — avoids repeated querySelector in timeline definitions
          const subheading = item.querySelector('.subheading');
          const headingEl = item.querySelector('.slideshow__slide-heading');
          const headingLines = item.querySelectorAll('.slideshow__slide-heading .line-child');
          const splitTextEl = item.querySelector('p.split-text');
          const bodyLines = item.querySelectorAll('p:not(.subheading) .line-child');
          const buttons = item.querySelectorAll('.button, .text-button');

          const tl = gsap.timeline({ paused: true });
          let button_offset = 0;

          animations[i] = tl;

          if (slideshow.dataset.transition == 'swipe') {
            tl.to(item, {
              duration: 0.7,
              clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }, 'start');
          }

          if (slideshow.dataset.transition == 'zoom') {
            tl.to(item.querySelectorAll('.slideshow__slide-bg, .slideshow__slide-video-bg'), {
              duration: 1.5,
              scale: 1
            }, 'start');
          }

          if (subheading) {
            tl.fromTo(subheading, { opacity: 0 }, { duration: 0.5, opacity: 1 }, 0);
            button_offset += 0.5;
          }
          if (headingEl) {
            const h1_duration = 1 + ((headingLines.length - 1) * 0.1);
            tl
              .set(headingEl, { opacity: 1 }, 0)
              .from(headingLines, { duration: h1_duration, yPercent: 120, stagger: 0.1 }, 0);
            button_offset += h1_duration;
          }
          if (splitTextEl) {
            const p_duration = 1 + ((item.querySelectorAll('p.split-text .line-child').length - 1) * 0.05);
            tl
              .set(splitTextEl, { opacity: 1 }, 0)
              .from(bodyLines, { duration: p_duration, yPercent: '120', stagger: 0.1 }, 0);
            button_offset += p_duration;
          }
          if (buttons.length) {
            tl.fromTo(buttons, { autoAlpha: 0 }, { duration: 0.5, stagger: 0.1, autoAlpha: 1 }, button_offset * 0.2);
          }
        });

        slideshow.dataset.animationsReady = true;
      }
    }
    animateSlides(i, animations) {
      // timeScale(1) resets speed in case a previous reverse ran at timeScale(4)
      if (document.fonts.status === 'loaded') {
        animations[i].timeScale(1).restart();
      } else {
        document.fonts.ready.then(() => animations[i].timeScale(1).restart());
      }
    }
    animateReverse(i, animations) {
      // timeScale(4) speeds up exit animation for a snappier feel
      animations[i].timeScale(4).reverse();
    }
    centerArrows(flickity, slideshow, prev_button, next_button) {
      let first_cell = flickity.cells[0],
        max_height = 0,
        image_height = 0;
      if (first_cell.element.querySelector('.product-featured-image')) {
        image_height = first_cell.element.querySelector('.product-featured-image').clientHeight;
      } else if (first_cell.element.querySelector('.gallery--item')) {
        image_height = flickity.cells[1].element.querySelector('.product-featured-image').clientHeight;
      }
      if (image_height > 0) {
        flickity.cells.forEach((item) => {
          if (item.size.height > max_height) {
            max_height = item.size.height;
          }
        });

        if (max_height > image_height) {
          const difference = (max_height - image_height) / -2;

          prev_button.style.transform = 'translateY(' + difference + 'px)';
          next_button.style.transform = 'translateY(' + difference + 'px)';
        }
      }

    }

  }
  customElements.define('slide-show', SlideShow);
}
