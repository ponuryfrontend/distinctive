document.querySelectorAll('.seo-accordion').forEach(function (accordion) {
  var content = accordion.querySelector('.seo-accordion__content');
  var toggle = accordion.querySelector('.seo-accordion__toggle');

  if (!content || !toggle) return;

  toggle.addEventListener('click', function () {
    var isOpen = content.classList.toggle('is-open');

    if (isOpen) {
      content.style.maxHeight = content.scrollHeight + 'px';
    } else {
      content.style.maxHeight = '';
    }

    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.setAttribute('aria-label', isOpen ? 'Zwiń tekst' : 'Rozwiń tekst');
  });
});
