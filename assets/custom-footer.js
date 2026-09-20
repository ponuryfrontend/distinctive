/**
 *  @function CustomFooter
 *  Accordion headings (mobile) and sub-menu arrows for the Custom Footer section.
 *  Uses delegated listeners so sections re-rendered by the theme editor keep working.
 */
(function () {
  if (window.customFooterInitialized) return;
  window.customFooterInitialized = true;

  const desktopQuery = window.matchMedia('(min-width: 768px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /*
   * Height animation matching the product page accordions (see `collapsible-row`
   * in app.js): 400ms ease-out when opening, 250ms ease when closing. The panel
   * is hidden with `display: none` in CSS, so it is forced visible inline while
   * the animation runs and handed back to CSS once it finishes.
   */
  const OPEN_DURATION = 400;
  const CLOSE_DURATION = 250;

  function resetPanel(panel) {
    panel.style.display = '';
    panel.style.height = '';
    panel.style.paddingBottom = '';
    panel.style.overflow = '';
    panel.style.boxSizing = '';
  }

  function panelHeight(panel) {
    return panel.getBoundingClientRect().height;
  }

  function panelPadding(panel) {
    return parseFloat(window.getComputedStyle(panel).paddingBottom) || 0;
  }

  function animatePanel(panel, open) {
    if (!panel) return;

    if (desktopQuery.matches || reducedMotionQuery.matches || typeof panel.animate !== 'function') {
      resetPanel(panel);
      return;
    }

    // The caller has already flipped the attribute (or class) that CSS uses to show
    // the panel, so it has to be forced visible before anything can be measured.
    // box-sizing is pinned so the animated height always means the full box,
    // padding included, no matter what the theme sets.
    panel.style.display = 'block';
    panel.style.overflow = 'hidden';
    panel.style.boxSizing = 'border-box';

    let startHeight = null;
    let startPadding = 0;
    if (panel.customFooterAnimation) {
      // Pick up where the interrupted animation left off.
      startHeight = panelHeight(panel);
      startPadding = panelPadding(panel);
      panel.customFooterAnimation.cancel();
      panel.customFooterAnimation = null;
    }

    panel.style.height = '';
    panel.style.paddingBottom = '';
    const fullHeight = panelHeight(panel);
    const fullPadding = panelPadding(panel);

    if (startHeight === null) {
      startHeight = open ? 0 : fullHeight;
      startPadding = open ? 0 : fullPadding;
    }
    const endHeight = open ? fullHeight : 0;
    const endPadding = open ? fullPadding : 0;

    // The bottom padding is animated alongside the height, otherwise it keeps the
    // collapsed panel 26px tall and makes the last frame jump.
    const animation = panel.animate(
      [
        { height: `${startHeight}px`, paddingBottom: `${startPadding}px` },
        { height: `${endHeight}px`, paddingBottom: `${endPadding}px` }
      ],
      { duration: open ? OPEN_DURATION : CLOSE_DURATION, easing: open ? 'ease-out' : 'ease' }
    );

    panel.customFooterAnimation = animation;
    animation.onfinish = () => {
      panel.customFooterAnimation = null;
      resetPanel(panel);
    };
    animation.oncancel = () => {
      panel.customFooterAnimation = null;
    };
  }

  function toggleAccordion(button) {
    if (desktopQuery.matches) return;
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    const panel = button.nextElementSibling;
    if (panel && panel.classList.contains('custom-footer__menu-list')) {
      animatePanel(panel, !expanded);
    }
  }

  function toggleSubMenu(arrow) {
    const submenu = arrow.parentNode.querySelector('.custom-footer__sub-menu');
    if (!submenu) return;
    const active = submenu.classList.toggle('active');
    arrow.setAttribute('aria-expanded', active ? 'true' : 'false');
    animatePanel(submenu, active);
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

  /*
   * The theme locks scrolling with `body.overflow-hidden`, which is `position: fixed`,
   * so opening a modal jumps the page to the top. Offset the body by the current scroll
   * position while the localization modal is open and put the page back when it closes.
   */
  const SCROLL_KEY = 'customFooterScrollPosition';
  let scrollBeforeModal = 0;

  document.addEventListener(
    'click',
    (e) => {
      if (e.target.closest('.custom-footer__localization button')) {
        scrollBeforeModal = window.scrollY;
      }
    },
    true
  );

  function keepScrollPosition(opener) {
    const modal = document.querySelector(opener.getAttribute('data-modal'));
    if (!modal) return;
    const position = scrollBeforeModal;

    const apply = () => {
      if (!document.body.classList.contains('overflow-hidden')) return false;

      document.body.style.top = `-${position}px`;

      modal.querySelectorAll('form').forEach((form) => {
        form.addEventListener(
          'submit',
          () => {
            try {
              sessionStorage.setItem(SCROLL_KEY, position);
            } catch (error) {
              // Private browsing modes can block sessionStorage.
            }
          },
          { once: true }
        );
      });

      const observer = new MutationObserver(() => {
        if (modal.hasAttribute('open')) return;
        observer.disconnect();
        document.body.style.top = '';
        window.scrollTo(0, position);
      });
      observer.observe(modal, { attributes: true, attributeFilter: ['open'] });

      return true;
    };

    // The theme adds the scroll lock in its own click handler, which runs first.
    // The timeout is only a safety net in case that order ever changes.
    if (!apply()) setTimeout(apply, 0);
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('.custom-footer__localization modal-opener');
    if (opener) keepScrollPosition(opener);
  });

  function restoreScrollAfterReload() {
    let position = null;
    try {
      position = sessionStorage.getItem(SCROLL_KEY);
      sessionStorage.removeItem(SCROLL_KEY);
    } catch (error) {
      return;
    }
    if (position === null) return;
    requestAnimationFrame(() => window.scrollTo(0, parseInt(position, 10) || 0));
  }

  function syncState() {
    document.querySelectorAll('.custom-footer__toggle').forEach((button) => {
      button.setAttribute('aria-expanded', desktopQuery.matches ? 'true' : 'false');
    });

    // Drop leftover inline styles from an animation interrupted by a resize.
    document.querySelectorAll('.custom-footer__menu-list, .custom-footer__sub-menu').forEach((panel) => {
      if (panel.customFooterAnimation) {
        panel.customFooterAnimation.cancel();
        panel.customFooterAnimation = null;
      }
      resetPanel(panel);
    });
  }

  desktopQuery.addEventListener('change', syncState);
  document.addEventListener('shopify:section:load', syncState);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncState);
  } else {
    syncState();
  }

  if (document.readyState === 'complete') {
    restoreScrollAfterReload();
  } else {
    window.addEventListener('load', restoreScrollAfterReload, { once: true });
  }
})();
