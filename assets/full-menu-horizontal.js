/**
 *  @class
 *  @function FullMenuHorizontal
 */
if (!customElements.get('full-menu-horizontal')) {
  class FullMenuHorizontal extends HTMLElement {
    constructor() {
      super();
      this.cc = this.querySelector('.full-menu--cc');
      this.toggle = this.querySelector('.full-menu--toggle');
      this.submenus = this.querySelectorAll('.thb-full-menu > .menu-item-has-children:not(.menu-item-has-megamenu) > .sub-menu');
    }
    connectedCallback() {
      if (!this.submenus.length) {
        return;
      }
      const _this = this;

      // Resize on initial load
      document.fonts.ready.then(() => {
        window.addEventListener('resize', debounce(() => {
          _this.resizeSubMenus();
        }, 100));
      });
    }

    resizeSubMenus() {
      this.submenus.forEach((submenu) => {
        const subSubmenus = submenu.querySelectorAll(':scope > .menu-item-has-children > .sub-menu');

        subSubmenus.forEach((subSubmenu) => {
          const submenuRect = subSubmenu.getBoundingClientRect();
          const submenuRightEdge = submenuRect.left + submenuRect.width;
          const submenuIsOverflowing = submenuRightEdge > window.innerWidth;

          if (submenuIsOverflowing) {
            subSubmenu.parentElement.classList.add('left-submenu');
          } else {
            subSubmenu.parentElement.classList.remove('left-submenu');
          }
        });
      });
    }
  }
  customElements.define('full-menu-horizontal', FullMenuHorizontal);
}