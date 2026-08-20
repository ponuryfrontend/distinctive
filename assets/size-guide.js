(function () {
  'use strict';

  var scrollLock = (function () {
    var count = 0;
    var savedY = 0;

    function lock() {
      if (count === 0) {
        savedY = window.pageYOffset || document.documentElement.scrollTop || 0;
        var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.body.style.top = (-savedY) + 'px';
        if (scrollbarWidth > 0) {
          document.body.style.paddingRight = scrollbarWidth + 'px';
        }
        document.body.classList.add('sg-lock');
      }
      count++;
    }

    function unlock() {
      count = Math.max(0, count - 1);
      if (count === 0) {
        document.body.classList.remove('sg-lock');
        document.body.style.top = '';
        document.body.style.paddingRight = '';
        window.scrollTo(0, savedY);
      }
    }

    return { lock: lock, unlock: unlock };
  })();

  var CM_TO_INCH = 0.393700787;
  var ORDER  = ['bust', 'waist', 'hips', 'sleeve', 'length'];
  var LABELS = {
    bust:   'Biust',
    waist:  'Talia',
    hips:   'Biodra',
    sleeve: 'Długość rękawa',
    length: 'Długość całkowita'
  };

  function fmt(v, unit) {
    if (v === null || v === undefined || v === '') return '—';
    var n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
    if (isNaN(n)) return String(v);
    if (unit === 'inch') n *= CM_TO_INCH;
    n = Math.round(n * 10) / 10;
    return (n % 1 === 0 ? String(n) : n.toFixed(1)).replace('.', ',');
  }

  function presentKeys(sizes) {
    var found = {};
    Object.keys(sizes).forEach(function (sz) {
      Object.keys(sizes[sz] || {}).forEach(function (k) {
        var v = sizes[sz][k];
        if (v !== null && v !== undefined && v !== '') found[k] = true;
      });
    });
    return ORDER.filter(function (k) { return found[k]; }).concat(
      Object.keys(found).filter(function (k) { return ORDER.indexOf(k) === -1; })
    );
  }

  function initProductMeasurements(root) {
    var section = root.querySelector('[data-sg-product]');
    if (!section) return;

    var data;
    try { data = JSON.parse(section.getAttribute('data-measurements') || ''); } catch (e) {}
    if (!data || !data.sizes) { section.style.display = 'none'; return; }

    var sizesWrap = section.querySelector('[data-sg-sizes]');
    var table     = section.querySelector('[data-sg-measure] tbody');
    if (!sizesWrap || !table) { section.style.display = 'none'; return; }

    var figure = section.querySelector('[data-sg-figure]');
    var parsedLabels = {};
    try { parsedLabels = JSON.parse(section.getAttribute('data-labels') || '{}'); } catch (e) {}
    var labels = Object.assign({}, LABELS, parsedLabels, data.labels || {});

    var avail = [];
    try { avail = JSON.parse(section.getAttribute('data-sizes') || '[]'); } catch (e) {}
    var mKeys    = Object.keys(data.sizes);
    var inter    = avail.filter(function (s) { return mKeys.indexOf(s) !== -1; });
    var sizeKeys = inter.length ? inter : mKeys;
    var rowKeys  = presentKeys(data.sizes);
    var state    = { size: sizeKeys[0], unit: 'cm' };
    var sizeBtns = [];

    // Build all buttons in a DocumentFragment — one DOM insertion instead of N
    var btnFrag = document.createDocumentFragment();
    sizeKeys.forEach(function (key, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'sg__size' + (i === 0 ? ' is-active' : '');
      btn.textContent = key;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      sizeBtns.push(btn);
      btnFrag.appendChild(btn);
    });
    sizesWrap.innerHTML = '';
    sizesWrap.appendChild(btnFrag);

    // One delegated click listener instead of N individual ones
    sizesWrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.sg__size');
      if (!btn || state.size === btn.textContent) return;
      state.size = btn.textContent;
      sizeBtns.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      updateValues();
    });

    var valueCells = {}, tableRows = {};
    var svgDims = figure ? [].slice.call(figure.querySelectorAll('.sg-svg__dim')) : [];

    // Build all rows in a DocumentFragment — one DOM insertion instead of N
    var rowFrag = document.createDocumentFragment();
    rowKeys.forEach(function (key) {
      var tr  = document.createElement('tr');
      var tdL = document.createElement('td');
      var tdV = document.createElement('td');
      tr.setAttribute('data-row-key', key);
      tdL.className = 'sg__measure-label';
      tdL.textContent = labels[key] || key;
      tr.appendChild(tdL);
      tr.appendChild(tdV);
      valueCells[key] = tdV;
      tableRows[key]  = tr;
      rowFrag.appendChild(tr);
    });
    table.innerHTML = '';
    table.appendChild(rowFrag);

    function highlight(activeKey) {
      svgDims.forEach(function (g) { g.classList.toggle('is-active', g.getAttribute('data-point') === activeKey); });
      rowKeys.forEach(function (k) { tableRows[k].classList.toggle('is-highlight', k === activeKey); });
    }

    // 4 delegated listeners on the table instead of 3 per-row listeners (3×N total)
    table.addEventListener('mouseover', function (e) {
      var tr = e.target.closest('[data-row-key]');
      highlight(tr ? tr.getAttribute('data-row-key') : null);
    });
    table.addEventListener('mouseleave', function () { highlight(null); });
    table.addEventListener('focusin', function (e) {
      var tr = e.target.closest('[data-row-key]');
      if (tr) highlight(tr.getAttribute('data-row-key'));
    }, true);
    table.addEventListener('focusout', function (e) {
      if (!table.contains(e.relatedTarget)) highlight(null);
    }, true);

    function updateValues() {
      var vals = data.sizes[state.size] || {};
      rowKeys.forEach(function (k) { valueCells[k].textContent = fmt(vals[k], state.unit); });
    }

    // Cache scrollEl once in the closure instead of traversing DOM on every radio click
    section.querySelectorAll('[data-sg-unit]').forEach(function (input) {
      var label    = input.closest('label');
      var scrollEl = input.closest('.sg__scroll');
      if (label && scrollEl) {
        label.addEventListener('click', function () {
          var top = scrollEl.scrollTop;
          requestAnimationFrame(function () { scrollEl.scrollTop = top; });
        });
      }
      input.addEventListener('change', function () {
        if (input.checked) { state.unit = input.value; updateValues(); }
      });
    });

    updateValues();
  }

  function initBrandChart(root) {
    var table = root.querySelector('[data-sg-brand-table]');
    if (!table) return;

    var cells = [].slice.call(table.querySelectorAll('tbody td'));
    var origValues = cells.map(function (td) {
      var text = td.textContent.trim();
      var range = text.match(/^(-?[\d.,]+)\s*[-–]\s*(-?[\d.,]+)$/);
      if (range) {
        var lo = parseFloat(range[1].replace(',', '.'));
        var hi = parseFloat(range[2].replace(',', '.'));
        if (!isNaN(lo) && !isNaN(hi)) return [lo, hi];
      }
      var n = parseFloat(text.replace(',', '.'));
      return isNaN(n) ? text : n;
    });

    var foot = root.querySelector('[data-sg-brand-foot]');
    var unit = 'cm';

    function render() {
      cells.forEach(function (td, i) {
        var v = origValues[i];
        if (Array.isArray(v)) {
          td.textContent = fmt(v[0], unit) + '-' + fmt(v[1], unit);
        } else {
          td.textContent = typeof v === 'number' ? fmt(v, unit) : v;
        }
      });
      if (foot) {
        foot.innerHTML = unit === 'cm'
          ? 'Wszystkie wymiary podane w centymetrach.'
          : 'Wszystkie wymiary podane w calach.';
      }
    }

    // Cache scrollEl once per input
    root.querySelectorAll('[data-sg-brand-unit]').forEach(function (input) {
      var label    = input.closest('label');
      var scrollEl = input.closest('.sg__scroll');
      if (label && scrollEl) {
        label.addEventListener('click', function () {
          var top = scrollEl.scrollTop;
          requestAnimationFrame(function () { scrollEl.scrollTop = top; });
        });
      }
      input.addEventListener('change', function () {
        if (input.checked) { unit = input.value; render(); }
      });
    });
  }

  function initAccordion(root) {
    var btn  = root.querySelector('[data-sg-accordion]');
    var body = root.querySelector('[data-sg-accordion-body]');
    if (!btn || !body) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      body.classList.toggle('is-open', !open);
    });
  }

  function initModal(root, onFirstOpen) {
    var openBtn  = root.querySelector('[data-sg-open]');
    var overlay  = root.querySelector('[data-sg-overlay]');
    var panel    = root.querySelector('[data-sg-panel]');
    var closeEls = root.querySelectorAll('[data-sg-close]');
    if (!overlay || !panel) return;

    var lastFocused;
    var contentReady = false;

    function focusable() {
      return [].slice.call(
        panel.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
      ).filter(function (el) { return !el.disabled && el.offsetParent !== null; });
    }

    function onKey(e) {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusable();
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0])
        { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1])
        { e.preventDefault(); f[0].focus(); }
    }

    var isOpen = false;

    function open() {
      if (isOpen) return;
      isOpen = true;
      // Lazy: init content first (while overlay is still inside root), then move to <body>
      if (!contentReady) {
        contentReady = true;
        if (onFirstOpen) onFirstOpen();
        if (overlay.parentNode !== document.body) document.body.appendChild(overlay);
      }
      lastFocused = document.activeElement;
      overlay.hidden = false;
      scrollLock.lock();
      void overlay.offsetWidth;
      overlay.classList.add('is-open');
      openBtn && openBtn.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKey);
      panel.focus();
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.classList.remove('is-open');
      openBtn && openBtn.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey);
      scrollLock.unlock();
      var done = function () { overlay.hidden = true; overlay.removeEventListener('transitionend', done); };
      overlay.addEventListener('transitionend', done);
      setTimeout(function () { if (!overlay.classList.contains('is-open')) overlay.hidden = true; }, 500);
      lastFocused && lastFocused.focus && lastFocused.focus();
    }

    openBtn && openBtn.addEventListener('click', open);
    closeEls.forEach(function (el) { el.addEventListener('click', close); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });

    root.__sgOpen  = open;
    root.__sgClose = close;
  }

  function init(root) {
    if (root.__sgInit) return;
    root.__sgInit = true;
    initAccordion(root);
    // Heavy init (JSON parse + DOM build) deferred to first popup open
    initModal(root, function () {
      initProductMeasurements(root);
      initBrandChart(root);
    });
  }

  function boot() { document.querySelectorAll('[data-size-guide]').forEach(init); }

  if (!document.__sgDelegated) {
    document.__sgDelegated = true;
    document.addEventListener('click', function (e) {
      var opener = e.target.closest && e.target.closest('[data-size-guide-open]');
      if (!opener) return;
      e.preventDefault();
      var uid  = opener.getAttribute('data-size-guide-open');
      var root = (uid && document.querySelector('.sg[data-uid="' + uid + '"]')) ||
                 document.querySelector('.sg[data-size-guide]');
      root && root.__sgOpen && root.__sgOpen();
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', boot)
    : boot();

  document.addEventListener('shopify:section:load',   boot);
  document.addEventListener('shopify:section:select', boot);
})();
