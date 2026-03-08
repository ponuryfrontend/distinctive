if (!customElements.get('variant-selects')) {

  /**
   *  @class
   *  @function VariantSelects
   */
  class VariantSelects extends HTMLElement {
    constructor() {
      super();
      this.sticky = this.dataset.sticky;
      this.updateUrl = this.dataset.updateUrl === 'true';
      this.isDisabledFeature = this.dataset.isDisabled;
      this.addEventListener('change', this.onVariantChange);
      this.other = Array.from(document.querySelectorAll('variant-selects')).filter((selector) => {
        return selector != this;
      });

      this.productWrapper = this.closest('.thb-product-detail');
      this.productSlider = this.productWrapper?.querySelector('.product-images');
      this.hideVariants = this.dataset.hideVariants === 'true';

      this.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'LABEL') {
          const scrollY = window.scrollY;
          requestAnimationFrame(() => window.scrollTo({ top: scrollY, behavior: 'instant' }));
        }
      });
    }

    connectedCallback() {
      this.updateOptions();
      this.updateMasterId();
      this.setDisabled();
      this.setImageSet();
    }

    onVariantChange() {
      this.updateOptions();
      this.toggleAddButton(true, '', false);
      this.updatePickupAvailability();
      this.removeErrorMessage();
      this.updateVariantText();
      this.setDisabled();

      this.renderVariantInfo();

      this.updateOther();
      dispatchCustomEvent('product:variant-change', {
        variant: this.currentVariant,
        sectionId: this.dataset.section
      });
    }

    updateOptions() {
      this.fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = [];
      this.fieldsets.forEach((fieldset, i) => {
        if (fieldset.querySelector('select')) {
          this.options.push(fieldset.querySelector('select').value);
        } else if (fieldset.querySelectorAll('input').length) {
          this.options.push(fieldset.querySelector('input:checked').value);
        }
      });
    }
    updateVariantText() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      fieldsets.forEach((item, i) => {
        let label = item.querySelector('.form__label__value');
        if (label) {
          label.innerHTML = this.options[i];
        }
      });
    }
    updateMasterId() {
      const span = this.querySelector(`#SelectedVariant-${this.dataset.section}`);
      if (!span) return;
      this.currentVariant = {
        id: parseInt(span.dataset.variantId, 10) || null,
        available: span.dataset.available === 'true',
        featured_media: span.dataset.featuredMediaId ? { id: parseInt(span.dataset.featuredMediaId, 10) } : null
      };
    }

    updateOther() {
      if (this.dataset.updateUrl === 'false') {
        return;
      }
      if (this.other.length) {
        let fieldsets = this.other[0].querySelectorAll('fieldset'),
          fieldsets_array = Array.from(fieldsets);
        this.options.forEach((option, i) => {
          if (fieldsets_array[i].querySelector('select')) {
            fieldsets_array[i].querySelector(`select`).value = option;
          } else if (fieldsets_array[i].querySelectorAll('input').length) {
            fieldsets_array[i].querySelector(`input[value='${option}']`).checked = true;
          }
        });
        this.other[0].updateOptions();
        this.other[0].updateMasterId();
        this.other[0].updateVariantText();
        this.other[0].setDisabled();
      }
    }
    updateMedia() {
      if (!this.currentVariant) return;
      if (!this.currentVariant.featured_media) return;

      let thumbnails = this.productWrapper.querySelector('.product-thumbnail-container');

      this.setActiveMedia(`#Slide-${this.dataset.section}-${this.currentVariant.featured_media.id}`, `#Thumb-${this.dataset.section}-${this.currentVariant.featured_media.id}`, this.productSlider, thumbnails);
    }
    setActiveMedia(mediaId, thumbId, productSlider, thumbnails) {
      let flkty = Flickity.data(productSlider),
        activeMedia = productSlider.querySelector(mediaId);
      if (flkty && this.hideVariants) {
        if (productSlider.querySelector('.product-images__slide.is-initial-selected')) {
          productSlider.querySelector('.product-images__slide.is-initial-selected').classList.remove('is-initial-selected');
        }
        [].forEach.call(productSlider.querySelectorAll('.product-images__slide-item--variant'), function (el) {
          el.classList.remove('is-active');
        });
        if (this.thumbnails) {
          if (this.thumbnails.querySelector('.product-thumbnail.is-initial-selected')) {
            this.thumbnails.querySelector('.product-thumbnail.is-initial-selected').classList.remove('is-initial-selected');
          }
          [].forEach.call(this.thumbnails.querySelectorAll('.product-images__slide-item--variant'), function (el) {
            el.classList.remove('is-active');
          });
        }

        activeMedia.classList.add('is-active');
        activeMedia.classList.add('is-initial-selected');

        this.setImageSetMedia();

        if (thumbnails) {
          let activeThumb = thumbnails.querySelector(thumbId);

          activeThumb.classList.add('is-active');
          activeThumb.classList.add('is-initial-selected');
        }

        productSlider.reInit(this.imageSetIndex);
        productSlider.selectCell(mediaId);

      } else if (flkty) {
        productSlider.selectCell(mediaId);
      }

    }

    updateURL() {
      if (!this.currentVariant || this.dataset.updateUrl === 'false') return;
      window.history.replaceState({}, '', `${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateShareUrl() {
      const shareButton = document.getElementById(`Share-${this.dataset.section}`);
      if (!shareButton) return;
      shareButton.updateUrl(`${window.shopUrl}${this.dataset.url}?variant=${this.currentVariant.id}`);
    }

    updateVariantInput() {
      const productForms = document.querySelectorAll(`#product-form-${this.dataset.section}, #product-form-installment`);
      productForms.forEach((productForm) => {
        const input = productForm.querySelector('input[name="id"]');
        input.value = this.currentVariant.id;
        input.dispatchEvent(new Event('change', {
          bubbles: true
        }));
      });
    }

    updatePickupAvailability() {
      const pickUpAvailability = document.querySelector('.pickup-availability-wrapper');

      if (!pickUpAvailability) return;

      if (this.currentVariant && this.currentVariant.available && pickUpAvailability.fetchAvailability) {
        pickUpAvailability.fetchAvailability(this.currentVariant.id);
      } else {
        pickUpAvailability.removeAttribute('available');
        pickUpAvailability.innerHTML = '';
      }
    }

    removeErrorMessage() {
      const section = this.closest('section');
      if (!section) return;

      const productForm = section.querySelector('product-form');
      if (productForm) productForm.handleErrorMessage();
    }

    getSectionsToRender() {
      return [`price-${this.dataset.section}`, `price-${this.dataset.section}--sticky`, `product-image-${this.dataset.section}--sticky`, `inventory-${this.dataset.section}`, `sku-${this.dataset.section}`, `quantity-${this.dataset.section}`];
    }

    getSelectedValueIds() {
      return this.fieldsets.map((fieldset) => {
        if (fieldset.querySelector('select')) {
          return fieldset.querySelector('select').selectedOptions[0]?.dataset.valueId;
        }
        return fieldset.querySelector('input:checked')?.dataset.valueId;
      }).filter(Boolean);
    }

    renderVariantInfo() {
      const ids = this.getSelectedValueIds();
      if (!ids.length) return;

      const scrollY = window.scrollY;

      fetch(`${this.dataset.url}?option_values=${ids.join(',')}&section_id=${this.dataset.section}`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');

          // 1. Resolve variant from hidden span
          const span = html.getElementById(`SelectedVariant-${this.dataset.section}`);
          if (span && parseInt(span.dataset.variantId, 10)) {
            this.currentVariant = {
              id: parseInt(span.dataset.variantId, 10),
              available: span.dataset.available === 'true',
              featured_media: span.dataset.featuredMediaId ? { id: parseInt(span.dataset.featuredMediaId, 10) } : null
            };
          } else {
            this.currentVariant = null;
          }

          // 2. Sync data-available onto current DOM inputs (drives setDisabled)
          const sourceSelects = html.getElementById(`variant-selects-${this.dataset.section}`);
          if (sourceSelects) {
            sourceSelects.querySelectorAll('[data-value-id]').forEach((sourceEl) => {
              const vid = sourceEl.dataset.valueId;
              const avail = sourceEl.dataset.available;
              [this, ...this.other].forEach((el) => {
                const localEl = el.querySelector(`[data-value-id="${vid}"]`);
                if (localEl) localEl.dataset.available = avail;
              });
            });
          }

          // 3. Update price, inventory, sku sections
          this.getSectionsToRender().forEach((id) => {
            const destination = document.getElementById(id);
            const source = html.getElementById(id);
            if (source && destination) destination.innerHTML = source.innerHTML;
            if (id.includes('price') && destination) destination.classList.remove('visibility-hidden');
          });

          // 4. Apply updated state
          if (!this.currentVariant) {
            this.toggleAddButton(true, '', true);
            this.setUnavailable();
            window.scrollTo({ top: scrollY, behavior: 'instant' });
            return;
          }
          this.setDisabled();
          this.updateVariantInput();
          if (this.updateUrl) this.updateURL();
          this.toggleAddButton(!this.currentVariant.available, window.theme.variantStrings.soldOut);
          this.updateMedia();
          window.scrollTo({ top: scrollY, behavior: 'instant' });
        });
    }

    toggleAddButton(disable = true, text = false, modifyClass = true) {
      const productForm = document.getElementById(`product-form-${this.dataset.section}`);
      if (!productForm) return;

      const productTemplate = productForm.closest('.product-form').getAttribute('template');
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      if (!submitButtons) return;

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');

        if (!submitButtonText) return;

        if (disable) {
          submitButton.setAttribute('disabled', 'disabled');
          if (text) submitButtonText.dataset.content = text;
        } else {
          submitButton.removeAttribute('disabled');
          submitButton.classList.remove('loading');

          if (productTemplate?.includes('pre-order')) {
            submitButtonText.dataset.content = window.theme.variantStrings.preOrder;
          } else {
            submitButtonText.dataset.content = window.theme.variantStrings.addToCart;
          }
        }
      });

      if (!modifyClass) return;
    }

    setUnavailable() {
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');
      const price = document.getElementById(`price-${this.dataset.section}`);
      const price_fixed = document.getElementById(`price-${this.dataset.section}--sticky`);

      submitButtons.forEach((submitButton) => {
        const submitButtonText = submitButton.querySelector('.single-add-to-cart-button--text');
        if (!submitButton) return;
        submitButtonText.dataset.content = window.theme.variantStrings.unavailable;
        submitButton.classList.add('sold-out');
      });
      if (price) price.classList.add('visibility-hidden');
      if (price_fixed) price_fixed.classList.add('visibility-hidden');
    }

    setDisabled() {
      if (this.isDisabledFeature != 'true') return;

      this.fieldsets.forEach((fieldset) => {
        if (fieldset.querySelector('select')) {
          fieldset.querySelectorAll('option').forEach((opt) => {
            opt.disabled = opt.dataset.available === 'false';
          });
        } else {
          fieldset.querySelectorAll('input').forEach((input) => {
            input.classList.toggle('is-disabled', input.dataset.available === 'false');
          });
        }
      });
      return true;
    }

    getImageSetName(variant_name) {
      return variant_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '').replace(/^-/, '');
    }

    setImageSet() {
      if (!this.productSlider) return;

      let dataSetEl = this.productSlider.querySelector('[data-set-name]');
      if (dataSetEl) {
        this.imageSetName = dataSetEl.dataset.setName;
        this.imageSetIndex = this.querySelector('.product-form__input[data-handle="' + this.imageSetName + '"]').dataset.index;
        this.dataset.imageSetIndex = this.imageSetIndex;

        this.setImageSetMedia();
      }
    }
    setImageSetMedia() {
      if (!this.imageSetIndex) {
        return;
      }

      const optionPosition = parseInt(this.imageSetIndex.replace('option', ''), 10) - 1;
      let setValue = this.getImageSetName(this.options[optionPosition]);
      let group = this.imageSetName + '_' + setValue;
      let selected_set_images = this.productWrapper.querySelectorAll(`.product-images__slide[data-set-name="${this.imageSetName}"]`),
        selected_set_thumbs = this.productWrapper.querySelectorAll(`.product-thumbnail[data-set-name="${this.imageSetName}"]`);
      if (this.hideVariants) {
        // Product images
        this.productWrapper.querySelectorAll('.product-images__slide').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_images.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });

        // Product thumbnails
        this.productWrapper.querySelectorAll('.product-thumbnail').forEach(thumb => {
          if (thumb.dataset.group && thumb.dataset.group !== group) {
            thumb.classList.remove('is-active');
          }
        });
        selected_set_thumbs.forEach(thumb => {
          thumb.classList.toggle('is-active', thumb.dataset.group === group);
        });
      }

    }

    createAvailableOptionsTree(variant_data, selected_options) {
      // Reduce variant array into option availability tree
      return variant_data.reduce((options, variant) => {

        // Check each option group (e.g. option1, option2, option3) of the variant
        Object.keys(options).forEach(index => {

          if (variant[index] === null) return;

          let entry = options[index].find(option => option.value === variant[index]);

          if (typeof entry === 'undefined') {
            // If option has yet to be added to the options tree, add it
            entry = {
              value: variant[index],
              isUnavailable: true
            };
            options[index].push(entry);
          }

          // Check how many selected option values match a variant
          const countVariantOptionsThatMatchCurrent = selected_options.reduce((count, {
            value,
            index
          }) => {
            return variant[index] === value ? count + 1 : count;
          }, 0);

          // Only enable an option if an available variant matches all but one current selected value
          if (countVariantOptionsThatMatchCurrent >= selected_options.length - 1) {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }

          // Make sure if a variant is unavailable, disable currently selected option
          if ((!this.currentVariant || !this.currentVariant.available) && selected_options.find((option) => option.value === entry.value && index === option.index)) {
            entry.isUnavailable = true;
          }

          // First option is always enabled
          if (index === 'option1') {
            entry.isUnavailable = entry.isUnavailable && variant.available ? false : entry.isUnavailable;
          }
        });

        return options;
      }, {
        option1: [],
        option2: [],
        option3: []
      });
    }
  }
  customElements.define('variant-selects', VariantSelects);

  /**
   *  @class
   *  @function VariantRadios
   */
  class VariantRadios extends VariantSelects {
    constructor() {
      super();
    }

    updateOptions() {
      const fieldsets = Array.from(this.querySelectorAll('fieldset'));
      this.options = fieldsets.map((fieldset) => {
        return Array.from(fieldset.querySelectorAll('input')).find((radio) => radio.checked).value;
      });
    }
  }

  customElements.define('variant-radios', VariantRadios);
}

if (!customElements.get('product-slider')) {
  /**
   *  @class
   *  @function ProductSlider
   */
  class ProductSlider extends HTMLElement {
    constructor() {
      super();

      this.addEventListener('change', this.setupProductGallery);
    }
    connectedCallback() {
      this.product_container = this.closest('.thb-product-detail');
      this.quickView = this.closest('#Product-Drawer-Content');
      this.thumbnail_container = this.product_container.querySelector('.product-thumbnail-container');
      this.video_containers = this.querySelectorAll('.product-single__media-external-video--play');
      this.progress_bar = this.product_container.querySelector('.flickity-progress--bar'),

        this.setOptions();
      // Defer Flickity init to next frame — avoids forced reflow during DOM parsing
      requestAnimationFrame(() => this.init());
    }
    setOptions() {
      this.hide_variants = this.dataset.hideVariants == 'true';
      this.thumbnails = this.thumbnail_container?.querySelectorAll('.product-thumbnail');
      this.prev_button = this.querySelector('.flickity-prev');
      this.next_button = this.querySelector('.flickity-next');
      this.images = this.querySelectorAll('img');
      this.options = {
        wrapAround: true,
        pageDots: true,
        contain: true,
        cellAlign: this.quickView ? 'left' : 'right',
        adaptiveHeight: !this.quickView,
        initialIndex: '.is-initial-selected',
        prevNextButtons: false,
        rightToLeft: document.dir === 'rtl',
        fade: false,
        cellSelector: '.product-images__slide.is-active',
        on: {
          ready: () => {
            this.images.forEach((img) => {
              img.addEventListener('lazyloaded', () => {
                this.flkty.resize();
              });
            });
          },
          dragStart: () => {
            this.flkty.slider.childNodes.forEach(slide => slide.style.pointerEvents = "none");
          },
          dragEnd: () => {
            this.flkty.slider.childNodes.forEach(slide => slide.style.pointerEvents = "all");
          }
        }
      };
      if (this.quickView) {
        this.options.wrapAround = false;
      }
      if (this.progress_bar) {
        this.options.on.scroll = (progress) => {
          progress = Math.max(0, Math.min(1, progress));
          this.progress_bar.style.width = progress * 100 + '%';
        };
      }
    }
    init() {
      this.flkty = new Flickity(this, this.options);

      this.selectedIndex = this.flkty.selectedIndex;

      // Setup Events
      this.setupEvents();

      // Start Gallery
      this.setupProductGallery();
    }
    reInit(imageSetIndex) {
      this.flkty.destroy();

      this.setOptions();

      this.flkty = new Flickity(this, this.options);

      // Setup Events
      this.setupEvents();

      this.selectedIndex = this.flkty.selectedIndex;
    }
    setupEvents() {
      const _this = this;
      if (this.prev_button) {
        let prev = this.prev_button.cloneNode(true);
        this.prev_button.parentNode.append(prev);
        this.prev_button.remove();
        prev.addEventListener('click', (event) => {
          document.dir === 'rtl' ? this.flkty.next() : this.flkty.previous();
        });
        prev.addEventListener('keyup', (event) => {
          document.dir === 'rtl' ? this.flkty.next() : this.flkty.previous();
          event.preventDefault();
        });
      }
      if (this.next_button) {
        let next = this.next_button.cloneNode(true);
        this.next_button.parentNode.append(next);
        this.next_button.remove();
        next.addEventListener('click', (event) => {
          document.dir === 'rtl' ? this.flkty.previous() : this.flkty.next();
        });
        next.addEventListener('keyup', (event) => {
          document.dir === 'rtl' ? this.flkty.previous() : this.flkty.next();
          event.preventDefault();
        });
      }
      this.video_containers.forEach((container) => {
        container.querySelector('button').addEventListener('click', function () {
          container.setAttribute('hidden', '');
        });
      });
      this.flkty.on('settle', function (index) {
        _this.selectedIndex = index;
      });
      this.flkty.on('change', (index) => {

        let previous_slide = this.flkty.cells[_this.selectedIndex].element,
          previous_media = previous_slide.querySelector('.product-single__media');

        if (this.thumbnails) {
          let active_thumbs = Array.from(this.thumbnails).filter(element => element.classList.contains('is-active')),
            active_thumb = active_thumbs[index] ? active_thumbs[index] : active_thumbs[0];

          this.thumbnails.forEach((item, i) => {
            item.classList.remove('is-initial-selected');
          });
          active_thumb.classList.add('is-initial-selected');

          requestAnimationFrame(() => {
            if (active_thumb.offsetParent === null) {
              return;
            }
            const windowHalfHeight = active_thumb.offsetParent.clientHeight / 2,
              windowHalfWidth = active_thumb.offsetParent.clientWidth / 2;
            active_thumb.parentElement.scrollTo({
              left: active_thumb.offsetLeft - windowHalfWidth + active_thumb.clientWidth / 2,
              top: active_thumb.offsetTop - windowHalfHeight + active_thumb.clientHeight / 2,
              behavior: 'smooth'
            });
          });
        }


        // Stop previous video
        if (previous_media.classList.contains('product-single__media-external-video')) {
          if (previous_media.dataset.provider === 'youtube') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              event: "command",
              func: "pauseVideo",
              args: ""
            }), "*");
          } else if (previous_media.dataset.provider === 'vimeo') {
            previous_media.querySelector('iframe').contentWindow.postMessage(JSON.stringify({
              method: "pause"
            }), "*");
          }
          previous_media.querySelector('.product-single__media-external-video--play').removeAttribute('hidden');
        } else if (previous_media.classList.contains('product-single__media-native-video')) {
          previous_media.querySelector('video').pause();
        }

      });

      if (this.thumbnails && !this.thumbnail_container.dataset.init) {
        setTimeout(() => {
          let active_thumbs = this.hide_variants ?
            Array.from(this.thumbnails).filter(element => element.classList.contains('is-active')) :
            Array.from(this.thumbnails);
          active_thumbs.forEach((thumbnail, index) => {
            thumbnail.addEventListener('click', () => {
              this.thumbnailClick(thumbnail, index);
            });
          });
          this.thumbnail_container.addEventListener('click', (e) => {
            let count = Math.min(Math.max(this.thumbnail_container.querySelectorAll('.is-active').length, 1), 4);
            this.thumbnail_container.style.setProperty('--thumbnail-width', (count * 63) + 19 + 'px');
            if (!this.thumbnail_container.classList.contains('extended')) {
              this.thumbnail_container.classList.add('extended');
            } else {
              if (e.target.nodeName == 'BUTTON') {
                this.thumbnail_container.classList.remove('extended');
              }
              e.preventDefault();
            }
            if (!this.thumbnail_container.classList.contains('extended')) {
              let active_thumb = this.thumbnail_container.querySelector('.is-initial-selected');
              setTimeout(() => {
                active_thumb.parentElement.scrollTo({
                  left: Math.max(active_thumb.offsetLeft, 0),
                  top: 0,
                  behavior: 'smooth'
                });
              }, 300);
            }
          });
          this.thumbnail_container.dataset.init = true;
        });
      }
    }
    thumbnailClick(thumbnail, index) {
      [].forEach.call(this.thumbnails, function (el) {
        el.classList.remove('is-initial-selected');
      });
      thumbnail.classList.add('is-initial-selected');
      this.flkty.select(index);
    }
    setDraggable(draggable) {
      this.flkty.options.draggable = draggable;
      this.flkty.updateDraggable();
    }
    selectCell(mediaId) {
      this.flkty.selectCell(mediaId);
    }
    setupProductGallery() {
      if (!this.querySelectorAll('.product-single__media-zoom').length) {
        return;
      }
      this.setEventListeners();
    }
    buildItems() {
      this.activeImages = Array.from(this.querySelectorAll('.product-images__slide.is-active .product-single__media-image'));

      return this.activeImages.map((item) => {
        let index = [].indexOf.call(item.parentNode.parentNode.children, item.parentNode);

        let activelink = item.querySelector('.product-single__media-zoom');

        activelink.dataset.index = index;
        return {
          src: activelink.getAttribute('href'),
          msrc: activelink.dataset.msrc,
          w: activelink.dataset.w,
          h: activelink.dataset.h
        };
      });
    }
    setEventListeners() {
      this.links = this.querySelectorAll('.product-single__media-zoom');
      this.pswpElement = document.querySelectorAll('.pswp')[0];
      this.pswpOptions = {
        maxSpreadZoom: 2,
        loop: false,
        allowPanToNext: false,
        closeOnScroll: false,
        showHideOpacity: false,
        arrowKeys: true,
        history: false,
        captionEl: false,
        fullscreenEl: false,
        zoomEl: false,
        shareEl: false,
        counterEl: true,
        arrowEl: true,
        preloaderEl: true,
        getThumbBoundsFn: () => {
          const thumbnail = this.querySelector('.product-images__slide.is-selected'),
            pageYScroll = window.pageYOffset || document.documentElement.scrollTop,
            rect = thumbnail.getBoundingClientRect();
          return {
            x: rect.left,
            y: rect.top + pageYScroll,
            w: rect.width
          };
        }
      };


      this.links.forEach((link => {
        link.addEventListener('click', (e) => this.zoomClick(e, link));
      }));
    }
    zoomClick(e, link) {
      this.items = this.buildItems();
      this.pswpOptions.index = parseInt(link.dataset.index, 10);
      if (typeof PhotoSwipe !== 'undefined') {
        let pswp = new PhotoSwipe(this.pswpElement, PhotoSwipeUI_Default, this.items, this.pswpOptions);
        pswp.listen('firstUpdate', function () {
          pswp.listen('parseVerticalMargin', function (item) {
            item.vGap = {
              top: 50,
              bottom: 50
            };
          });
        });
        pswp.init();
      }
      e.preventDefault();
    }
  }
  customElements.define('product-slider', ProductSlider);
}

/**
 *  @class
 *  @function ProductForm
 */
if (!customElements.get('product-form')) {
  customElements.define('product-form', class ProductForm extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.sticky = this.dataset.sticky;
      this.form = document.getElementById(`product-form-${this.dataset.section}`);
      this.form.querySelector('[name=id]').disabled = false;
      if (!this.sticky) {
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
      }
      this.cartNotification = document.querySelector('cart-notification');
      this.body = document.body;

      this.hideErrors = this.dataset.hideErrors === 'true';
    }
    onSubmitHandler(evt) {
      evt.preventDefault();

      if (!this.form.reportValidity()) {
        return;
      }
      const submitButtons = document.querySelectorAll('.single-add-to-cart-button');

      submitButtons.forEach((submitButton) => {
        if (submitButton.classList.contains('loading')) return;
        submitButton.setAttribute('aria-disabled', true);
        submitButton.classList.add('loading');
      });

      this.handleErrorMessage();


      const config = {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/javascript'
        }
      };


      let formData = new FormData(this.form);

      formData.append('sections', this.getSectionsToRender().map((section) => section.section));
      formData.append('sections_url', window.location.pathname);
      config.body = formData;

      fetch(`${theme.routes.cart_add_url}`, config)
        .then((response) => response.json())
        .then((response) => {
          if (response.status) {
            dispatchCustomEvent('product:variant-error', {
              source: 'product-form',
              productVariantId: formData.get('id'),
              errors: response.description,
              message: response.message
            });
            if (response.status === 422) {
              document.documentElement.dispatchEvent(new CustomEvent('cart:refresh', {
                bubbles: true
              }));
            }
            this.handleErrorMessage(response.description);
            return;
          }

          this.renderContents(response);

          dispatchCustomEvent('cart:item-added', {
            product: response.hasOwnProperty('items') ? response.items[0] : response
          });
        })
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          submitButtons.forEach((submitButton) => {
            submitButton.classList.remove('loading');
            submitButton.removeAttribute('aria-disabled');
          });
          if (document.querySelector('.product-add-to-cart-sticky-modal')) {
            document.querySelector('.product-add-to-cart-sticky-modal').removeAttribute('open');
          }
        });
    }

    getSectionsToRender() {
      return [{
        id: 'Cart',
        section: 'main-cart',
        selector: '.thb-cart-form'
      },
      {
        id: 'Cart-Drawer',
        section: 'cart-drawer',
        selector: '.cart-drawer'
      },
      {
        id: 'cart-drawer-toggle',
        section: 'cart-bubble',
        selector: '.thb-item-count'
      }];
    }
    renderContents(parsedState) {
      this.getSectionsToRender().forEach((section => {
        if (!document.getElementById(section.id)) {
          return;
        }
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);

        if (typeof Cart !== 'undefined') {
          new Cart().renderContents(parsedState);
        }
        if (section.id == 'Cart-Drawer') {
          elementToReplace.removeProductEvent();
          elementToReplace.notesToggle();
          elementToReplace.updateFreeShipping();
        }
      }));



      let product_drawer = document.getElementById('Product-Drawer'),
        search_drawer = document.getElementById('Search-Drawer');

      if (search_drawer.classList.contains('active')) {
        search_drawer.classList.remove('active');
      }
      if (product_drawer && product_drawer.contains(this)) {
        product_drawer.classList.remove('active');
        this.body.classList.remove('open-cc--product');
        if (document.getElementById('Cart-Drawer')) {
          this.body.classList.add('open-cc');
          document.getElementById('Cart-Drawer').classList.add('active');
        }
      } else if (document.getElementById('Cart-Drawer')) {
        this.body.classList.add('open-cc');
        document.getElementById('Cart-Drawer').classList.add('active');
        dispatchCustomEvent('cart-drawer:open');
      }
    }
    getSectionInnerHTML(html, selector = '.shopify-section') {
      return new DOMParser()
        .parseFromString(html, 'text/html')
        .querySelector(selector).innerHTML;
    }
    handleErrorMessage(errorMessage = false) {
      if (this.hideErrors) return;
      this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
      if (!this.errorMessageWrapper) return;
      this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

      this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

      if (errorMessage) {
        this.errorMessage.textContent = errorMessage;
      }
    }
  });
}

/**
 *  @class
 *  @function ProductAddToCartSticky
 */
if (!customElements.get('product-add-to-cart-sticky')) {
  class ProductAddToCartSticky extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      this.setupObservers();
      this.drawer = document.getElementById(this.dataset.target);
      this.addEventListener('click', this.onClick.bind(this));
    }
    onClick() {
      this.drawer.show();
    }
    setupObservers() {
      let _this = this,
        observer = new IntersectionObserver(function (entries) {
          entries.forEach((entry) => {
            if (entry.target === footer) {
              if (entry.intersectionRatio > 0) {
                _this.classList.remove('sticky--visible');
              } else if (entry.intersectionRatio == 0 && _this.formPassed) {
                _this.classList.add('sticky--visible');
              }
            }
            if (entry.target === form) {
              let boundingRect = form.getBoundingClientRect();

              if (entry.intersectionRatio === 0 && window.scrollY > (boundingRect.top + boundingRect.height)) {
                _this.formPassed = true;
                _this.classList.add('sticky--visible');
              } else if (entry.intersectionRatio === 1) {
                _this.formPassed = false;
                _this.classList.remove('sticky--visible');
              }
            }
          });
        }, {
          threshold: [0, 1]
        }),
        form = document.getElementById(`product-form-${this.dataset.section}`),
        footer = document.getElementById('footer');
      _this.formPassed = false;
      observer.observe(form);
    }
  }

  customElements.define('product-add-to-cart-sticky', ProductAddToCartSticky);
}

if (typeof addIdToRecentlyViewed !== "undefined") {
  addIdToRecentlyViewed();
}