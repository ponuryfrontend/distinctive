/**
 *  @function CustomFooter
 *  Accordion headings (mobile) and sub-menu arrows for the Custom Footer section.
 *  Uses delegated listeners so sections re-rendered by the theme editor keep working.
 */
(function () {
  if (window.customFooterInitialized) return;
  window.customFooterInitialized = true;

  const desktopQuery = window.matchMedia('(min-width: 768px)');

  function toggleAccordion(button) {
    if (desktopQuery.matches) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  }

  function toggleSubMenu(arrow) {
    const submenu = arrow.parentNode.querySelector('.custom-footer__sub-menu');
    if (!submenu) return;
    const active = submenu.classList.toggle('active');
    arrow.setAttribute('aria-expanded', active ? 'true' : 'false');
    if (!active) arrow.blur();
  }

  document.addEventListener('click', (e) => {
    const arrow = e.target.closest('.custom-footer__arrow');
    if (arrow) {
      e.preventDefault();
      toggleSubMenu(arrow);
      return;
    }

    const button = e.target.closest('.custom-footer__toggle');
    if (button) {
      e.preventDefault();
      toggleAccordion(button);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const arrow = e.target.closest('.custom-footer__arrow');
    if (!arrow) return;
    e.preventDefault();
    toggleSubMenu(arrow);
  });

  function syncState() {
    document.querySelectorAll('.custom-footer__toggle').forEach((button) => {
      button.setAttribute('aria-expanded', desktopQuery.matches ? 'true' : 'false');
    });
  }

  desktopQuery.addEventListener('change', syncState);
  document.addEventListener('shopify:section:load', syncState);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncState);
  } else {
    syncState();
  }
})();
