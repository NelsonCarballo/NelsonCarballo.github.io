/* =========================================================================
   PERSONAJE — Nelson recorre la página mientras haces scroll.
   Va de "parada" en "parada" (encima de elementos reales), camina, baja en
   paracaídas, sube con cohetes y en cada parada interactúa con la sección.
   ========================================================================= */
(function () {
  'use strict';

  const Sprite = window.NelsonSprite;
  const layer = document.getElementById('actor-layer');
  if (!Sprite || !layer) return;

  const actor = document.getElementById('actor');
  const canvas = actor.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const hit = actor.querySelector('.actor__hit');
  const bubble = document.getElementById('actor-bubble');
  const bubbleText = bubble.querySelector('.ab__text');
  const toggleBtn = document.getElementById('toggle-actor');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const react = (name, on) => { if (window.Portfolio) window.Portfolio.react(name, on); };

  const first = s => () => document.querySelector(s);
  // punto de cada paso del proceso
  const stepPoint = i => {
    const card = document.querySelectorAll('#steps > *')[i];
    if (!card) return null;
    const r = docRect(card);
    const lane = document.getElementById('steps-lane');
    if (lane && lane.getClientRects().length) {
      const L = docRect(lane);
      return { x: r.x + r.w / 2, y: L.y + L.h };
    }
    return { x: r.x + r.w * (i % 2 ? 0.8 : 0.2), y: r.y };
  };
  const last = s => () => { const l = document.querySelectorAll(s); return l[l.length - 1]; };
  // última tarjeta de la primera fila de una grilla
  const lastInFirstRow = s => () => {
    const l = Array.from(document.querySelectorAll(s + ' > *'));
    if (!l.length) return null;
    const top = l[0].offsetTop;
    return l.filter(e => Math.abs(e.offsetTop - top) < 4).pop();
  };

  /* Paradas, de arriba hacia abajo.
     fx / fxm = posición horizontal relativa al elemento (escritorio / móvil)
     pose = lo que hace al llegar · say = lo que dice · react = efecto en la página */
  const STOPS = [
    { el: first('#stage-seat'), fx: .5, pose: 'type', say: '¡Hola! Soy Nelson 👋 Edito videos y diseño miniaturas. Baja y te enseño mi trabajo.', sayMs: 5600 },
    { el: () => { const l = document.querySelectorAll('#services > *'); return l[Math.min(1, l.length - 1)]; }, fx: .15, fxm: .7, pose: 'wave', say: 'Esto es lo que puedo hacer por tu canal 💪' },
    { el: last('#services > *'), fx: .7, fxm: .7, pose: 'idle' },
    { el: first('#carousel'), fx: .42, fxm: .8, pose: 'idle', say: 'Algunos canales con los que trabajo 🤝' },
    { el: first('#carousel'), fx: .72, fxm: .25, pose: 'point', face: -1 },
    { el: first('#reel-frame'), fx: .93, fxm: .85, pose: 'point', face: -1, say: 'Este es mi showreel. ¡Dale play! 🎬' },
    { el: first('#reel-frame'), fx: .55, fxm: .2, pose: 'point', face: 1, react: 'reel' },
    { el: first('#thumb-toolbar'), fx: .95, fxm: .86, pose: 'point', face: -1, say: 'Toca cualquier miniatura para verla en grande 🔍' },
    { el: first('#thumb-toolbar'), fx: .6, fxm: .55, pose: 'point', face: 1, react: 'thumbs' },
    { el: first('#compare'), fx: .92, fxm: .85, pose: 'idle' },
    { el: first('#compare'), fx: .44, fxm: .3, pose: 'point', face: 1, say: 'Arrastra la barra y mira la diferencia ↔', react: 'compare' },
    { el: first('#video-grid'), fx: .55, fxm: .2, pose: 'idle' },
    { el: lastInFirstRow('#video-grid'), fx: .9, fxm: .8, pose: 'sit', prop: 'popcorn', say: 'Ponte cómodo, que empieza la función 🍿' },
    // Proceso: en escritorio camina por un carril DEBAJO de las tarjetas, del paso 1 al 4.
    // En pantallas chicas va saltando de tarjeta en tarjeta.
    ...[0, 1, 2, 3].map(i => ({
      at: () => stepPoint(i),
      pose: i === 3 ? 'wave' : 'idle',
      say: i === 0 ? 'Así trabajamos, paso a paso 👇' : (i === 3 ? '¡Y listo para publicar! 🚀' : null)
    })),
    { el: first('#contact-card'), fx: .3, fxm: .2, pose: 'idle' },
    { el: first('#contact-card'), fx: .86, fxm: .8, pose: 'wave', say: '¿Hablamos? Te respondo rápido ✉️', react: 'contact' },
    { el: first('#site-footer'), fx: .5, pose: 'wave', say: '¡Gracias por llegar hasta aquí! 🙌', react: 'footer' }
  ];

  const QUIPS = [
    '¡Ey! Eso hace cosquillas 😄',
    'Tip: una buena miniatura se entiende en menos de un segundo.',
    'Ctrl + S... siempre Ctrl + S 💾',
    '¿Café? ☕ Después de este render.',
    'Los primeros 5 segundos del video lo son todo.',
    '¿Probaste ver tu miniatura en tamaño móvil?',
    'Menos texto, más impacto.',
    '¡A editar se ha dicho! ✂️'
  ];

  let scale = 3, vw = 0, vh = 0, stops = [], keys = [], touchables = [];
  let enabled = true, ready = false, raf = 0, lastT = 0, lastDraw = 0;
  const st = { x: 0, y: 0, vx: 0, vy: 0, dir: 1, pose: 'type' };
  let atStop = -1, forced = null, forcedUntil = 0, lastScrollAt = performance.now();
  let bubbleUntil = 0, bubbleW = 0, bubbleH = 0, blinkUntil = 0, nextBlink = 0, mouseX = null, lastPoseHit = '';
  const sayCount = new Map(), hinted = new Set();

  // posición en el documento ignorando transformaciones (animaciones de entrada)
  function docRect(el) {
    let x = 0, y = 0, n = el;
    while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }

  function layout() {
    vw = document.documentElement.clientWidth;
    vh = window.innerHeight;
    scale = vw < 640 ? 2 : 3;
    canvas.style.width = Sprite.W * scale + 'px';
    canvas.style.height = Sprite.H * scale + 'px';
    lastPoseHit = '';
    const mobile = vw < 768;
    const margin = 14 * scale;

    stops = [];
    STOPS.forEach(def => {
      if (def.at) {
        const pt = def.at();
        if (pt) stops.push({ def, el: null, x: Math.max(margin, Math.min(vw - margin, pt.x)), y: pt.y, face: def.face || 1 });
        return;
      }
      const el = def.el();
      if (!el || !el.getClientRects().length) return;
      const r = docRect(el);
      const fx = mobile && def.fxm != null ? def.fxm : def.fx;
      const x = Math.max(margin, Math.min(vw - margin, r.x + r.w * fx));
      const face = def.face || (r.x + r.w / 2 >= x ? 1 : -1);
      stops.push({ def, el, x, y: r.y, face });
    });

    // a qué altura de scroll llega a cada parada (pies al ~62% de la pantalla)
    const feet = mobile ? 0.7 : 0.68;
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
    const isFlat = i => i > 0 && i < stops.length && Math.abs(stops[i].y - stops[i - 1].y) < 24;
    // largo de cada tramo "caminando" (paradas seguidas a la misma altura)
    const runLen = stops.map(() => 0);
    for (let i = 1; i < stops.length; i++) {
      if (!isFlat(i)) continue;
      let a = i; while (isFlat(a - 1)) a--;
      let b = i; while (isFlat(b + 1)) b++;
      runLen[i] = b - a + 1;
    }
    // al empezar una caminata, los pies arrancan más abajo en la pantalla
    keys = stops.map((s, i) => s.y - vh * (isFlat(i + 1) && !isFlat(i) ? Math.min(0.82, feet + 0.06 * runLen[i + 1]) : feet));
    for (let i = 0; i < keys.length; i++) {
      if (i === 0) { keys[i] = Math.max(0, keys[i]); continue; }
      // caminar de lado a lado recibe más scroll para que se vea, sin salir de pantalla
      const gap = isFlat(i)
        ? vh * Math.min(0.12 + Math.min(0.18, Math.abs(stops[i].x - stops[i - 1].x) / vw * 0.4), 0.46 / runLen[i])
        : vh * 0.22;
      keys[i] = Math.max(keys[i], keys[i - 1] + gap);
    }
    for (let i = keys.length - 1; i >= 0; i--) keys[i] = Math.min(keys[i], i === keys.length - 1 ? maxScroll : keys[i + 1] - 40);
    for (let i = 0; i < keys.length; i++) keys[i] = Math.max(keys[i], i ? keys[i - 1] + 1 : 0);

    touchables.forEach(t => t.el.classList.remove('is-touched'));
    touchables = Array.from(document.querySelectorAll('[data-touch]'))
      .filter(el => el.getClientRects().length)
      .map(el => { const r = docRect(el); return { el, x1: r.x, x2: r.x + r.w, top: r.y, bottom: r.y + r.h, on: false }; });

    if (!ready && stops.length) {
      const T = targetAt(window.scrollY);
      st.x = T.x; st.y = T.y; ready = true;
    }
  }

  function targetAt(s) {
    const n = stops.length;
    if (s <= keys[0]) return { x: stops[0].x, y: stops[0].y, stop: 0, ground: true };
    if (s >= keys[n - 1]) return { x: stops[n - 1].x, y: stops[n - 1].y, stop: n - 1, ground: true };
    let i = 0;
    while (i < n - 1 && s >= keys[i + 1]) i++;
    const a = stops[i], b = stops[i + 1];
    const span = Math.max(1, keys[i + 1] - keys[i]);
    const u = (s - keys[i]) / span;
    // parte del tramo en la que se queda quieto en la parada (corta en tramos largos)
    const D = Math.min(0.36, (vh * 0.18) / span);
    if (u <= D) return { x: a.x, y: a.y, stop: i, ground: true };
    let v = (u - D) / (1 - D);
    v = v * v * (3 - 2 * v);
    const flat = Math.abs(a.y - b.y) < 24;
    let y = a.y + (b.y - a.y) * v;
    // en el aire: siempre dentro de la pantalla
    if (!flat) y = Math.max(s + vh * 0.36, Math.min(s + vh * 0.85, y));
    return { x: a.x + (b.x - a.x) * v, y, stop: -1, ground: flat };
  }

  /* ---------- burbuja de diálogo ---------- */
  function say(text, ms) {
    bubbleText.textContent = text;
    bubble.classList.add('is-on');
    bubbleW = bubble.offsetWidth;
    bubbleH = bubble.offsetHeight;
    bubbleUntil = performance.now() + (ms || 4200);
  }
  function hush() { bubbleUntil = 0; bubble.classList.remove('is-on'); }

  function cheer(ms) {
    forced = 'celebrate';
    forcedUntil = performance.now() + (ms || 1100);
  }

  function confetti(x, y) {
    if (reduce.matches || !layer.animate) return;
    const cols = ['#dc2626', '#ffb4ab', '#ffd166', '#e5e1e4', '#e40037'];
    for (let i = 0; i < 28; i++) {
      const d = document.createElement('i');
      d.className = 'confetti';
      d.style.background = cols[i % cols.length];
      d.style.left = x + 'px';
      d.style.top = y + 'px';
      layer.appendChild(d);
      const ang = -Math.PI / 2 + (Math.random() - .5) * 2.4, sp = 140 + Math.random() * 220;
      const dx = Math.cos(ang) * sp, dy = Math.sin(ang) * sp;
      d.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dx * .7}px, ${dy * .7}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .45 },
        { transform: `translate(${dx}px, ${dy + 240}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
      ], { duration: 1200 + Math.random() * 500, easing: 'ease-out' }).onfinish = () => d.remove();
    }
  }

  /* ---------- llegar / salir de una parada ---------- */
  function arrive(i) {
    const d = stops[i].def;
    const n = sayCount.get(i) || 0;
    if (d.say && n < 2) { say(d.say, d.sayMs); sayCount.set(i, n + 1); }
    if (d.react === 'footer') {
      cheer(1300);
      confetti(stops[i].x, stops[i].y - 40 * scale);
    } else if (d.react) react(d.react, true);
  }
  function leave(i) {
    const d = stops[i] && stops[i].def;
    if (d && d.react && d.react !== 'footer') react(d.react, false);
    if (performance.now() < bubbleUntil) hush();
  }

  /* ---------- bucle principal ---------- */
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - lastT) / 1000));
    lastT = now;
    if (!enabled || !stops.length) return;

    const T = targetAt(window.scrollY);
    const px = st.x, py = st.y;
    if (reduce.matches) { st.x = T.x; st.y = T.y; }
    else {
      const dx = T.x - st.x;
      if (Math.abs(dx) > vw * 0.9) st.x = T.x;
      else {
        const maxV = (150 + Math.abs(dx) * 1.6) * (scale / 3) * dt;
        st.x += Math.max(-maxV, Math.min(maxV, dx));
      }
      const dy = T.y - st.y;
      if (Math.abs(dy) > vh * 1.6) st.y = T.y;
      else st.y += dy * (1 - Math.exp(-dt * 7));
    }
    st.vx += ((st.x - px) / dt - st.vx) * 0.3;
    st.vy += ((st.y - py) / dt - st.vy) * 0.3;

    // pose
    const near = Math.abs(T.x - st.x) < 3 && Math.abs(T.y - st.y) < 4;
    const airborne = !T.ground || Math.abs(T.y - st.y) > 30;
    let pose, dir = 1;
    if (forced && now < forcedUntil) pose = forced;
    else {
      forced = null;
      if (airborne) {
        pose = st.vy < -70 ? 'rocket' : 'fall';
        dir = Math.abs(st.vx) > 30 ? Math.sign(st.vx) : st.dir;
      } else if (Math.abs(T.x - st.x) > 3 || Math.abs(st.vx) > 25) {
        pose = 'walk';
        dir = Math.sign(T.x - st.x) || Math.sign(st.vx) || st.dir;
      } else if (T.stop >= 0 && near) {
        const d = stops[T.stop].def;
        pose = d.pose || 'idle';
        if (pose === 'point') dir = stops[T.stop].face;
      } else pose = 'idle';
    }
    st.pose = pose; st.dir = dir;

    // paradas
    const arrived = !airborne && T.stop >= 0 && near ? T.stop : -1;
    if (arrived !== atStop) {
      if (atStop >= 0) leave(atStop);
      atStop = arrived;
      if (atStop >= 0) arrive(atStop);
    }
    if (atStop >= 0 && atStop < stops.length - 1 && now - lastScrollAt > 12000 && now > bubbleUntil && !hinted.has(atStop)) {
      hinted.add(atStop);
      say('↓ Sigue bajando, hay más', 3200);
    }

    // pisar elementos
    const half = 6 * scale;
    for (const t of touchables) {
      const on = !airborne && st.x + half > t.x1 && st.x - half < t.x2 && (Math.abs(st.y - t.top) < 10 || Math.abs(st.y - 51 * scale - t.bottom) < 70);
      if (on !== t.on) {
        t.on = on;
        t.el.classList.toggle('is-touched', on);
        if (on) t.el.classList.add('was-touched');
      }
    }

    // mirada: sigue al cursor cuando está quieto
    let gaze = 0;
    if ((pose === 'idle' || pose === 'sit' || pose === 'wave') && mouseX != null) {
      const d = mouseX - st.x;
      gaze = Math.abs(d) > 70 ? Math.sign(d) : 0;
    } else if (pose === 'type') gaze = Math.floor(now / 2600) % 3 === 0 ? 0 : (Math.floor(now / 2600) % 3 === 1 ? 1 : -1);

    if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2400 + Math.random() * 3200; }
    const talking = now < bubbleUntil;
    if (!talking && bubble.classList.contains('is-on')) bubble.classList.remove('is-on');

    if (now - lastDraw > 40) {
      lastDraw = now;
      Sprite.draw(ctx, {
        pose, dir, t: now, gaze, blink: now < blinkUntil, talk: talking,
        prop: atStop >= 0 ? stops[atStop].def.prop : null
      });
    }

    const ax = 20 * scale, ay = Sprite.FRAME.ay * scale;
    actor.style.transform = `translate3d(${Math.round(st.x - ax)}px, ${Math.round(st.y - ay)}px, 0)`;

    // zona clicable según la pose
    const hk = pose + scale;
    if (hk !== lastPoseHit) {
      lastPoseHit = hk;
      const A = Sprite.FRAME.ay;
      const hb = pose === 'sit' ? [A - 33, A + 12] : pose === 'type' ? [A - 30, A] : pose === 'fall' ? [A - 77, A] : [A - 52, A];
      hit.style.left = 6 * scale + 'px';
      hit.style.width = 28 * scale + 'px';
      hit.style.top = hb[0] * scale + 'px';
      hit.style.height = (hb[1] - hb[0]) * scale + 'px';
    }

    if (talking) {
      const rows = pose === 'sit' ? 33 : pose === 'type' ? 30 : pose === 'fall' ? 77 : 51;
      const headTop = st.y - rows * scale;
      const left = Math.max(10, Math.min(vw - bubbleW - 10, st.x - bubbleW / 2));
      bubble.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(headTop - bubbleH - 12)}px, 0)`;
      bubble.style.setProperty('--tail', Math.max(12, Math.min(bubbleW - 12, st.x - left)) + 'px');
    }
  }

  /* ---------- eventos ---------- */
  let relayoutTimer = 0;
  const relayout = () => { clearTimeout(relayoutTimer); relayoutTimer = setTimeout(layout, 120); };

  window.addEventListener('scroll', () => { lastScrollAt = performance.now(); }, { passive: true });
  window.addEventListener('resize', relayout);
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.body);
  document.addEventListener('mousemove', e => { mouseX = e.clientX + window.scrollX; }, { passive: true });

  hit.addEventListener('click', () => {
    say(QUIPS[Math.floor(Math.random() * QUIPS.length)], 3200);
    cheer(900);
  });

  function setEnabled(on, save) {
    enabled = on;
    layer.classList.toggle('is-off', !on);
    toggleBtn.setAttribute('aria-pressed', String(on));
    if (!on) {
      if (atStop >= 0) leave(atStop);
      atStop = -1;
      hush();
      touchables.forEach(t => { t.on = false; t.el.classList.remove('is-touched'); });
    } else {
      ready = false;
      layout();
    }
    if (save) { try { localStorage.setItem('cn-personaje', on ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ } }
  }
  toggleBtn.addEventListener('click', () => setEnabled(!enabled, true));

  let saved = null;
  try { saved = localStorage.getItem('cn-personaje'); } catch (e) { /* sin almacenamiento */ }

  layout();
  if (saved === 'off') setEnabled(false, false);
  raf = requestAnimationFrame(t => { lastT = t; frame(t); });

  window.NelsonActor = { say, cheer, relayout: layout };
})();
