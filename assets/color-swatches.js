(function () {
  'use strict';

  const TOOLTIP_CLASS = 'color-swatch-tooltip';

  let tooltip = null;

  function getTooltip() {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.className = TOOLTIP_CLASS;
      document.body.appendChild(tooltip);
    }
    return tooltip;
  }

  function showTooltip(swatch, label) {
    const tip = getTooltip();
    tip.textContent = label;
    tip.classList.add('is-visible');
    positionTooltip(swatch);
  }

  function hideTooltip() {
    if (tooltip) tooltip.classList.remove('is-visible');
  }

  function positionTooltip(swatch) {
    if (!tooltip) return;
    const rect = swatch.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    const top = rect.top - tipRect.height - 8 + window.scrollY;
    const left = rect.left + rect.width / 2 - tipRect.width / 2 + window.scrollX;
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }

  function init(container) {
    const swatches = container.querySelectorAll('.color-swatch[data-label]');

    swatches.forEach(function (swatch) {
      const label = swatch.dataset.label;
      if (!label) return;

      swatch.addEventListener('mouseenter', function () {
        showTooltip(swatch, label);
      });

      swatch.addEventListener('mouseleave', hideTooltip);
      swatch.addEventListener('focus', function () {
        showTooltip(swatch, label);
      });
      swatch.addEventListener('blur', hideTooltip);
    });
  }

  document.querySelectorAll('.product-color-swatches').forEach(init);
})();