/* Thanh Long JSC — tương tác toàn site. Không dùng thư viện.
   Mỗi khối tự kiểm tra phần tử của mình, nên một file dùng cho mọi trang. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page') || '';

  /* ---------- menu: đánh dấu trang hiện tại ---------- */
  $$('[data-nav="' + page + '"]').forEach(function (a) {
    a.classList.add('active');
    a.setAttribute('aria-current', 'page');
  });

  /* ---------- header dính khi cuộn ---------- */
  var header = $('#header');
  var wrap = $('#headerWrap');
  var toTop = $('#toTop');
  var STICK_AT = 300;
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    if (y > STICK_AT && !wrap.classList.contains('stuck')) {
      // giữ chỗ để nội dung không bị giật lên khi header chuyển sang fixed
      header.style.minHeight = header.offsetHeight + 'px';
      wrap.classList.add('stuck');
    } else if (y <= STICK_AT && wrap.classList.contains('stuck')) {
      wrap.classList.remove('stuck');
      header.style.minHeight = '';
    }
    toTop.classList.toggle('is-show', y > 600);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- ô tìm kiếm ---------- */
  var searchBtn = $('#searchBtn');
  var searchBox = $('#searchBox');
  function setSearch(open) {
    searchBox.hidden = !open;
    searchBtn.setAttribute('aria-expanded', open);
    if (open) $('input', searchBox).focus();
  }
  searchBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    setSearch(searchBox.hidden);
  });
  document.addEventListener('click', function (e) {
    if (!searchBox.hidden && !searchBox.contains(e.target)) setSearch(false);
  });

  /* ---------- menu mobile trượt từ trái ---------- */
  var oc = $('#offcanvas');
  var toggle = $('#navToggle');
  function setMenu(open) {
    oc.classList.toggle('is-open', open);
    oc.setAttribute('aria-hidden', !open);
    toggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('is-locked', open);
    if (open) setTimeout(function () { $('.offcanvas__close', oc).focus(); }, 50);
    else toggle.focus();
  }
  toggle.addEventListener('click', function () { setMenu(true); });
  $$('[data-close]', oc).forEach(function (b) { b.addEventListener('click', function () { setMenu(false); }); });
  $$('.mnav a', oc).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  // giữ focus trong menu khi đang mở
  oc.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !oc.classList.contains('is-open')) return;
    var f = $$('a, button, input', oc).filter(function (x) { return x.offsetParent; });
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $$('.mnav__toggle', oc).forEach(function (b) {
    b.addEventListener('click', function () {
      var li = b.parentNode;
      var open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open);
    });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 991 && oc.classList.contains('is-open')) setMenu(false);
  });

  /* ---------- slider banner (trang chủ) ---------- */
  var slider = $('#slider');
  if (slider) {
    var slides = $$('.slide', slider);
    var dots = $$('.slider__dots button', slider);
    var cur = 0;
    var timer;
    var go = function (i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, j) {
        s.classList.toggle('is-active', j === cur);
        s.setAttribute('aria-hidden', j !== cur);
        // ảnh của slide kế tiếp được tải trước khi nó xuất hiện
        if (j === (cur + 1) % slides.length) $('img', s).loading = 'eager';
      });
      dots.forEach(function (d, j) {
        d.classList.toggle('is-active', j === cur);
        d.setAttribute('aria-selected', j === cur);
      });
    };
    var play = function () {
      clearInterval(timer);
      if (!reduced) timer = setInterval(function () { go(cur + 1); }, 6000);
    };
    $('.slider__arrow--prev', slider).addEventListener('click', function () { go(cur - 1); play(); });
    $('.slider__arrow--next', slider).addEventListener('click', function () { go(cur + 1); play(); });
    dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); play(); }); });
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', play);
    slider.addEventListener('focusin', function () { clearInterval(timer); });
    slider.addEventListener('focusout', play);
    var startX = null;
    slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1)); play(); }
      startX = null;
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) clearInterval(timer); else play();
    });
    go(0);
    play();
  }

  /* ---------- hiện dần khi cuộn tới ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: .1 });
  // các phần tử cùng hàng xuất hiện lần lượt
  $$('.products, .posts, .lines, .why, .stats, .reviews, .partners, .svc-grid').forEach(function (row) {
    $$('.reveal', row).forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 90 + 'ms'; });
  });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- bộ đếm số ---------- */
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      var el = en.target;
      var end = parseFloat(el.getAttribute('data-count'));
      var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
      var fmt = function (v) { return v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec }); };
      if (reduced) { el.textContent = fmt(end); return; }
      var t0 = performance.now();
      (function step(t) {
        var p = Math.min((t - t0) / 1600, 1);
        el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    });
  }, { threshold: .5 });
  $$('[data-count]').forEach(function (el) { countIO.observe(el); });

  /* ---------- hỏi đáp: mở một câu, đóng các câu khác ---------- */
  $$('.faq').forEach(function (faq) {
    var items = $$('.faq__item', faq);
    items.forEach(function (item) {
      var b = $('button', item);
      b.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          $('button', o).setAttribute('aria-expanded', 'false');
        });
        item.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', open);
      });
    });
  });

  /* ---------- lọc sản phẩm theo nhóm (trang Sản phẩm) ---------- */
  var filters = $$('.filter button');
  if (filters.length) {
    var cards = $$('[data-group]');
    var applyFilter = function (key, scroll) {
      var valid = filters.some(function (b) { return b.getAttribute('data-filter') === key; });
      if (!valid) key = 'all';
      filters.forEach(function (b) {
        var on = b.getAttribute('data-filter') === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', on);
      });
      cards.forEach(function (c) {
        var show = key === 'all' || c.getAttribute('data-group') === key;
        c.hidden = !show;
        if (show) { c.classList.remove('is-in'); void c.offsetWidth; c.classList.add('is-in'); }
      });
      if (scroll) $('#loc').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    };
    filters.forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-filter');
        applyFilter(key);
        history.replaceState(null, '', key === 'all' ? location.pathname : '#' + key);
      });
    });
    // link từ menu (san-pham/#cat-nhan-tao) mở đúng nhóm
    var fromHash = function () {
      var h = location.hash.slice(1);
      if (h === 'day-chuyen') return;
      applyFilter(h || 'all', !!h);
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  /* ---------- danh sách bài: tìm theo tiêu đề + phân trang ---------- */
  $$('[data-list]').forEach(function (list) {
    var per = parseInt(list.getAttribute('data-per') || '9', 10);
    var items = $$('.post', list);
    var pager = $('.pagination', list.parentNode);
    var search = $('.list-search input', list.parentNode);
    var empty = $('.list-empty', list.parentNode);
    var matched = items;
    var pageNo = 1;
    var render = function (scroll) {
      var pages = Math.max(1, Math.ceil(matched.length / per));
      if (pageNo > pages) pageNo = pages;
      items.forEach(function (it) { it.hidden = true; });
      matched.slice((pageNo - 1) * per, pageNo * per).forEach(function (it) {
        it.hidden = false;
        it.classList.add('is-in');
      });
      if (empty) empty.hidden = matched.length > 0;
      if (pager) {
        var html = '';
        if (pages > 1) {
          html += '<button data-p="' + (pageNo - 1) + '" aria-label="Trang trước"' + (pageNo === 1 ? ' disabled' : '') + '>‹</button>';
          for (var i = 1; i <= pages; i++) {
            html += '<button data-p="' + i + '"' + (i === pageNo ? ' class="is-active" aria-current="page"' : '') + ' aria-label="Trang ' + i + '">' + i + '</button>';
          }
          html += '<button data-p="' + (pageNo + 1) + '" aria-label="Trang sau"' + (pageNo === pages ? ' disabled' : '') + '>›</button>';
        }
        pager.innerHTML = html;
      }
      if (scroll) list.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    if (pager) {
      pager.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-p]');
        if (!b || b.disabled) return;
        pageNo = parseInt(b.getAttribute('data-p'), 10);
        render(true);
      });
    }
    if (search) {
      var norm = function (s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd'); };
      search.addEventListener('input', function () {
        var q = norm(search.value.trim());
        matched = items.filter(function (it) { return !q || norm(it.textContent).indexOf(q) > -1; });
        pageNo = 1;
        render(false);
      });
    }
    render(false);
  });

  /* ---------- form: kiểm tra và gửi (dùng chung) ---------- */
  var rules = {
    name: function (v) { return v.trim().length > 1; },
    phone: function (v) { var d = v.replace(/\D/g, ''); return d.length >= 9 && d.length <= 11; },
    email: function (v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  };
  function check(input) {
    var ok = rules[input.getAttribute('data-check')](input.value);
    var f = input.closest('.field');
    f.classList.toggle('is-err', !ok);
    input.setAttribute('aria-invalid', !ok);
    var err = $('.field__err', f);
    if (err) input.setAttribute('aria-describedby', err.id);
    return ok;
  }
  $$('.js-form').forEach(function (form) {
    var inputs = $$('[data-check]', form);
    inputs.forEach(function (el) {
      el.addEventListener('input', function () { if (el.closest('.field').classList.contains('is-err')) check(el); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = inputs.filter(function (el) { return !check(el); });
      if (bad.length) return bad[0].focus();
      var btn = $('button[type="submit"]', form);
      var label = btn.textContent;
      var name = $('[name="name"]', form);
      btn.classList.add('is-loading');
      btn.textContent = 'Đang gửi...';
      // Bản demo chưa có máy chủ: nối form tới email/CRM của công ty trước khi chạy thật.
      setTimeout(function () {
        btn.classList.remove('is-loading');
        btn.textContent = label;
        $$('[data-done-name]', form).forEach(function (s) { s.textContent = name ? name.value.trim() : ''; });
        var done = $('[data-done]', form);
        done.hidden = false;
        done.focus();
        form.reset();
      }, 900);
    });
  });

  /* ---------- chọn sẵn sản phẩm / công suất trong form báo giá ---------- */
  var qProduct = $('#q-product');
  var qCap = $('#q-cap');
  function pickOption(select, value) {
    if (!select || !value) return;
    $$('option', select).forEach(function (o) { if (o.value === value) select.value = value; });
  }
  if (qProduct) {
    // nút "Nhận báo giá" trên cùng trang
    $$('[data-pick]').forEach(function (a) {
      a.addEventListener('click', function () {
        pickOption(qProduct, a.getAttribute('data-pick'));
        if (a.hasAttribute('data-cap')) pickOption(qCap, a.getAttribute('data-cap'));
      });
    });
    // từ trang khác sang: bao-gia/?sp=...&cap=...
    var params = new URLSearchParams(location.search);
    pickOption(qProduct, params.get('sp'));
    pickOption(qCap, params.get('cap'));
  }

  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (oc.classList.contains('is-open')) setMenu(false);
    else if (!searchBox.hidden) { setSearch(false); searchBtn.focus(); }
  });
})();
