if (typeof debounce === 'undefined') {
  // Fix: use regular function (not arrow) to preserve call-site `this`
  var debounce = function(fn, wait) {
    let t;
    return function(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  };
}
/**
 *  @class
 *  @function ThemeHeader
 */

if (!customElements.get('theme-header')) {
  class ThemeHeader extends HTMLElement {
    constructor() {
      super();

    }
    connectedCallback() {
      this.header_section = document.querySelector('.header-section');
      this.menu = this.querySelector('#mobile-menu');
      this.toggle = this.querySelector('.mobile-toggle-wrapper');

      // Cache DOM queries that were previously looked up on every scroll
      this.productInformation = document.querySelector('.product-information');
      this.announcementBar = document.querySelector('.announcement-bar-section');

      // Escape key — close mobile menu
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape' && this.toggle) {
          this.toggle.removeAttribute('open');
          this.toggle.classList.remove('active');
        }
      });

      if (this.classList.contains('header-sticky--active')) {
        document.body.classList.add('header-sticky--active');
        // Cache the header's document-position offset once — it doesn't change
        this.stickyOffset = this.getBoundingClientRect().top + document.documentElement.scrollTop;
      }

      // Fix: DOMContentLoaded may have already fired by the time connectedCallback runs
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', this.setTransparentClass.bind(this));
      } else {
        this.setTransparentClass();
      }

      if (this.toggle) {
        this.toggle.querySelector('.mobile-toggle').addEventListener('click', (e) => {
          if (this.toggle.classList.contains('active')) {
            e.preventDefault();
            document.body.classList.remove('overflow-hidden');
            this.toggle.classList.remove('active');
            this.closeAnimation(this.toggle);
            window.dispatchEvent(new Event('scroll'));
          } else {
            this.classList.add('is-sticky');
            document.body.classList.add('overflow-hidden');
            requestAnimationFrame(() => {
              this.toggle.classList.add('active');
            });
          }
        });
      }

      // Consolidated scroll handler — single listener instead of three
      window.addEventListener('scroll', this.onScroll.bind(this), {
        passive: true
      });

      // Announcement bar height — listen on resize (not scroll), since height changes with viewport
      if (this.announcementBar) {
        this.setAnnouncementHeight();
        window.addEventListener('resize', debounce(this.setAnnouncementHeight.bind(this), 100), {
          passive: true
        });
      }

      window.dispatchEvent(new Event('scroll'));

      // Mobile Navigation transparent header support.
      this.mobile_nav = document.querySelector('.header-mobile-navigation');
      if (this.mobile_nav && this.classList.contains('transparent--true')) {
        this.mobile_nav.classList.add('is-fixed');
      }

      // Buttons.
      if (this.menu) {
        this.menu.querySelectorAll('summary').forEach(summary => summary.addEventListener('click', this.onSummaryClick.bind(this)));
        this.menu.querySelectorAll('.parent-link-back--button').forEach(button => button.addEventListener('click', this.onCloseButtonClick.bind(this)));
      }
    }
    onScroll() {
      this.setStickyClass();
      this.setHeaderOffset();
      this.setHeaderHeight();
    }
    setStickyClass() {
      if (this.classList.contains('header-sticky--active')) {
        const isSticky = window.scrollY >= this.stickyOffset && window.scrollY > 0;
        this.classList.toggle('is-sticky', isSticky);
        this.productInformation?.classList.toggle('is-sticky', isSticky);
      }
    }
    setAnnouncementHeight() {
      if (this.announcementBar) {
        document.documentElement.style.setProperty('--announcement-height', this.announcementBar.clientHeight + 'px');
      }
    }
    setHeaderOffset() {
      let h = this.header_section.getBoundingClientRect().top;
      document.documentElement.style.setProperty('--header-offset', h + 'px');
    }
    setHeaderHeight() {
      document.documentElement.style.setProperty('--header-height', this.clientHeight + 'px');
    }
    onSummaryClick(event) {
      const summaryElement = event.currentTarget;
      const detailsElement = summaryElement.parentNode;
      const parentMenuElement = detailsElement.closest('.link-container');
      if (this.querySelector('.parent-link-back--button')) {
        this.menu.scrollTop = 0;
      }
      setTimeout(() => {
        detailsElement.classList.add('menu-opening');
        parentMenuElement && parentMenuElement.classList.add('submenu-open');
      }, 100);
    }
    onCloseButtonClick(event) {
      event.preventDefault();
      const detailsElement = event.currentTarget.closest('details');
      this.closeSubmenu(detailsElement);
    }
    closeSubmenu(detailsElement) {
      detailsElement.classList.remove('menu-opening');
      this.closeAnimation(detailsElement);
    }
    closeAnimation(detailsElement) {
      // Waits for CSS transition (400ms) before removing the open attribute
      setTimeout(() => {
        detailsElement.removeAttribute('open');
      }, 400);
    }
    setTransparentClass() {
      this.template_header = document.querySelector('.template-header');

      if (this.template_header && this.template_header.classList.contains('template-header--has-image-true') && this.template_header.dataset.sectionIndex == 1) {
        this.classList.remove('transparent--false');
        this.classList.add('transparent--true');
      }
    }
  }
  customElements.define('theme-header', ThemeHeader);
}
