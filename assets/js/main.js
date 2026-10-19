/* Thanh Long JSC — site interactions. No dependencies.
   Every module checks for its own markup, so one file serves all pages. */
(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = new Intl.NumberFormat('vi-VN');
  const page = document.body.dataset.page || '';

  /* ---------- header: shrink on scroll, hide going down, show going up ---------- */
  const hdr = $('#hdr');
  const fab = $('#fab');
  const mbar = $('.mbar');
  const quoteSec = $('#bao-gia');
  const megaItem = $('.has-mega');
  let lastY = scrollY;
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    const down = y > lastY;
    hdr.classList.toggle('is-scrolled', y > 40);
    const megaOpen = megaItem && megaItem.classList.contains('is-open');
    hdr.classList.toggle('is-hidden', down && y > 480 && !megaOpen);
    fab.classList.toggle('show-top', y > 900);
    // keep the mobile action bar out of the way while the quote form is on screen
    if (quoteSec) {
      const q = quoteSec.getBoundingClientRect();
      mbar.classList.toggle('is-hidden', q.top < innerHeight && q.bottom > 0);
    }
    lastY = y;
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();

  /* ---------- current page in the main nav ---------- */
  const navKey = page === 'may-nghien-ham' ? 'may-nghien-da' : page === 'may-lam-cat-vsi' ? 'cat-nhan-tao' : page;
  $$(`[data-nav="${navKey}"]`).forEach((a) => { a.classList.add('is-cur'); a.setAttribute('aria-current', 'page'); });

  /* ---------- mega menu: hover on pointer devices, click everywhere ---------- */
  if (megaItem) {
    const megaBtn = $('.nav__link', megaItem);
    let megaTimer;
    const setMega = (open) => {
      megaItem.classList.toggle('is-open', open);
      megaBtn.setAttribute('aria-expanded', open);
    };
    megaBtn.addEventListener('click', () => setMega(!megaItem.classList.contains('is-open')));
    if (matchMedia('(hover: hover)').matches) {
      megaItem.addEventListener('mouseenter', () => { clearTimeout(megaTimer); setMega(true); });
      megaItem.addEventListener('mouseleave', () => { megaTimer = setTimeout(() => setMega(false), 160); });
    }
    document.addEventListener('click', (e) => { if (!megaItem.contains(e.target)) setMega(false); });
    $$('.mega a').forEach((a) => a.addEventListener('click', () => setMega(false)));
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && megaItem.classList.contains('is-open')) { setMega(false); megaBtn.focus(); }
    });
  }

  /* ---------- mobile drawer ---------- */
  const drawer = $('#drawer');
  const burger = $('#burger');
  let lastFocus;
  $$('.drawer__nav > *').forEach((el, i) => {
    const t = el.matches('.acc') ? $('.acc__btn', el) : el;
    t.style.setProperty('--d', i);
  });
  const setDrawer = (open) => {
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', !open);
    burger.setAttribute('aria-expanded', open);
    document.body.classList.toggle('is-locked', open);
    if (open) {
      lastFocus = document.activeElement;
      setTimeout(() => $('.drawer__close', drawer).focus(), 50);
    } else if (lastFocus) {
      lastFocus.focus();
    }
  };
  burger.addEventListener('click', () => setDrawer(true));
  $$('[data-close]', drawer).forEach((b) => b.addEventListener('click', () => setDrawer(false)));
  $$('a', drawer).forEach((a) => a.addEventListener('click', () => setDrawer(false)));
  drawer.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('a, button', drawer).filter((x) => x.offsetParent);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  $$('.acc').forEach((acc) => {
    const b = $('.acc__btn', acc);
    b.addEventListener('click', () => {
      const open = !acc.classList.contains('is-open');
      acc.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open);
    });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) setDrawer(false); });
  addEventListener('resize', () => { if (innerWidth > 1024 && drawer.classList.contains('is-open')) setDrawer(false); });

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  $$('[data-reveal]').forEach((el) => io.observe(el));

  /* ---------- counters ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target;
      const end = parseFloat(el.dataset.count);
      const dec = +(el.dataset.dec || 0);
      const pre = el.dataset.prefix || '';
      const out = (v) => pre + v.toLocaleString('vi-VN', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      if (reduced) { el.textContent = out(end); return; }
      const t0 = performance.now();
      const dur = 1400;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = out(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- product tabs (home) ---------- */
  const tabs = $$('.tab');
  const bar = $('.tabs__bar');
  if (tabs.length && bar) {
    // underline spans the label only, not the tab's horizontal padding
    const moveBar = (t) => {
      const cs = getComputedStyle(t);
      const pl = parseFloat(cs.paddingLeft);
      bar.style.setProperty('--x', t.offsetLeft + pl + 'px');
      bar.style.setProperty('--w', t.offsetWidth - pl - parseFloat(cs.paddingRight) + 'px');
    };
    const showTab = (key, focus) => {
      tabs.forEach((t) => {
        const on = t.dataset.tab === key;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on);
        t.tabIndex = on ? 0 : -1;
        const p = $('#' + t.getAttribute('aria-controls'));
        p.hidden = !on;
        p.classList.toggle('is-on', on);
        if (on) { moveBar(t); if (focus) t.focus(); t.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => showTab(t.dataset.tab));
      t.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) showTab(tabs[(i + d + tabs.length) % tabs.length].dataset.tab, true);
      });
    });
    addEventListener('resize', () => moveBar($('.tab.is-on')));
    document.fonts?.ready.then(() => moveBar($('.tab.is-on')));
    moveBar(tabs[0]);
  }

  /* ---------- process line (home) ---------- */
  const lineBtns = $$('.line__steps button');
  if (lineBtns.length) {
    const STEPS = [
      { img: 'du-an-bao-tri', m: 'Máy kẹp hàm', h: 'Bẻ đá hộc thành cỡ nghiền được', p: 'Đá sau nổ mìn được cấp liệu rung đưa vào máy kẹp hàm. Đây là máy chịu tải nặng nhất của trạm nên chọn đúng cỡ miệng nạp quyết định công suất cả dây chuyền.', o: 'Đá cỡ lớn, chuyển sang nghiền trung' },
      { img: 'con', m: 'Máy nghiền côn · phản kích', h: 'Nghiền nhỏ và tạo hình hạt', p: 'Máy côn cho đá cứng như granite, bazan; máy phản kích cho đá vôi và vật liệu tái chế. Công đoạn này quyết định hạt đá có dạng khối đẹp hay dẹt, ảnh hưởng trực tiếp giá bán.', o: 'Đá dăm nhiều cỡ, đưa lên sàng' },
      { img: 'du-an-300', m: 'Sàng rung phân loại', h: 'Tách sản phẩm theo đúng cỡ', p: 'Sàng nhiều tầng chia đá thành 0–5, 5–10, 10–20, 20–40 mm hoặc cấp phối Dmax 37,5. Đá quá cỡ được quay vòng lại máy nghiền thay vì bị bỏ đi.', o: 'Đá thành phẩm theo cỡ, phần quá cỡ quay vòng' },
      { img: 'vsi', m: 'Máy làm cát VSI', h: 'Vo đá, biến đá nhỏ thành cát', p: 'Rôto 1.500–2.500 vòng/phút ném đá va vào đá. Tỷ lệ cát đạt 35–50% và chỉnh được tỷ lệ đá vo / cát theo đơn hàng, động cơ chỉ 110–150 kW.', o: 'Cát nghiền và đá vo hạt khối' },
      { img: 'rua-cat', m: 'Máy rửa cát dạng guồng', h: 'Rửa sạch bùn và đất sét', p: 'Guồng rửa loại bỏ đất sét, bùn và tạp chất hữu cơ để cát đạt chuẩn cho bê tông và vữa, đồng thời tách nước để cát ra khô hơn.', o: 'Cát sạch, độ ẩm thấp' },
      { img: 'tach-cat-min', m: 'Máy tách cát mịn', h: 'Lấy lại tiền đang chảy ra suối', p: 'Hạt 0,16–3 mm thường trôi theo nước rửa, mất hơn 20% sản lượng. Máy tách cát mịn thu hồi phần này và giúp kiểm soát mô-đun độ lớn của cát thành phẩm.', o: 'Thêm sản lượng cát, nước thải sạch hơn' },
    ];
    const lineImgWrap = $('.line__img');
    const lineInfo = $('.line__info');
    const rail = $('.line__rail span');
    let lineIdx = 0;
    const setLine = (i, focus) => {
      if (i === lineIdx && !focus) return;
      lineIdx = i;
      lineBtns.forEach((b, j) => {
        b.classList.toggle('is-on', j === i);
        b.setAttribute('aria-selected', j === i);
        b.tabIndex = j === i ? 0 : -1;
      });
      if (focus) lineBtns[i].focus();
      rail.style.setProperty('--p', ((i + 1) / STEPS.length) * 100 + '%');
      const s = STEPS[i];
      const swap = () => {
        $('#lineImg').src = `assets/img/${s.img}.webp`;
        $('#lineImg').alt = s.m;
        $('#lineK').textContent = `Công đoạn ${String(i + 1).padStart(2, '0')} · ${s.m}`;
        $('#lineH').textContent = s.h;
        $('#lineP').textContent = s.p;
        $('#lineO').textContent = s.o;
        lineImgWrap.classList.remove('is-swap');
        lineInfo.classList.remove('is-swap');
      };
      if (reduced) return swap();
      lineImgWrap.classList.add('is-swap');
      lineInfo.classList.add('is-swap');
      setTimeout(swap, 280);
    };
    lineBtns.forEach((b, i) => {
      b.addEventListener('click', () => setLine(i));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) setLine((i + d + STEPS.length) % STEPS.length, true);
      });
    });
    // warm the cache so swaps don't flash
    STEPS.forEach((s) => { const im = new Image(); im.src = `assets/img/${s.img}.webp`; });
  }

  /* ---------- savings calculator ---------- */
  const vol = $('#vol');
  if (vol) {
    const money = (v) => v >= 1e9
      ? (v / 1e9).toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' tỷ ₫'
      : (v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' triệu ₫';
    const calc = () => {
      const v = +vol.value;
      const perM3 = 8000 - 3750;
      $('#volOut').textContent = fmt.format(v);
      $('#saveM').textContent = money(v * perM3);
      $('#saveY').textContent = money(v * perM3 * 12);
      vol.style.setProperty('--fill', ((v - vol.min) / (vol.max - vol.min)) * 100 + '%');
    };
    vol.addEventListener('input', calc);
    calc();
  }

  /* ---------- horizontal rail: arrows, drag, progress ---------- */
  const railEl = $('#rail');
  if (railEl) {
    const prog = $('#railProg');
    const railBtns = $$('.rbtn[data-dir]');
    const railUpdate = () => {
      const max = railEl.scrollWidth - railEl.clientWidth;
      const p = max > 0 ? railEl.scrollLeft / max : 1;
      prog.style.width = 15 + p * 85 + '%';
      railBtns[0].disabled = railEl.scrollLeft < 4;
      railBtns[1].disabled = railEl.scrollLeft > max - 4;
    };
    railEl.addEventListener('scroll', () => requestAnimationFrame(railUpdate), { passive: true });
    railBtns.forEach((b) => b.addEventListener('click', () => {
      const card = railEl.firstElementChild;
      railEl.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 20), behavior: reduced ? 'auto' : 'smooth' });
    }));
    let drag = null;
    railEl.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: railEl.scrollLeft, moved: false };
    });
    addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5) { drag.moved = true; railEl.classList.add('is-drag'); }
      railEl.scrollLeft = drag.left - dx;
    });
    addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      railEl.classList.remove('is-drag');
      if (moved) {
        // snap to nearest card after a drag
        const w = railEl.firstElementChild.offsetWidth + 20;
        railEl.scrollTo({ left: Math.round(railEl.scrollLeft / w) * w, behavior: 'smooth' });
      }
    });
    railEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') railBtns[1].click();
      if (e.key === 'ArrowLeft') railBtns[0].click();
    });
    railUpdate();
  }

  /* ---------- testimonials: auto-advance, pauses on hover/focus/offscreen ---------- */
  const voices = $$('.voice');
  if (voices.length) {
    const vBar = $('#vBar');
    const DUR = 7000;
    let vIdx = 0;
    let vTimer;
    let vVisible = false;
    let vPaused = false;
    const runVoice = () => {
      clearTimeout(vTimer);
      vBar.classList.remove('is-run');
      void vBar.offsetWidth;
      if (reduced || !vVisible || vPaused) return;
      vBar.style.setProperty('--dur', DUR + 'ms');
      vBar.classList.add('is-run');
      vTimer = setTimeout(() => setVoice(vIdx + 1), DUR);
    };
    const setVoice = (i) => {
      vIdx = (i + voices.length) % voices.length;
      voices.forEach((v, j) => {
        v.classList.toggle('is-on', j === vIdx);
        v.setAttribute('aria-hidden', j !== vIdx);
      });
      $('#vIdx').textContent = String(vIdx + 1).padStart(2, '0');
      runVoice();
    };
    $$('[data-v]').forEach((b) => b.addEventListener('click', () => setVoice(vIdx + +b.dataset.v)));
    const vSec = $('.voices');
    vSec.addEventListener('mouseenter', () => { vPaused = true; clearTimeout(vTimer); });
    vSec.addEventListener('mouseleave', () => { vPaused = false; runVoice(); });
    vSec.addEventListener('focusin', () => { vPaused = true; clearTimeout(vTimer); vBar.classList.remove('is-run'); });
    vSec.addEventListener('focusout', () => { vPaused = false; runVoice(); });
    new IntersectionObserver(([en]) => { vVisible = en.isIntersecting; runVoice(); }, { threshold: .4 }).observe(vSec);
    setVoice(0);
  }

  /* ---------- FAQ accordion ---------- */
  $$('.qa').forEach((qa) => {
    const b = $('button', qa);
    b.addEventListener('click', () => {
      const open = !qa.classList.contains('is-open');
      qa.classList.toggle('is-open', open);
      b.setAttribute('aria-expanded', open);
    });
  });

  /* ---------- table of contents: highlights the section in view ---------- */
  const tocLinks = $$('.toc a[href^="#"]');
  if (tocLinks.length) {
    const toc = $('.toc');
    const tocBar = $('.toc__bar span');
    const targets = tocLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
    const setCur = (id) => {
      tocLinks.forEach((a, i) => {
        const on = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-cur', on);
        if (on) {
          a.setAttribute('aria-current', 'location');
          if (tocBar) tocBar.style.width = ((i + 1) / tocLinks.length) * 100 + '%';
          // keep the active chip visible in the horizontal mobile TOC
          if (toc.scrollWidth > toc.clientWidth) toc.scrollTo({ left: a.offsetLeft - 16, behavior: reduced ? 'auto' : 'smooth' });
        } else {
          a.removeAttribute('aria-current');
        }
      });
    };
    const tocIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setCur(en.target.id); });
    }, { rootMargin: '-30% 0px -60% 0px' });
    targets.forEach((t) => tocIO.observe(t));
  }

  /* ---------- product gallery: thumbnails swap the main image ---------- */
  $$('.gal').forEach((gal) => {
    const main = $('.gal__main img', gal);
    const cap = $('.gal__main figcaption', gal);
    const thumbs = $$('.gal__thumbs button', gal);
    const show = (i) => {
      const t = thumbs[i];
      const img = $('img', t);
      thumbs.forEach((b, j) => b.setAttribute('aria-pressed', j === i));
      if (main.src === img.src) return;
      const swap = () => {
        main.src = img.src;
        main.alt = img.alt;
        if (cap) cap.textContent = img.alt;
        main.classList.remove('is-swap');
      };
      if (reduced) return swap();
      main.classList.add('is-swap');
      setTimeout(swap, 220);
    };
    thumbs.forEach((b, i) => {
      b.addEventListener('click', () => show(i));
      b.addEventListener('keydown', (e) => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = (i + d + thumbs.length) % thumbs.length;
        thumbs[n].focus();
        show(n);
      });
    });
  });

  /* ---------- form helpers ---------- */
  const checkField = (input, ok) => {
    const fld = input.closest('.fld');
    fld.classList.toggle('is-err', !ok);
    input.setAttribute('aria-invalid', !ok);
    const err = $('.fld__err', fld);
    if (err) input.setAttribute('aria-describedby', err.id);
    return ok;
  };
  const validateContact = (form) => {
    const fields = [
      [$('[name="name"]', form), (v) => v.trim().length > 1],
      [$('[name="phone"]', form), (v) => { const d = v.replace(/\D/g, ''); return d.length >= 9 && d.length <= 11; }],
      [$('[name="email"]', form), (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)],
    ].filter(([el]) => el);
    const bad = fields.filter(([el, test]) => !checkField(el, test(el.value)));
    if (bad.length) bad[0][0].focus();
    return !bad.length;
  };
  const liveRecheck = (form) => $$('[name="name"], [name="phone"], [name="email"]', form).forEach((el) => {
    el.addEventListener('input', () => { if (el.closest('.fld').classList.contains('is-err')) validateContact(form); });
  });

  /* ---------- quote form (3 steps) ---------- */
  const qf = $('#qf');
  if (qf) {
    const steps = $$('.qf__step', qf);
    const LABELS = ['Thiết bị và vật liệu', 'Công suất và sản phẩm đầu ra', 'Thông tin liên hệ'];
    const back = $('#qfBack');
    const next = $('#qfNext');
    let cur = 0;
    const pick = (name, val) => {
      const r = $$(`input[name="${name}"]`, qf).find((x) => x.value === val);
      if (r) r.checked = true;
    };
    const go = (i, dir = 1) => {
      cur = i;
      steps.forEach((s, j) => {
        s.classList.toggle('is-on', j === i);
        s.classList.toggle('is-back', j === i && dir < 0);
      });
      $('#qfBar').style.width = ((i + 1) / steps.length) * 100 + '%';
      $('#qfStepL').textContent = `Bước ${i + 1} / ${steps.length} · ${LABELS[i]}`;
      back.hidden = i === 0;
      next.firstChild.textContent = i === steps.length - 1 ? 'Gửi yêu cầu báo giá' : 'Tiếp tục';
    };
    // product pages preselect their own machine via <main data-product>
    const preset = qf.closest('[data-product]');
    if (preset) pick('product', preset.dataset.product);
    liveRecheck(qf);

    next.addEventListener('click', () => {
      if (cur < steps.length - 1) return go(cur + 1);
      if (!validateContact(qf)) return;
      const data = new FormData(qf);
      next.classList.add('is-loading');
      // Demo: no backend yet. Wire this to the quote endpoint (email / CRM) before launch.
      setTimeout(() => {
        next.classList.remove('is-loading');
        $('#doneName').textContent = data.get('name');
        const rows = [
          ['Thiết bị', data.get('product')],
          ['Vật liệu', data.get('material')],
          ['Công suất', data.get('capacity') + ' tấn/giờ'],
          ['Đầu ra (mm)', data.getAll('output').join(', ') || 'Chưa chọn'],
          ['Điện thoại', data.get('phone')],
        ];
        $('#doneSum').innerHTML = rows.map(([k]) => `<div><dt>${k}</dt><dd></dd></div>`).join('');
        $$('#doneSum dd').forEach((dd, k) => { dd.textContent = rows[k][1]; });
        steps.forEach((s) => s.classList.remove('is-on'));
        $('#qfNav').hidden = true;
        $('.qf__prog', qf).hidden = true;
        $('#qfStepL').hidden = true;
        const done = $('#qfDone');
        done.hidden = false;
        done.focus();
      }, 900);
    });
    back.addEventListener('click', () => go(cur - 1, -1));

    // "Báo giá" buttons elsewhere on the page preselect the product
    $$('[data-pick]').forEach((a) => a.addEventListener('click', () => { pick('product', a.dataset.pick); go(0); }));

    // hero quick bar (home) carries its choices into the full form
    const qbar = $('#qbar');
    if (qbar) {
      qbar.addEventListener('submit', (e) => {
        e.preventDefault();
        pick('product', $('#qb-type').value);
        pick('material', $('#qb-mat').value === 'Vật liệu xây dựng tái chế' ? 'Vật liệu xây dựng' : $('#qb-mat').value);
        pick('capacity', $('#qb-cap').value);
        go(1);
        quoteSec.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      });
    }
  }

  /* ---------- contact form (single step) ---------- */
  const cf = $('#cf');
  if (cf) {
    liveRecheck(cf);
    cf.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateContact(cf)) return;
      const btn = $('button[type="submit"]', cf);
      btn.classList.add('is-loading');
      // Demo: no backend yet. Wire this to the contact endpoint before launch.
      setTimeout(() => {
        btn.classList.remove('is-loading');
        $('#cfName').textContent = new FormData(cf).get('name');
        $('.cf__fields', cf).hidden = true;
        const done = $('#cfDone');
        done.hidden = false;
        done.focus();
      }, 800);
    });
  }

  /* ---------- home: active nav item follows the section in view ---------- */
  if (page === 'home') {
    const navLinks = $$('.nav__link[href^="./#"], .nav__link[href^="#"]');
    const secIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        navLinks.forEach((l) => l.classList.toggle('is-cur', l.getAttribute('href').endsWith('#' + en.target.id)));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((l) => { const s = $(l.getAttribute('href').replace('./', '')); if (s) secIO.observe(s); });
  }
})();
