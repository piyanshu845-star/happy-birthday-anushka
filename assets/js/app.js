/* ==========================================================================
   For Anushka — Sixteen
   Vanilla JS. No frameworks, no network calls, no analytics.
   ========================================================================== */
(() => {
  'use strict';
  window.__anushkaApp = true;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduceMotion = reduceMQ.matches;
  const params = new URLSearchParams(location.search);
  const forcedState = params.get('state');
  const root = document.documentElement;

  if (params.get('skip') === 'cover') {
    root.classList.add('returning');
    try { sessionStorage.setItem('anushka-cover', '1'); } catch (e) {}
  }
  const returning = root.classList.contains('returning');

  const live = $('#live');
  const toastEl = $('#toast');
  let toastTimer = 0;

  function announce(msg) {
    if (!live) return;
    live.textContent = '';
    window.setTimeout(() => { live.textContent = msg; }, 60);
  }
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
  }

  if (!returning) document.body.classList.add('cover-open');

  /* ==========================================================
     CONFETTI
     ========================================================== */
  const canvas = $('#confetti');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const COLORS = ['#c6a15b', '#e4c98f', '#f6ccd7', '#d98ca7', '#a4203a', '#7c2450', '#f7eeda', '#fdf8ec'];
  let cw = 0, ch = 0, dpr = 1, particles = [], raf = 0, last = 0;

  function sizeCanvas() {
    if (!canvas || !ctx) return;
    cw = window.innerWidth;
    ch = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  if (canvas) {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas, { passive: true });
  }

  function particleCap() { return window.innerWidth < 640 ? 140 : 320; }

  function makeParticle(x, y, o) {
    const angle = (o.angle + rand(-o.spread / 2, o.spread / 2)) * Math.PI / 180;
    const speed = o.power * rand(0.42, 1.18);
    const roll = Math.random();
    const shape = roll < o.ribbon ? 'ribbon' : roll < 0.47 ? 'rect' : roll < 0.62 ? 'circle' : 'star';
    return {
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      g: o.gravity * rand(0.82, 1.25),
      drag: o.drag,
      rot: rand(0, Math.PI * 2),
      vrot: rand(-0.22, 0.22),
      wob: rand(0, Math.PI * 2),
      wobS: rand(0.07, 0.17),
      w: (shape === 'ribbon' ? rand(3, 5.5) : rand(4, 8.5)) * o.scalar,
      h: (shape === 'ribbon' ? rand(13, 24) : rand(6, 13)) * o.scalar,
      color: pick(o.colors),
      shape,
      life: 0,
      ttl: rand(140, 220)
    };
  }

  function drawParticle(p) {
    const fade = 1 - Math.max(0, (p.life / p.ttl - 0.72) / 0.28);
    if (fade <= 0) return;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.color;
    if (p.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, p.w * 0.55, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.shape === 'star') {
      const s = p.w * 0.85;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.16, -s * 0.16, s, 0);
      ctx.quadraticCurveTo(s * 0.16, s * 0.16, 0, s);
      ctx.quadraticCurveTo(-s * 0.16, s * 0.16, -s, 0);
      ctx.quadraticCurveTo(-s * 0.16, -s * 0.16, 0, -s);
      ctx.fill();
    } else if (p.shape === 'ribbon') {
      const bend = Math.sin(p.wob) * p.w * 1.9;
      const w = p.w;
      const h = p.h * (0.55 + Math.abs(Math.cos(p.wob * 0.8)) * 0.65);
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2);
      ctx.quadraticCurveTo(bend, 0, w / 2, h / 2);
      ctx.quadraticCurveTo(bend * 0.25, 0, -w / 2, -h / 2);
      ctx.fill();
    } else {
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    }
    ctx.restore();
  }

  function tick(now) {
    if (!last) last = now;
    const dt = Math.min((now - last) / 16.6667, 2.4);
    last = now;
    ctx.clearRect(0, 0, cw, ch);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const dragStep = Math.pow(p.drag, dt);
      p.vx *= dragStep;
      p.vy = p.vy * dragStep + p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      p.wob += p.wobS * dt;
      p.life += dt;
      if (p.life > p.ttl || p.y > ch + 90 || p.x < -110 || p.x > cw + 110) {
        particles.splice(i, 1);
        continue;
      }
      drawParticle(p);
    }
    if (particles.length) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = 0;
      ctx.clearRect(0, 0, cw, ch);
    }
  }

  function burst(x, y, opts = {}) {
    if (!ctx || reduceMotion) return;
    const o = Object.assign({
      count: 84,
      angle: -90,
      spread: 78,
      power: 12,
      gravity: 0.19,
      drag: 0.986,
      scalar: 1,
      ribbon: 0.3,
      colors: COLORS
    }, opts);
    const cap = particleCap();
    let count = Math.max(0, Math.min(Math.round(o.count), cap));
    if (!count) return;
    if (particles.length + count > cap) particles.splice(0, particles.length + count - cap);
    for (let i = 0; i < count; i++) particles.push(makeParticle(x, y, o));
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(tick);
    }
  }

  /* ==========================================================
     PETALS
     ========================================================== */
  const PALETTE = [
    ['#f7dbe2', '#d987a2'],
    ['#f2c3d0', '#bf5e80'],
    ['#eab3c3', '#a64164'],
    ['#f8e7cd', '#d6b071'],
    ['#f9e3e8', '#c86e8d']
  ];

  function buildPetals() {
    if (reduceMotion) return;
    const counts = { cover: 11, hero: 10, wish: 7, finale: 9 };
    $$('.petals').forEach((layer) => {
      const name = layer.getAttribute('data-petals') || 'hero';
      const base = counts[name] || 8;
      const count = window.innerWidth < 640 ? Math.max(4, Math.round(base * 0.65)) : base;
      const frag = document.createDocumentFragment();
      for (let i = 0; i < count; i++) {
        const gold = i % 7 === 0;
        const el = document.createElement('span');
        el.className = 'petal ' + (gold ? 'petal--gold' : 'petal--petal');
        el.setAttribute('aria-hidden', 'true');
        const cols = pick(PALETTE);
        const size = rand(7, 15);
        el.style.setProperty('--x', rand(2, 96).toFixed(2) + 'vw');
        el.style.setProperty('--dur', rand(20, 36).toFixed(2) + 's');
        el.style.setProperty('--delay', (-rand(0, 36)).toFixed(2) + 's');
        el.style.setProperty('--drift', rand(-90, 90).toFixed(0) + 'px');
        el.style.setProperty('--spin', rand(-320, 320).toFixed(0) + 'deg');
        el.style.setProperty('--s', size.toFixed(1) + 'px');
        el.style.setProperty('--s2', (size * rand(1.25, 1.75)).toFixed(1) + 'px');
        el.style.setProperty('--op', rand(0.26, 0.52).toFixed(2));
        el.style.setProperty('--tint', cols[0]);
        el.style.setProperty('--tint-2', cols[1]);
        frag.appendChild(el);
      }
      layer.appendChild(frag);
    });
  }

  /* ==========================================================
     COVER
     ========================================================== */
  const cover = $('#cover');
  const openBtn = $('#openBtn');
  const hero = $('#hero');
  const heroName = $('#heroName');
  const musicBtn = $('#musicBtn');
  const musicTip = $('#musicTip');
  let coverOpening = false;
  let heroReady = false;

  function setHeroReady() {
    if (heroReady || !hero) return;
    heroReady = true;
    hero.classList.add('is-ready');
  }

  function revealMusic(showTip = false) {
    if (!musicBtn) return;
    musicBtn.hidden = false;
    if (!showTip) return;
    if (reduceMotion) return;
    window.setTimeout(() => {
      if (!musicTip || !musicBtn || musicBtn.classList.contains('is-on')) return;
      musicTip.hidden = false;
      window.setTimeout(() => { musicTip.hidden = true; }, 7000);
    }, 2200);
  }

  function openCover() {
    if (coverOpening || !cover) return;
    coverOpening = true;
    try { sessionStorage.setItem('anushka-cover', '1'); } catch (e) {}
    cover.classList.add('is-opening');
    cover.setAttribute('aria-hidden', 'true');

    const rect = openBtn ? openBtn.getBoundingClientRect() : { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 0, height: 0 };
    window.setTimeout(() => {
      burst(rect.left + rect.width / 2, rect.top + rect.height / 2, {
        count: window.innerWidth < 640 ? 48 : 70,
        spread: 96,
        power: 13,
        gravity: 0.2
      });
    }, reduceMotion ? 0 : 480);

    window.setTimeout(setHeroReady, reduceMotion ? 80 : 950);
    revealMusic(true);
    announce('The scrapbook is open. Happy birthday, Anushka.');

    const done = () => {
      document.body.classList.remove('cover-open');
      cover.classList.add('is-gone');
      cover.setAttribute('aria-hidden', 'true');
      if (heroName) {
        heroName.setAttribute('tabindex', '-1');
        heroName.focus({ preventScroll: true });
      }
    };
    window.setTimeout(done, reduceMotion ? 300 : 1450);
  }

  if (cover && openBtn) {
    openBtn.addEventListener('click', openCover);
  }

  if (!returning) {
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab' || coverOpening || !cover || cover.classList.contains('is-gone')) return;
      event.preventDefault();
      if (openBtn) openBtn.focus();
    });
  }

  if (returning) {
    document.body.classList.remove('cover-open');
    setHeroReady();
    revealMusic(false);
    if (cover) cover.setAttribute('aria-hidden', 'true');
  } else if (openBtn) {
    window.setTimeout(() => openBtn.focus({ preventScroll: true }), 240);
  }

  if (reduceMotion) {
    const note = () => toast('Motion is off — your device asked for the quiet version. Everything still works.');
    window.setTimeout(note, returning ? 900 : 2600);
  }

  /* ==========================================================
     MUSIC — WebAudio music box, public-domain melody
     ========================================================== */
  const BEAT = 60 / 104;
  const MELODY = [
    [67, 0, 0.5], [67, 0.5, 0.5], [69, 1, 1], [67, 2, 1], [72, 3, 1], [71, 4, 2],
    [67, 6.5, 0.5], [67, 7, 0.5], [69, 7.5, 1], [67, 8.5, 1], [74, 9.5, 1], [72, 10.5, 2],
    [67, 13, 0.5], [67, 13.5, 0.5], [79, 14, 1], [76, 15, 1], [72, 16, 1], [71, 17, 1], [69, 18, 2],
    [77, 20.5, 0.5], [77, 21, 0.5], [76, 21.5, 1], [72, 22.5, 1], [74, 23.5, 1], [72, 24.5, 2]
  ];
  const LOOP_BEATS = 27.4;
  let audioCtx = null, masterGain = null, sessionGain = null;
  let musicPlaying = false, loopTimer = 0;
  const oscillators = new Set();

  function updateMusicButton() {
    if (!musicBtn) return;
    musicBtn.classList.toggle('is-on', musicPlaying);
    musicBtn.setAttribute('aria-pressed', String(musicPlaying));
    musicBtn.setAttribute('aria-label', musicPlaying ? 'Pause birthday music' : 'Play birthday music');
    const label = musicBtn.querySelector('.music__label');
    if (label) label.textContent = musicPlaying ? 'music on' : 'music off';
  }

  function ensureAudio() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) throw new Error('WebAudio unsupported');
    if (!audioCtx) {
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.34;
      const delay = audioCtx.createDelay(1.2);
      delay.delayTime.value = 0.27;
      const feedback = audioCtx.createGain();
      feedback.gain.value = 0.16;
      const wet = audioCtx.createGain();
      wet.gain.value = 0.18;
      masterGain.connect(audioCtx.destination);
      masterGain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(audioCtx.destination);
    }
    return audioCtx;
  }

  function playNote(midi, when, duration) {
    if (!audioCtx || !sessionGain) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const ring = Math.max(0.7, duration * 1.9);
    const noteGain = audioCtx.createGain();
    noteGain.gain.setValueAtTime(0.0001, when);
    noteGain.gain.exponentialRampToValueAtTime(0.12, when + 0.009);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, when + ring);
    noteGain.connect(sessionGain);

    [
      { ratio: 1, amp: 0.6, decay: 1 },
      { ratio: 2.01, amp: 0.22, decay: 0.62 },
      { ratio: 3.0, amp: 0.11, decay: 0.38 },
      { ratio: 5.02, amp: 0.045, decay: 0.2 }
    ].forEach((partial) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * partial.ratio, when);
      const end = when + ring * partial.decay;
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(partial.amp, when + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain);
      gain.connect(noteGain);
      osc.start(when);
      osc.stop(end + 0.06);
      oscillators.add(osc);
      osc.onended = () => {
        oscillators.delete(osc);
        try { gain.disconnect(); } catch (e) {}
      };
    });
    window.setTimeout(() => {
      try { noteGain.disconnect(); } catch (e) {}
    }, (ring + 0.4) * 1000);
  }

  function scheduleLoop() {
    if (!musicPlaying || !audioCtx) return;
    const start = audioCtx.currentTime + 0.09;
    MELODY.forEach(([midi, beat, beats]) => playNote(midi, start + beat * BEAT, beats * BEAT));
    loopTimer = window.setTimeout(scheduleLoop, LOOP_BEATS * BEAT * 1000 - 150);
  }

  async function startMusic() {
    if (musicPlaying) return;
    try {
      const ctx = ensureAudio();
      await ctx.resume();
      sessionGain = ctx.createGain();
      sessionGain.gain.value = 0.9;
      sessionGain.connect(masterGain);
      musicPlaying = true;
      updateMusicButton();
      scheduleLoop();
    } catch (e) {
      musicPlaying = false;
      updateMusicButton();
      toast('Sound is blocked by the browser — tap music once more.');
      announce('Music could not start. Please try the music button again.');
    }
  }

  function stopMusic() {
    if (!musicPlaying && !sessionGain) return;
    musicPlaying = false;
    clearTimeout(loopTimer);
    loopTimer = 0;
    const now = audioCtx ? audioCtx.currentTime : 0;
    oscillators.forEach((osc) => { try { osc.stop(now); } catch (e) {} });
    oscillators.clear();
    if (sessionGain) {
      const dying = sessionGain;
      sessionGain = null;
      try {
        dying.gain.cancelScheduledValues(now);
        dying.gain.setValueAtTime(dying.gain.value, now);
        dying.gain.linearRampToValueAtTime(0.0001, now + 0.08);
      } catch (e) {}
      window.setTimeout(() => { try { dying.disconnect(); } catch (e) {} }, 200);
    }
    updateMusicButton();
  }

  if (musicBtn) {
    if (!(window.AudioContext || window.webkitAudioContext)) {
      musicBtn.disabled = true;
      musicBtn.setAttribute('aria-label', 'Music is not supported in this browser');
    } else {
      musicBtn.addEventListener('click', async () => {
        if (musicPlaying) {
          stopMusic();
          announce('Music off.');
        } else {
          await startMusic();
          if (musicPlaying) announce('Music playing — a music-box Happy Birthday.');
        }
        if (musicTip) musicTip.hidden = true;
      });
    }
    updateMusicButton();
  }

  /* ==========================================================
     REVEALS + LETTER DRAW
     ========================================================== */
  const SIGNATURE_PATH = "M13.0 24.0 L17.0 19.0 L19.0 16.0 L20.0 14.0 L21.0 11.0 L21.0 9.0 L20.0 8.0 L18.0 9.0 L17.0 11.0 L15.0 19.0 L12.0 28.0 L9.0 35.0 L8.0 38.0 L8.0 40.0 L9.0 41.0 L11.0 40.0 L12.0 37.0 L13.0 28.0 L14.0 29.0 L16.0 29.0 L18.0 28.0 L19.0 27.0 L21.0 24.0 M28.1 20.0 L26.1 20.0 L24.1 21.0 L23.1 22.0 L22.1 24.0 L22.1 26.0 L23.1 28.0 L25.1 29.0 L27.1 29.0 L29.1 28.0 L30.1 27.0 L31.1 25.0 L31.1 23.0 L30.1 21.0 L28.1 20.0 L27.1 21.0 L27.1 23.0 L28.1 25.0 L30.1 26.0 L33.1 26.0 L35.1 25.0 L36.1 24.0 M37.2 24.0 L39.2 21.0 L40.2 19.0 L40.2 21.0 L43.2 21.0 L44.2 22.0 L44.2 24.0 L43.2 27.0 L43.2 28.0 L44.2 29.0 L45.2 29.0 L47.2 28.0 L48.2 27.0 L50.2 24.0 M68.4 29.0 L70.4 28.0 L73.4 25.0 L76.4 21.0 L80.4 14.0 L83.4 8.0 L83.4 29.0 L82.4 26.0 L80.4 23.0 L78.4 21.0 L75.4 19.0 L73.4 19.0 L72.4 20.0 L72.4 22.0 L73.4 24.0 L75.4 26.0 L78.4 28.0 L81.4 29.0 L86.4 29.0 M89.5 24.0 L91.5 21.0 L93.5 20.0 L94.5 21.0 L94.5 22.0 L93.5 26.0 L92.5 29.0 M93.5 26.0 L94.5 24.0 L96.5 21.0 L98.5 20.0 L100.5 20.0 L101.5 21.0 L101.5 23.0 L100.5 26.0 L100.5 28.0 L101.5 29.0 L102.5 29.0 L104.5 28.0 L105.5 27.0 L107.5 24.0 M108.6 24.0 L110.6 20.0 L108.6 26.0 L108.6 28.0 L109.6 29.0 L111.6 29.0 L113.6 28.0 L115.6 26.0 L117.6 23.0 M118.6 20.0 L116.6 26.0 L116.6 28.0 L117.6 29.0 L118.6 29.0 L120.6 28.0 L121.6 27.0 L123.6 24.0 M124.7 24.0 L126.7 21.0 L127.7 19.0 L127.7 21.0 L129.7 24.0 L130.7 26.0 L130.7 28.0 L128.7 29.0 M124.7 28.0 L126.7 29.0 L130.7 29.0 L132.7 28.0 L133.7 27.0 L135.7 24.0 M136.8 24.0 L138.8 21.0 L141.8 16.0 L142.8 14.0 L143.8 11.0 L143.8 9.0 L142.8 8.0 L140.8 9.0 L139.8 11.0 L138.8 15.0 L137.8 21.0 L136.8 29.0 M136.8 29.0 L137.8 26.0 L138.8 24.0 L140.8 21.0 L142.8 20.0 L144.8 20.0 L145.8 21.0 L145.8 23.0 L144.8 26.0 L144.8 28.0 L145.8 29.0 L146.8 29.0 L148.8 28.0 L149.8 27.0 L151.8 24.0 M152.9 24.0 L154.9 21.0 L157.9 16.0 L158.9 14.0 L159.9 11.0 L159.9 9.0 L158.9 8.0 L156.9 9.0 L155.9 11.0 L154.9 15.0 L153.9 21.0 L152.9 29.0 M152.9 29.0 L153.9 26.0 L154.9 24.0 L156.9 21.0 L158.9 20.0 L160.9 20.0 L161.9 21.0 L161.9 23.0 L159.9 24.0 L156.9 24.0 M156.9 24.0 L158.9 25.0 L159.9 28.0 L160.9 29.0 L161.9 29.0 L163.9 28.0 L164.9 27.0 L166.9 24.0 M177.0 23.0 L176.0 21.0 L174.0 20.0 L172.0 20.0 L170.0 21.0 L169.0 22.0 L168.0 24.0 L168.0 26.0 L169.0 28.0 L171.0 29.0 L173.0 29.0 L175.0 28.0 L176.0 26.0 L178.0 20.0 L177.0 25.0 L177.0 28.0 L178.0 29.0 L179.0 29.0 L181.0 28.0 L182.0 27.0 L184.0 24.0";
  const scriptPath = $('.letter-script__path');
  if (scriptPath && SIGNATURE_PATH) {
    scriptPath.setAttribute('d', SIGNATURE_PATH);
    try {
      const len = scriptPath.getTotalLength();
      scriptPath.style.setProperty('--len', String(len));
    } catch (e) {}
  }

  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add('is-inview');
        if (el.classList.contains('thing')) {
          const list = Array.from(el.parentElement.children);
          const idx = list.indexOf(el);
          el.style.transitionDelay = Math.min(idx * 35, 280) + 'ms';
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-inview'));
  }

  /* ==========================================================
     COUNTDOWN — fixed to 25 October 2026, IST
     ========================================================== */
  const TARGET = Date.parse('2026-10-25T00:00:00+05:30');
  const END = Date.parse('2026-10-26T00:00:00+05:30');
  const cd = {
    days: $('#cdDays'),
    hours: $('#cdHours'),
    mins: $('#cdMins'),
    secs: $('#cdSecs')
  };
  const timerEl = $('#countdownTimer');
  const stateEl = $('#countdownState');
  const stateScript = $('#stateScript');
  const stateCopy = $('#stateCopy');
  const noteEl = $('#countdownNote');
  const waitTitle = $('#waitTitle');
  const cdAnnounce = $('#countdownAnnounce');
  let cdState = '';
  let tickTimers = {};

  function effectiveNow() {
    if (forcedState === 'today') return TARGET + 60 * 60 * 1000;
    if (forcedState === 'after') return END + 60 * 60 * 1000;
    return Date.now();
  }

  function setDigit(key, value) {
    const el = cd[key];
    if (!el) return;
    const next = pad2(value);
    if (el.textContent === next) return;
    el.textContent = next;
    el.classList.add('is-tick');
    clearTimeout(tickTimers[key]);
    tickTimers[key] = window.setTimeout(() => el.classList.remove('is-tick'), 230);
  }

  function setCdState(mode) {
    if (mode === cdState) return;
    cdState = mode;
    if (mode === 'before') {
      if (timerEl) timerEl.hidden = false;
      if (stateEl) stateEl.hidden = true;
      if (noteEl) { noteEl.hidden = false; noteEl.textContent = 'Something good is already on its way.'; }
      if (waitTitle) waitTitle.innerHTML = 'Until the <em>25th</em>.';
      if (cdAnnounce) cdAnnounce.textContent = 'Countdown to Anushka’s sixteenth birthday on 25 October 2026, midnight India time.';
    } else if (mode === 'today') {
      if (timerEl) timerEl.hidden = true;
      if (stateEl) stateEl.hidden = false;
      if (noteEl) noteEl.hidden = true;
      if (stateScript) stateScript.textContent = 'it’s your day.';
      if (stateCopy) stateCopy.textContent = 'The 25th is here. Take it slow — the page isn’t going anywhere.';
      if (waitTitle) waitTitle.innerHTML = 'It’s the <em>25th</em>.';
      if (cdAnnounce) cdAnnounce.textContent = 'It’s your day, Anushka. Happy birthday.';
    } else {
      if (timerEl) timerEl.hidden = true;
      if (stateEl) stateEl.hidden = false;
      if (noteEl) noteEl.hidden = true;
      if (stateScript) stateScript.textContent = 'the year hasn’t.';
      if (stateCopy) stateCopy.textContent = 'Sixteen is still new. Stay a while.';
      if (waitTitle) waitTitle.innerHTML = 'The 25th has <em>passed</em>.';
      if (cdAnnounce) cdAnnounce.textContent = 'The 25th has passed. The year hasn’t.';
    }
  }

  function tickCountdown() {
    const now = effectiveNow();
    if (now < TARGET) {
      setCdState('before');
      let diff = Math.max(0, TARGET - now);
      const days = Math.floor(diff / 86400000);
      diff -= days * 86400000;
      const hours = Math.floor(diff / 3600000);
      diff -= hours * 3600000;
      const mins = Math.floor(diff / 60000);
      diff -= mins * 60000;
      const secs = Math.floor(diff / 1000);
      setDigit('days', days);
      setDigit('hours', hours);
      setDigit('mins', mins);
      setDigit('secs', secs);
    } else if (now < END) {
      setCdState('today');
    } else {
      setCdState('after');
    }
  }

  if (timerEl) {
    tickCountdown();
    window.setInterval(tickCountdown, 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tickCountdown();
    });
  }

  /* ==========================================================
     CAKE
     ========================================================== */
  const wishSection = $('#wish');
  const cakeStage = $('#cakeStage');
  const cakeBtn = $('#cake');
  const wishBtn = $('#wishBtn');
  const relightBtn = $('#relightBtn');
  const wishResult = $('#wishResult');
  const wishFine = $('#wishFine');
  let blown = false;

  function blowCandles() {
    if (blown || !wishSection) return;
    blown = true;
    wishSection.classList.add('is-blown');
    if (wishBtn) wishBtn.hidden = true;
    if (relightBtn) relightBtn.hidden = true;
    if (cakeBtn) cakeBtn.disabled = true;

    const cakeRect = cakeStage ? cakeStage.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
    window.setTimeout(() => {
      burst(cakeRect.left + cakeRect.width / 2, cakeRect.top + cakeRect.height * 0.38, {
        count: window.innerWidth < 640 ? 70 : 110,
        spread: 100,
        power: 14,
        gravity: 0.2
      });
    }, reduceMotion ? 0 : 320);

    window.setTimeout(() => {
      if (wishResult) {
        wishResult.hidden = false;
        wishResult.setAttribute('tabindex', '-1');
        wishResult.focus({ preventScroll: true });
      }
      if (wishFine) wishFine.textContent = 'That’s it. Sixteen, officially. The wish is yours to keep.';
      if (relightBtn) relightBtn.hidden = false;
      announce('Wish sealed. Nobody saw it, nobody knows — now go make it embarrassingly true.');
    }, reduceMotion ? 60 : 700);
  }

  function relightCandles() {
    if (!blown) return;
    blown = false;
    if (wishSection) wishSection.classList.remove('is-blown');
    if (wishResult) wishResult.hidden = true;
    if (relightBtn) relightBtn.hidden = true;
    if (cakeBtn) cakeBtn.disabled = false;
    if (wishBtn) {
      wishBtn.hidden = false;
      wishBtn.focus({ preventScroll: true });
    }
    if (wishFine) wishFine.textContent = '(Yes, you’re allowed a second wish.)';
    announce('Candles lit again. Take your time.');
  }

  if (wishBtn) wishBtn.addEventListener('click', blowCandles);
  if (cakeBtn) cakeBtn.addEventListener('click', blowCandles);
  if (relightBtn) relightBtn.addEventListener('click', relightCandles);

  /* ==========================================================
     FINALE CONFETTI
     ========================================================== */
  const confettiBtn = $('#confettiBtn');
  if (confettiBtn) {
    confettiBtn.addEventListener('click', () => {
      const r = confettiBtn.getBoundingClientRect();
      burst(r.left + r.width / 2, r.top + r.height / 2, {
        count: window.innerWidth < 640 ? 70 : 100,
        spread: 110,
        power: 13,
        gravity: 0.19
      });
      announce('Confetti, again. Happy birthday, Anushka.');
    });
  }

  /* ==========================================================
     LIGHTBOX
     ========================================================== */
  const photos = [
    { file: 'assets/photos/anushka-02.jpg', alt: 'Anushka laughing in a bright pink mirror-work outfit, hand near her face, silver jewellery catching the light.', caption: 'That laugh could light up the whole street.' },
    { file: 'assets/photos/anushka-03.jpg', alt: 'Anushka in a pink mirror-work outfit and silver jewellery, eyes soft, adjusting her headpiece.', caption: 'A quiet moment in full colour.' },
    { file: 'assets/photos/anushka-04.jpg', alt: 'Close-up of Anushka in a black and gold outfit, touching a large silver jhumka earring.', caption: 'Jhumkas, and a smile to match.' },
    { file: 'assets/photos/anushka-05.jpg', alt: 'Anushka in a full-length orange peacock-pattern lehenga, looking back over her shoulder in a garden lit for the evening.', caption: 'Peacock hour.' },
    { file: 'assets/photos/anushka-06.jpg', alt: 'Anushka smiling widely in a yellow lehenga at night, mehndi visible on her hand, warm lights behind her.', caption: 'Mehndi, marigold, and that smile.' },
    { file: 'assets/photos/anushka-07.jpg', alt: 'Anushka in a yellow lehenga looking back over her shoulder on a lamp-lit garden path at night.', caption: 'A look back, all lit up.' },
    { file: 'assets/photos/anushka-08.jpg', alt: 'Anushka in a yellow embroidered kurta with sunglasses on her head, hoop earrings, and palm trees behind her.', caption: 'Palm-shade and yellow sunshine.' },
    { file: 'assets/photos/anushka-09.jpg', alt: 'Anushka in a striped tee and black-and-white floral scarf, outdoors in warm daylight.', caption: 'Stripes and open air.' },
    { file: 'assets/photos/anushka-10.jpg', alt: 'Anushka in a navy floral top with a white bow clip, heart and cloud doodles floating across the selfie.', caption: 'A little soft, a little sparkle.' },
    { file: 'assets/photos/anushka-11.jpg', alt: 'Anushka in a blue school shirt and tie, long wavy hair, heart stickers across the frame.', caption: 'School-day glow.' }
  ];

  const dialog = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const lbCap = $('#lightboxCaption');
  const lbCount = $('#lightboxCount');
  const lbClose = $('#lightboxClose');
  const lbPrev = $('#lightboxPrev');
  const lbNext = $('#lightboxNext');
  let current = 0;
  let lastTrigger = null;
  let touchX = null;

  function preloadAround(index) {
    [index + 1, index - 1].forEach((i) => {
      const p = photos[(i + photos.length) % photos.length];
      if (p) { const im = new Image(); im.src = p.file; }
    });
  }

  function renderPhoto(index, focusFrame = false) {
    if (!lbImg) return;
    current = (index + photos.length) % photos.length;
    const p = photos[current];
    const frame = lbImg.parentElement;
    if (frame) frame.classList.add('is-loading');
    lbImg.src = p.file;
    lbImg.alt = p.alt;
    if (lbCap) lbCap.textContent = p.caption;
    if (lbCount) lbCount.textContent = pad2(current + 1) + ' / ' + pad2(photos.length);
    const done = () => {
      if (frame) frame.classList.remove('is-loading');
      lbImg.removeEventListener('load', done);
    };
    lbImg.addEventListener('load', done);
    if (lbImg.complete) done();
    if (focusFrame && lbImg) lbImg.focus({ preventScroll: true });
    preloadAround(current);
  }

  function openLightbox(index, trigger) {
    if (!dialog || !lbImg) return;
    lastTrigger = trigger || null;
    renderPhoto(index);
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    document.body.classList.add('lightbox-open');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => { if (lbClose) lbClose.focus({ preventScroll: true }); }, 30);
    announce('Photo ' + (current + 1) + ' of ' + photos.length + '. ' + photos[current].caption);
  }

  function closeLightbox() {
    if (!dialog) return;
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
    document.body.classList.remove('lightbox-open');
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  function stepLightbox(dir) {
    if (!dialog || !dialog.open) return;
    renderPhoto(current + dir);
    announce('Photo ' + (current + 1) + ' of ' + photos.length + '. ' + photos[current].caption);
  }

  $$('[data-index]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (!dialog || typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      openLightbox(Number(link.getAttribute('data-index')) || 0, link);
    });
  });

  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lbPrev) lbPrev.addEventListener('click', () => stepLightbox(-1));
  if (lbNext) lbNext.addEventListener('click', () => stepLightbox(1));

  if (dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeLightbox();
    });
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeLightbox();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('lightbox-open');
      document.body.style.overflow = '';
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); stepLightbox(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); stepLightbox(1); }
    });
    dialog.addEventListener('touchstart', (event) => {
      touchX = event.changedTouches[0].clientX;
    }, { passive: true });
    dialog.addEventListener('touchend', (event) => {
      if (touchX === null) return;
      const dx = event.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 42) stepLightbox(dx > 0 ? -1 : 1);
      touchX = null;
    }, { passive: true });
  }

  /* ==========================================================
     MISC
     ========================================================== */
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (musicTip && !musicTip.hidden) musicTip.hidden = true;
  });

  if (musicTip) {
    musicTip.addEventListener('click', () => { musicTip.hidden = true; });
  }
  window.addEventListener('scroll', () => {
    if (musicTip && !musicTip.hidden) musicTip.hidden = true;
  }, { passive: true, once: true });

  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', (event) => {
      reduceMotion = event.matches;
      if (reduceMotion) {
        $$('.petal').forEach((el) => el.remove());
      }
    });
  }

  buildPetals();
  updateMusicButton();
})();
