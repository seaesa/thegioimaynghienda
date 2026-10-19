/* Thanh Long JSC — tương tác trang chủ. Không dùng thư viện. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header dính khi cuộn qua topbar + masthead ---------- */
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

  /* ---------- menu chính: đánh dấu mục đang xem ---------- */
  var navLinks = $$('.nav > ul > li > a[href^="#"]');
  var sectionIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      navLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id);
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  navLinks.forEach(function (a) {
    var s = $(a.getAttribute('href'));
    if (s) sectionIO.observe(s);
  });

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

  /* ---------- slider banner: tự chạy, mũi tên, chấm, vuốt ---------- */
  var slider = $('#slider');
  var slides = $$('.slide', slider);
  var dots = $$('.slider__dots button', slider);
  var cur = 0;
  var timer;
  var DELAY = 6000;
  function go(i) {
    cur = (i + slides.length) % slides.length;
    slides.forEach(function (s, j) {
      s.classList.toggle('is-active', j === cur);
      s.setAttribute('aria-hidden', j !== cur);
      // ảnh của slide sau được tải trước khi nó xuất hiện
      var img = $('img', s);
      if (j === (cur + 1) % slides.length) img.loading = 'eager';
    });
    dots.forEach(function (d, j) {
      d.classList.toggle('is-active', j === cur);
      d.setAttribute('aria-selected', j === cur);
    });
  }
  function play() {
    clearInterval(timer);
    if (!reduced) timer = setInterval(function () { go(cur + 1); }, DELAY);
  }
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

  /* ---------- hiện dần khi cuộn tới ---------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      revealIO.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: .1 });
  // các phần tử cùng hàng xuất hiện lần lượt
  $$('.products, .posts, .lines, .why, .stats, .reviews').forEach(function (row) {
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
  var faqs = $$('.faq__item');
  faqs.forEach(function (item) {
    var b = $('button', item);
    b.addEventListener('click', function () {
      var open = !item.classList.contains('is-open');
      faqs.forEach(function (o) {
        o.classList.remove('is-open');
        $('button', o).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- kiểm tra form ---------- */
  function check(input, ok) {
    var f = input.closest('.field');
    f.classList.toggle('is-err', !ok);
    input.setAttribute('aria-invalid', !ok);
    var err = $('.field__err', f);
    if (err) input.setAttribute('aria-describedby', err.id);
    return ok;
  }
  function validPhone(v) {
    var d = v.replace(/\D/g, '');
    return d.length >= 9 && d.length <= 11;
  }

  /* ---------- form báo giá ---------- */
  var qf = $('#quoteForm');
  var qName = $('#q-name');
  var qPhone = $('#q-phone');
  [qName, qPhone].forEach(function (el) {
    el.addEventListener('input', function () {
      if (el.closest('.field').classList.contains('is-err')) {
        check(el, el === qName ? el.value.trim().length > 1 : validPhone(el.value));
      }
    });
  });
  qf.addEventListener('submit', function (e) {
    e.preventDefault();
    var okName = check(qName, qName.value.trim().length > 1);
    var okPhone = check(qPhone, validPhone(qPhone.value));
    if (!okName) return qName.focus();
    if (!okPhone) return qPhone.focus();
    var btn = $('button[type="submit"]', qf);
    btn.classList.add('is-loading');
    btn.textContent = 'Đang gửi...';
    // Bản demo chưa có máy chủ: nối form tới email/CRM của công ty trước khi chạy thật.
    setTimeout(function () {
      btn.classList.remove('is-loading');
      btn.textContent = 'Gửi yêu cầu báo giá';
      $('#doneName').textContent = qName.value.trim();
      var done = $('#quoteDone');
      done.hidden = false;
      done.focus();
      qf.reset();
    }, 900);
  });

  // nút "Nhận báo giá" ở sản phẩm và bảng cấu hình chọn sẵn máy, công suất
  function pickOption(select, value) {
    $$('option', select).forEach(function (o) { if (o.value === value || o.textContent === value) select.value = o.value; });
  }
  $$('[data-pick]').forEach(function (a) {
    a.addEventListener('click', function () {
      pickOption($('#q-product'), a.getAttribute('data-pick'));
      if (a.hasAttribute('data-cap')) pickOption($('#q-cap'), a.getAttribute('data-cap'));
      setTimeout(function () { qName.focus({ preventScroll: true }); }, 700);
    });
  });

  /* ---------- popup tư vấn: hiện một lần mỗi phiên, sau 15 giây ---------- */
  var popup = $('#popup');
  var lastFocus;
  function seen() {
    try { return sessionStorage.getItem('tl-popup') === '1'; } catch (e) { return false; }
  }
  function markSeen() {
    try { sessionStorage.setItem('tl-popup', '1'); } catch (e) { /* trình duyệt chặn lưu trữ */ }
  }
  function openPopup() {
    // không chen ngang khi khách đang điền form báo giá hoặc mở menu
    if (seen() || oc.classList.contains('is-open') || qf.contains(document.activeElement)) return;
    lastFocus = document.activeElement;
    popup.hidden = false;
    document.body.classList.add('is-locked');
    markSeen();
    setTimeout(function () { $('#p-phone').focus(); }, 50);
  }
  function closePopup() {
    popup.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus) lastFocus.focus();
  }
  $$('[data-close]', popup).forEach(function (b) { b.addEventListener('click', closePopup); });
  setTimeout(openPopup, 15000);

  $('#popupForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var p = $('#p-phone');
    if (!check(p, validPhone(p.value))) return p.focus();
    // Bản demo chưa có máy chủ.
    this.hidden = true;
    $('#popupDone').hidden = false;
    setTimeout(closePopup, 2200);
  });

  window.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!popup.hidden) closePopup();
    else if (oc.classList.contains('is-open')) setMenu(false);
    else if (!searchBox.hidden) { setSearch(false); searchBtn.focus(); }
  });
})();
