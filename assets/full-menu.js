/**
 *  @class
 *  @function FullMenu
 */
if (!customElements.get('full-menu')) {
  class FullMenu extends HTMLElement {
    constructor() {
      super();

      this.buttons = this.querySelectorAll('.full-menu--link-parent');
      this.header = this.closest('.header');
      this.subButtons = this.querySelectorAll('.full-menu--link-child');
      this.panel = this.querySelector('.full-menu--panel');
      this.panel1 = this.querySelector('.full-menu--panel--level-1');
      this.panel2 = this.querySelector('.full-menu--panel--level-2');
      this.cc = this.querySelector('.full-menu--cc');
      this.toggle = this.querySelector('.full-menu--toggle');
      this.panelWidth = 320;

      // Cache subpanel NodeLists — avoids querySelectorAll on every hover
      this.subpanels1 = this.panel1.querySelectorAll('.full-menu--subpanel');
      this.subpanels2 = this.panel2.querySelectorAll('.full-menu--subpanel');

      // Pre-compute panel width strings — these are constant
      this.widthSingle = this.panelWidth + 'px';
      this.widthDouble = (this.panelWidth * 2) + 'px';
      this.widthTriple = (this.panelWidth * 3) + 'px';
    }
    connectedCallback() {
      this.buttons.forEach((button) => {
        button.addEventListener('mouseenter', () => this.onParentHover(button));
        button.addEventListener('keydown', (e) => this.onParentKeydown(button, e));
        button.addEventListener('focus', () => this.onParentFocus());
      });
      this.subButtons.forEach((button) => {
        button.addEventListener('mouseenter', () => this.onChildHover(button));
      });
      this.panel2.addEventListener('mouseleave', this.onPanelLeave.bind(this));
      this.toggle.addEventListener('click', this.onToggleClick.bind(this));
      this.cc.addEventListener('mousemove', this.onCC.bind(this));
      this.panel.style.setProperty('--menu-panel-width-total', this.widthTriple);

      this.addEventListener('blur', this.onCC.bind(this));
      document.addEventListener('keyup', (event) => {
        if (event.key === 'Escape') {
          this.onCC();
        }
      });
    }
    onParentFocus() {
      this.header.classList.add('open-menu');
    }
    onParentKeydown(button, e) {
      if (e.key !== 'Enter') return;

      if (button.classList.contains('has-sub-menu')) {
        this.activateSubpanel(this.subpanels1, button.dataset.target, this.widthDouble);
        this.panel1.querySelector(button.dataset.target + ' a')?.focus();
      }
    }
    onParentHover(button) {
      this.header.classList.add('open-menu');

      if (button.classList.contains('has-sub-menu')) {
        this.activateSubpanel(this.subpanels1, button.dataset.target, this.widthDouble);
      } else {
        this.panel.style.setProperty('--menu-panel-width', this.widthSingle);
      }
      window.dispatchEvent(new Event('resize'));
    }
    onChildHover(button) {
      if (button.classList.contains('has-sub-menu')) {
        this.activateSubpanel(this.subpanels2, button.dataset.target, this.widthTriple);
      } else {
        this.panel.style.setProperty('--menu-panel-width', this.widthDouble);
      }
    }
    // Shared submenu activation — deactivates all siblings, activates target, sets panel width
    activateSubpanel(subpanels, targetSelector, width) {
      subpanels.forEach(el => el.classList.remove('active'));
      this.panel.style.setProperty('--menu-panel-width', width);
      const target = this.panel.querySelector(targetSelector);
      if (target) {
        target.classList.add('active');
      }
    }
    onPanelLeave() {
      this.panel.style.setProperty('--menu-panel-width', this.widthDouble);
    }
    onToggleClick() {
      this.header.classList.add('open-menu');
    }
    onCC() {
      this.panel.style.setProperty('--menu-panel-width', this.widthSingle);
      // Fix: clear active state from all subpanels in both levels
      this.panel.querySelectorAll('.full-menu--subpanel.active').forEach(el => el.classList.remove('active'));
      this.header.classList.remove('open-menu');
    }
  }
  customElements.define('full-menu', FullMenu);
}
