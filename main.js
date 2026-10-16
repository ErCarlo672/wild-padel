/* Wild Padel — interacción y animaciones (IIFE, sin módulos) */
(function () {
  'use strict';
  var W = (window.__WILD__ = window.__WILD__ || {});
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  function safe(fn, name) { try { fn(); } catch (e) { console.warn('[wild] ' + name + ' falló:', e); } }

  document.body.classList.add('is-loading');

  /* ---------- splash ---------- */
  function initSplash() {
    var splash = $('#splash'), bar = $('#splashBar'), count = $('#splashCount');
    if (!splash) return;
    var n = 0, done = false;
    function finish() {
      if (done) return; done = true;
      bar.style.width = '100%'; count.textContent = '100';
      setTimeout(function () { splash.classList.add('is-done'); document.body.classList.remove('is-loading'); }, 250);
    }
    var iv = setInterval(function () {
      n = Math.min(n + Math.random() * 14, 92);
      bar.style.width = n + '%'; count.textContent = Math.round(n);
    }, 90);
    window.addEventListener('load', function () { clearInterval(iv); setTimeout(finish, 300); });
    setTimeout(function () { clearInterval(iv); finish(); }, 3500); // red de seguridad
  }

  /* ---------- nav ---------- */
  function initNav() {
    var nav = $('#nav'), last = 0;
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > last && y > 600 && !$('#menu').classList.contains('is-open'));
      last = y;
    }, { passive: true });

    var burger = $('#burger'), menu = $('#menu');
    function toggle(open) {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }
    burger.addEventListener('click', function () { toggle(!menu.classList.contains('is-open')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { toggle(false); }); });
  }

  /* ---------- reveal ---------- */
  function initReveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, sibs = $$('.reveal', el.parentElement), i = sibs.indexOf(el);
        el.style.transitionDelay = Math.min(i, 6) * 0.08 + 's';
        el.classList.add('is-in'); io.unobserve(el);
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('is-in'); }); }, 6000);
  }

  /* ---------- cursor ---------- */
  function initCursor() {
    if (!fine) return;
    var c = $('#cursor'), x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener('pointermove', function (e) { x = e.clientX; y = e.clientY; }, { passive: true });
    (function tick() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      c.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      requestAnimationFrame(tick);
    })();
    $$('a, button, .tilt, canvas#racket3d').forEach(function (el) {
      el.addEventListener('mouseenter', function () { c.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { c.classList.remove('is-hover'); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine) return;
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate(' + dx * 0.25 + 'px,' + dy * 0.35 + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- 3D tilt ---------- */
  function initTilt() {
    if (!fine) return;
    $$('.tilt').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.transition = 'transform .1s linear, opacity 1s, border-color .4s';
        el.style.transform = 'perspective(900px) rotateX(' + (0.5 - py) * 12 + 'deg) rotateY(' + (px - 0.5) * 14 + 'deg) translateZ(0)';
        el.style.setProperty('--mx', px * 100 + '%'); el.style.setProperty('--my', py * 100 + '%');
      });
      el.addEventListener('mouseleave', function () {
        el.style.transition = 'transform .8s cubic-bezier(.22,1,.36,1), opacity 1s, border-color .4s';
        el.style.transform = '';
      });
    });
  }

  /* ---------- contadores ---------- */
  function initCounters() {
    var els = $$('[data-count]');
    if (!('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', pre = el.dataset.prefix || '', t0 = performance.now();
        io.unobserve(el);
        (function step(now) {
          var p = Math.min((now - t0) / 1600, 1), v = Math.round(to * (1 - Math.pow(1 - p, 4)));
          el.textContent = pre + String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + suf;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      });
    }, { threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- manifiesto palabra a palabra ---------- */
  function initManifesto() {
    var el = $('#manifesto');
    if (!el || el.children.length > 0) return;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    var words = $$('.w', el);
    function update() {
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height + vh * 0.4);
      var n = Math.floor(Math.max(0, Math.min(1, p)) * words.length * 1.1);
      words.forEach(function (w, i) { w.classList.toggle('on', i < n); });
    }
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  /* ---------- hero: scroll → cámara 3D ---------- */
  function initHero() {
    if (W.initCourt) W.initCourt();
    var hero = $('#hero'), content = $('.hero__content'), hud = $('.hero__hud'), hint = $('.hero__scroll');
    function update() {
      var r = hero.getBoundingClientRect(), span = hero.offsetHeight - innerHeight;
      var p = Math.max(0, Math.min(1, -r.top / span));
      if (W.setCourtProgress) W.setCourtProgress(p);
      var f = Math.max(0, 1 - p * 2.2);
      content.style.opacity = f; content.style.transform = 'translateY(' + (-p * 120) + 'px)';
      if (hud) hud.style.opacity = f;
      if (hint) hint.style.opacity = Math.max(0, 1 - p * 5);
    }
    window.addEventListener('scroll', update, { passive: true }); update();
  }

  /* ---------- instalaciones horizontal (GSAP) ---------- */
  function initFacilities() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    var mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', function () {
      var track = $('#facTrack'), pin = $('.facilities__pin');
      var imgs = $$('.panel__media img', track);
      var intro = pin.querySelector('.facilities__intro');
      function dist() { return Math.max(0, track.offsetLeft + track.offsetWidth - innerWidth); }
      gsap.to([intro, track], {
        x: function () { return -dist(); },
        ease: 'none',
        scrollTrigger: {
          trigger: '.facilities', pin: pin, scrub: 0.8, start: 'top top',
          end: function () { return '+=' + Math.max(600, dist()); },
          invalidateOnRefresh: true,
          onUpdate: function (st) { imgs.forEach(function (im, i) { im.style.setProperty('--px', (-st.progress * 16 + i * 2) + '%'); }); }
        }
      });
      return function () { gsap.set([intro, track], { x: 0 }); };
    });

    // Parallax foto academia
    gsap.fromTo('.academy__photo img', { yPercent: -12 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.academy__photo', start: 'top bottom', end: 'bottom top', scrub: true }
    });
    // Mega texto footer
    gsap.fromTo('.footer__mega', { xPercent: 2 }, {
      xPercent: -2, ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true }
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- carrusel 3D de reels ---------- */
  function initCarousel() {
    var wrap = $('#carousel'), ring = $('#ring');
    if (!wrap || !ring) return;
    var cards = $$('.reel', ring), n = cards.length, step = 360 / n;
    cards.forEach(function (c, i) { c.style.setProperty('--i', i); });
    var rot = 0, vel = -0.12, drag = false, moved = 0, lx = 0, visible = false;
    wrap.addEventListener('pointerdown', function (e) {
      drag = true; moved = 0; lx = e.clientX; wrap.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - lx; lx = e.clientX; moved += Math.abs(dx);
      vel = dx * 0.25; rot += vel;
    }, { passive: true });
    window.addEventListener('pointerup', function () { drag = false; wrap.classList.remove('is-drag'); });
    // Un arrastre no debe abrir el reel
    cards.forEach(function (c) {
      c.addEventListener('click', function (e) { if (moved > 8) e.preventDefault(); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(wrap);
    } else visible = true;
    (function tick() {
      requestAnimationFrame(tick);
      if (!visible) return;
      if (!drag) { vel += (-0.12 - vel) * 0.03; rot += vel; }
      ring.style.setProperty('--rot', rot + 'deg');
      cards.forEach(function (c, i) {
        var a = ((i * step + rot) % 360 + 360) % 360, d = Math.min(a, 360 - a) / 180;
        c.style.filter = 'brightness(' + (1 - d * 0.75).toFixed(2) + ')';
      });
    })();
  }

  /* ---------- clase de prueba → WhatsApp ---------- */
  function initTrial() {
    var f = $('#trialForm');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = f.nombre.value.trim();
      if (!name) { f.nombre.classList.add('is-error'); f.nombre.focus(); return; }
      f.nombre.classList.remove('is-error');
      var lvl = (f.querySelector('input[name=nivel]:checked') || {}).value || '';
      var prog = (f.querySelector('input[name=programa]:checked') || {}).value || '';
      var hor = f.horario.value.trim();
      var msg = '¡Hola Wild Padel! Soy ' + name + ' y me gustaría hacer una clase de prueba.\n' +
        '• Nivel: ' + lvl + '\n• Programa: ' + prog + (hor ? '\n• Disponibilidad: ' + hor : '');
      window.open('https://wa.me/34641101365?text=' + encodeURIComponent(msg), '_blank', 'noopener');
      $('#trialNote').textContent = '¡Listo! Si WhatsApp no se abrió, llámanos al 641 10 13 65.';
    });
    f.nombre.addEventListener('input', function () { f.nombre.classList.remove('is-error'); });
  }

  /* ---------- pala 3D ---------- */
  function initRacket() { if (W.initRacket) W.initRacket(); }

  function initMisc() { var y = $('#year'); if (y) y.textContent = new Date().getFullYear(); }

  function boot() {
    safe(initSplash, 'splash');
    safe(initNav, 'nav');
    safe(initReveal, 'reveal');
    safe(initHero, 'hero');
    safe(initFacilities, 'facilities');
    safe(initManifesto, 'manifesto');
    safe(initCounters, 'counters');
    safe(initCursor, 'cursor');
    safe(initMagnetic, 'magnetic');
    safe(initTilt, 'tilt');
    safe(initRacket, 'racket');
    safe(initCarousel, 'carousel');
    safe(initTrial, 'trial');
    safe(initMisc, 'misc');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
