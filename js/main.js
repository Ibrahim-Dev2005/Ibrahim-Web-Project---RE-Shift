/* ==========================================================================
   RE:SHIFT MOTORWORKS — main.js
   GSAP + ScrollTrigger + Lenis
   ========================================================================== */
(function () {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = $('.loader');

  // ---------- Build the vehicle in every slot ----------
  const cars = {};
  $$('[data-car]').forEach(host => { cars[host.dataset.car] = window.ReshiftCar.build(host); });
  $$('[data-wheel-icon]').forEach(i => { i.innerHTML = window.ReshiftCar.wheelIcon(i.dataset.wheelIcon); });
  $('.year').textContent = new Date().getFullYear();

  let lenis = null;
  // Fail gracefully if the animation libraries didn't load
  if (!window.gsap || !window.ScrollTrigger) {
    loader && loader.remove();
    document.body.classList.remove('is-loading');
    initStudio(); initCompare(); initFaq(); initModal(); initMenu(null);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });
  if (RM) document.documentElement.classList.add('rm');

  // ---------- Smooth scroll ----------
  if (!RM && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else (typeof target === 'number' ? window.scrollTo({ top: target }) : target.scrollIntoView());
  };

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      if (a.hasAttribute('data-open-form')) return;
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const el = id === '#top' ? 0 : $(id);
      if (el === null) return;
      e.preventDefault();
      document.body.classList.remove('menu-open');
      scrollTo(el);
    });
  });

  // ---------- Text prep ----------
  $$('[data-words]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w"><span>${w}</span></span>`).join(' ');
  });
  $$('.craft-word').forEach(el => {
    el.innerHTML = el.textContent.split('').map(c => `<span class="ch">${c}</span>`).join('');
  });

  // ---------- Intro: loader → hero ----------
  const hero = {
    car: $('.hero-car'), light: $('.hero-light'),
    lines: $$('.hero-title .line > span'),
    fades: [$('.hero-eyebrow'), $('.hero-copy'), ...$$('.hero-ctas .btn'), ...$$('.hud-item'), $('.badge')].filter(Boolean),
  };

  function introDone() {
    document.body.classList.remove('is-loading');
    lenis && lenis.start();
    heroScroll();
    ScrollTrigger.refresh();
  }

  if (RM) {
    loader.remove();
    gsap.set(hero.light, { opacity: 1 });
    introDone();
  } else {
    gsap.set('.nav', { autoAlpha: 0, y: -20 });
    gsap.set(hero.lines, { yPercent: 115 });
    gsap.set(hero.fades, { autoAlpha: 0, y: 24 });
    gsap.set(hero.car, { autoAlpha: 0 });

    const counter = { v: 0 };
    const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
    tl.to('.em-ring', { strokeDashoffset: 0, duration: .8 })
      .to('.em-r', { strokeDashoffset: 0, duration: .8 }, '-=.45')
      .to('.em-slash', { opacity: 1, duration: .4, stagger: .1 }, '-=.2')
      .to(counter, { v: 100, duration: 1.4, ease: 'power1.inOut', onUpdate: () => { $('.loader-count').textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0)
      .to('.loader-emblem', { scale: .9, opacity: 0, duration: .5 }, '+=.15')
      .to(loader, { yPercent: -100, duration: .9, ease: 'power4.inOut', onComplete: () => loader.remove() }, '-=.15')
      // light comes up and the car fades in — it stays put
      .to(hero.light, { opacity: 1, duration: 1.4, ease: 'power1.out' }, '-=.4')
      .to(hero.car, { autoAlpha: 1, duration: 1.4, ease: 'power1.inOut' }, '<.1')
      .to(hero.lines, { yPercent: 0, duration: .9, stagger: .14, ease: 'power4.out' }, '<.2')
      .to('.nav', { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, '<.2')
      .to(hero.fades, { autoAlpha: 1, y: 0, duration: .8, stagger: .07, ease: 'power3.out' }, '<.1')
      .add(introDone, '-=.6');
  }

  function heroScroll() {
    if (RM) return;
    gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 } })
      .to('.hero-content', { yPercent: -30, autoAlpha: 0, ease: 'none' }, 0)
      .to('.hero-hud', { autoAlpha: 0, ease: 'none' }, 0)
      .to(hero.light, { opacity: .3, ease: 'none' }, 0);
  }

  // ---------- Nav ----------
  const nav = $('#nav');
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const y = self.scroll();
      nav.classList.toggle('is-scrolled', y > 40);
      nav.classList.toggle('is-hidden', y > 600 && self.direction === 1 && !document.body.classList.contains('menu-open'));
      gsap.set('.scroll-progress span', { scaleX: self.progress });
    }
  });
  // ---------- Marquee (moves only with scroll) ----------
  if (!RM) gsap.to('.marquee-track', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 } });

  // ---------- Signature: pinned transformation (car stays still, finish changes) ----------
  (function transformation() {
    const host = cars.xform;
    const before = $('.car-img[data-paint="original"]', host), after = $('.car-img[data-paint="racing-green"]', host);
    const copies = $$('.stage-copy'), steps = $$('.xform-steps span');
    let stage = 0;
    const setStage = i => {
      if (i === stage) return;
      stage = i;
      copies.forEach((c, k) => {
        if (k === i) gsap.fromTo(c, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: .6, overwrite: true });
        else gsap.to(c, { autoAlpha: 0, y: -20, duration: .35, overwrite: true });
      });
      steps.forEach((s, k) => s.classList.toggle('is-active', k <= i));
    };

    if (RM) {
      copies.forEach(c => c.classList.add('is-active'));
      window.ReshiftCar.setPaint(host, 'racing-green');
      return;
    }

    gsap.set(before, { filter: 'sepia(0.55) saturate(0.6) brightness(0.9)' });
    gsap.set(after, { opacity: 0 });
    gsap.set($$('.anno', host), { autoAlpha: 0, y: 10 });

    const tl = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: '.xform-pin', start: 'top top', end: () => '+=' + innerHeight * 3,
        pin: true, scrub: 1, anticipatePin: 1,
        onUpdate: self => {
          const p = self.progress;
          setStage(p < .17 ? 0 : p < .66 ? 1 : 2);
          gsap.set('.xform-bar i', { scaleX: p });
        }
      }
    });

    tl.to({}, { duration: 9 }, 0)
      // stage 2 — call out the engineering
      .to(before, { opacity: .5, duration: .8 }, 1.5)
      .to('[data-anno="1"], [data-anno="2"]', { autoAlpha: 1, y: 0, duration: .5, stagger: .15 }, 1.9)
      .to('[data-anno="1"], [data-anno="2"]', { autoAlpha: 0, duration: .3 }, 3.6)
      .to('[data-anno="3"], [data-anno="4"]', { autoAlpha: 1, y: 0, duration: .5, stagger: .15 }, 3.8)
      .to('[data-anno="3"], [data-anno="4"]', { autoAlpha: 0, duration: .3 }, 5.4)
      // stage 3 — the finished car
      .to(before, { opacity: 1, duration: .8 }, 5.8)
      .to(after, { opacity: 1, duration: 1.2 }, 6.1)
      .to(before, { filter: 'sepia(0) saturate(1) brightness(1)', duration: 1.2 }, 6.1);
  })();

  // ---------- Craftsmanship: horizontal gallery ----------
  ScrollTrigger.matchMedia({
    '(min-width: 861px)': function () {
      if (RM) return;
      const track = $('.craft-track');
      const dist = () => track.scrollWidth - innerWidth;
      const h = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.craft', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
      });
      gsap.from('.craft-intro .line > span', { yPercent: 115, duration: .9, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: '.craft', start: 'top 70%' } });
      $$('.craft-photo').forEach(p => {
        gsap.fromTo($('img', p), { xPercent: -14 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
        gsap.from($$('.ch', p), { yPercent: 110, duration: .8, stagger: .035, ease: 'power4.out', scrollTrigger: { trigger: p, containerAnimation: h, start: 'left 60%' } });
        gsap.from($('figcaption .label', p), { autoAlpha: 0, y: 16, duration: .6, scrollTrigger: { trigger: p, containerAnimation: h, start: 'left 50%' } });
      });
    },
    '(max-width: 860px)': function () {
      if (RM) return;
      $$('.craft-photo').forEach(p => {
        gsap.from($$('.ch', p), { yPercent: 110, duration: .8, stagger: .035, ease: 'power4.out', scrollTrigger: { trigger: p, start: 'top 60%' } });
      });
    }
  });

  // Created after the pins so their start/end account for pin spacing
  $$('.nav-links a').forEach(a => {
    const sec = $(a.getAttribute('href'));
    if (!sec) return;
    ScrollTrigger.create({ trigger: sec, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
  });

  // ---------- Generic reveals ----------
  if (!RM) {
    $$('[data-reveal]').forEach(el => {
      gsap.from(el, { y: 40, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    $$('[data-lines]').forEach(el => {
      gsap.from($$('.line > span', el), { yPercent: 115, duration: .9, stagger: .12, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 85%' } });
    });
    $$('[data-words]').forEach(el => {
      gsap.from($$('.w > span', el), { yPercent: 115, duration: .85, stagger: .07, ease: 'power4.out', scrollTrigger: { trigger: el, start: 'top 80%' } });
    });
    $$('[data-clip]').forEach(el => {
      gsap.fromTo(el, { clipPath: 'inset(14% 8% 14% 8%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 35%', scrub: 1 } });
    });
    $$('[data-parallax]').forEach(img => {
      gsap.fromTo(img, { yPercent: -18 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('.service').forEach(s => {
      gsap.from(s, { y: 80, autoAlpha: 0, duration: 1.1, scrollTrigger: { trigger: s, start: 'top 85%' } });
      gsap.fromTo($('.service-img img', s), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: s, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.fromTo('.footer-mark span', { xPercent: 8 }, { xPercent: -4, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  // stat counters
  $$('[data-count]').forEach(el => {
    const o = { v: 0 }, end = +el.dataset.count;
    if (RM) { el.textContent = end; return; }
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  // ---------- Process timeline ----------
  if (!RM) {
    gsap.to('.tl-line i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 60%', end: 'bottom 60%', scrub: true } });
  } else gsap.set('.tl-line i', { scaleY: 1 });
  $$('.step').forEach((s, i) => {
    if (!RM) gsap.from($('div', s), { x: 40, autoAlpha: 0, duration: .9, scrollTrigger: { trigger: s, start: 'top 75%' } });
    ScrollTrigger.create({
      trigger: s, start: 'top 60%',
      onEnter: () => { s.classList.add('is-on'); $('.pc-now').textContent = '0' + (i + 1); },
      onLeaveBack: () => { s.classList.remove('is-on'); $('.pc-now').textContent = '0' + Math.max(1, i); }
    });
  });

  initStudio(); initCompare(); initFaq(); initModal(); initMenu(lenis);

  // Refresh once images settle so pin distances are right
  window.addEventListener('load', () => ScrollTrigger.refresh());

  // ======================================================================
  function initStudio() {
    const car = cars.studio, view = $('.studio-view'), sweep = $('.studio-sweep');
    const state = { paint: 'Racing Green', interior: 'Saddle Tan', wheel: 'Heritage Alloy' };
    $$('.opt-group').forEach(group => {
      const key = group.dataset.group;
      $$('.swatch', group).forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.getAttribute('aria-pressed') === 'true') return;
          $$('.swatch', group).forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
          $('.opt-current', group).textContent = btn.dataset.name;
          state[key] = btn.dataset.name;
          const v = btn.dataset.value;
          if (key === 'paint') window.ReshiftCar.setPaint(car, v);
          if (key === 'interior') {
            $('.studio-interior').style.setProperty('--int', v);
            $('.int-name').textContent = btn.dataset.name;
            window.gsap && gsap.fromTo('.studio-interior', { y: 8, opacity: .6 }, { y: 0, opacity: 1, duration: .5 });
          }
          $('.summary-text').textContent = `${state.paint} · ${state.interior} · ${state.wheel}`;
          sweep.classList.remove('run'); void sweep.offsetWidth; sweep.classList.add('run');
        });
      });
    });
    $('.studio-interior').style.setProperty('--int', '#b9844f');
    view.__state = state;
  }

  function initCompare() {
    const c = $('.compare'), range = $('.compare-range');
    if (!c) return;
    const set = v => c.style.setProperty('--pos', v + '%');
    range.addEventListener('input', () => set(range.value));
    set(50);
    if (window.gsap && !RM) {
      const o = { v: 88 };
      ScrollTrigger.create({
        trigger: c, start: 'top 70%', once: true,
        onEnter: () => gsap.to(o, { v: 50, duration: 1.8, ease: 'power3.inOut', onUpdate: () => { set(o.v); range.value = o.v; } })
      });
      set(88);
    }
  }

  function initFaq() {
    $$('.acc-item button').forEach(b => {
      b.addEventListener('click', () => {
        const item = b.closest('.acc-item'), open = !item.classList.contains('is-open');
        $$('.acc-item.is-open').forEach(o => { o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        item.classList.toggle('is-open', open);
        b.setAttribute('aria-expanded', String(open));
        setTimeout(() => window.ScrollTrigger && ScrollTrigger.refresh(), 550);
      });
    });
  }

  function initMenu(lenisRef) {
    const burger = $('.burger'), menu = $('#mobileMenu');
    burger.addEventListener('click', () => {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      lenisRef && (open ? lenisRef.stop() : lenisRef.start());
    });
    $$('a, button', menu).forEach(a => a.addEventListener('click', () => {
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
      menu.setAttribute('aria-hidden', 'true');
      lenisRef && lenisRef.start();
    }));
    $('.to-top').addEventListener('click', () => scrollToTop());
    function scrollToTop() { lenisRef ? lenisRef.scrollTo(0, { duration: 2 }) : window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }); }
  }

  function initModal() {
    const modal = $('#inquiry'), form = $('.form', modal), success = $('.form-success', modal);
    let lastFocus = null;

    const open = (trigger) => {
      lastFocus = trigger || document.activeElement;
      form.hidden = false; success.hidden = true; success.classList.remove('show');
      const svc = trigger && trigger.closest('[data-service]');
      if (svc) { form.service.value = svc.dataset.service; form.service.classList.add('has-value'); }
      if (trigger && trigger.hasAttribute('data-from-studio')) {
        const st = $('.studio-view').__state;
        form.service.value = 'Complete Transformation'; form.service.classList.add('has-value');
        if (!form.description.value) form.description.value = `Inspired by the Bespoke Studio: ${st.paint} exterior, ${st.interior} interior, ${st.wheel} wheels.`;
      }
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      document.body.style.overflow = 'hidden';
      setTimeout(() => form.elements['name'].focus({ preventScroll: true }), 450);
    };
    const close = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      lenis && lenis.start();
      document.body.style.overflow = '';
      lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
    };

    $$('[data-open-form]').forEach(b => b.addEventListener('click', e => { e.preventDefault(); open(b); }));
    $$('[data-close]', modal).forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const f = $$('button, input, select, textarea, a[href]', modal).filter(el => el.offsetParent !== null);
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    // validation
    const year = new Date().getFullYear();
    const rules = {
      name: v => v.trim().length >= 2 || 'Please enter your name.',
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || 'Please enter a valid email address.',
      vehicle: v => v.trim().length >= 2 || 'Tell us the make and model.',
      year: v => (/^\d{4}$/.test(v) && +v >= 1900 && +v <= year) || `Enter a year between 1900 and ${year}.`,
      service: v => !!v || 'Choose the service you are interested in.',
      description: v => v.trim().length >= 10 || 'A few words about your project (10+ characters).'
    };
    const check = (el) => {
      const r = rules[el.name]; if (!r) return true;
      const res = r(el.value), field = el.closest('.field');
      const ok = res === true;
      field.classList.toggle('is-invalid', !ok);
      field.classList.toggle('is-valid', ok);
      $('small', field).textContent = ok ? '' : res;
      el.setAttribute('aria-invalid', String(!ok));
      return ok;
    };
    $$('input, select, textarea', form).forEach(el => {
      el.addEventListener('blur', () => el.value && check(el));
      el.addEventListener('input', () => el.closest('.field') && el.closest('.field').classList.contains('is-invalid') && check(el));
    });
    form.service.addEventListener('change', () => { form.service.classList.toggle('has-value', !!form.service.value); check(form.service); });
    form.year.addEventListener('input', () => { form.year.value = form.year.value.replace(/\D/g, ''); });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fields = $$('input:not([type=checkbox]), select, textarea', form);
      let ok = fields.map(check).every(Boolean);
      const consent = form.consent.checked;
      $('.check-error', form).textContent = consent ? '' : 'Please confirm consent so we can reply.';
      ok = ok && consent;
      if (!ok) { const bad = $('[aria-invalid="true"]', form) || form.consent; bad.focus(); return; }

      form.classList.add('is-sending');
      const btnText = $('.btn-text', form); btnText.textContent = 'Sending…';
      try {
        const endpoint = form.dataset.endpoint;
        if (endpoint) {
          const res = await fetch(endpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('Request failed');
        } else {
          await new Promise(r => setTimeout(r, 1200)); // demo mode — no backend configured
        }
        form.reset(); form.service.classList.remove('has-value');
        $$('.field', form).forEach(f => f.classList.remove('is-valid', 'is-invalid'));
        form.hidden = true; success.hidden = false;
        requestAnimationFrame(() => success.classList.add('show'));
        $('button', success).focus();
      } catch (err) {
        $('.check-error', form).textContent = 'Something went wrong. Please try again or email studio@reshift.example.';
      } finally {
        form.classList.remove('is-sending'); btnText.textContent = 'Send inquiry';
      }
    });
  }
})();
