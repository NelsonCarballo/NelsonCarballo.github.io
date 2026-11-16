/* =========================================================================
   APP — arma la web a partir de contenido/perfil.js y contenido/galeria.js
   ========================================================================= */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const PERFIL = window.PERFIL || {};
  const GAL = Object.assign({ showreel: '', miniaturas: [], videos: [], antesDespues: [] }, window.GALERIA || {});
  // Los avisos de "cómo añadir contenido" solo se ven cuando abres la web en tu PC.
  const IS_DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const src = p => {
    if (!p) return '';
    if (/^(https?:|data:|blob:|\/\/)/i.test(p)) return p;
    return p.split('/').map(encodeURIComponent).join('/');
  };
  // "Trading . cripto . finanzas" -> "Trading · Cripto · Finanzas"
  const nice = c => String(c || '').replace(/\s*\.\s*/g, ' · ').replace(/[-_]+/g, ' ').trim().replace(/(^|\s)(\S)/g, (m, a, b) => a + b.toUpperCase());
  const pad2 = n => String(n).padStart(2, '0');
  const devHint = html => IS_DEV ? `<div class="dev-hint mono-sm">👋 <b>Solo lo ves tú (modo local):</b> ${html}</div>` : '';
  const inView = el => { const r = el.getBoundingClientRect(); return r.bottom > 60 && r.top < innerHeight - 40; };

  // título de video sin #hashtags
  const vTitle = v => String(v.titulo || '').replace(/#[^\s#]+/g, '').replace(/\s{2,}/g, ' ').trim() || 'Video';

  function ytId(s) {
    if (!s) return null;
    s = String(s).trim();
    const m = s.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{11}$/.test(s) ? s : null;
  }

  /* ---------------------------------------------------------------------
     MODALES (genérico)
     --------------------------------------------------------------------- */
  const Modal = (() => {
    let open = null, lastFocus = null, onClose = null;
    function show(el, closeCb) {
      if (open) hide();
      lastFocus = document.activeElement;
      open = el; onClose = closeCb || null;
      el.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      const btn = $('[data-close]', el);
      if (btn) setTimeout(() => btn.focus(), 30);
    }
    function hide() {
      if (!open) return;
      open.classList.remove('is-open');
      document.documentElement.style.overflow = '';
      const cb = onClose; open = null; onClose = null;
      if (cb) cb();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $$('.modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) hide(); });
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && open) hide(); });
    return { show, hide, get current() { return open; } };
  })();

  /* ---------------------------------------------------------------------
     PERFIL
     --------------------------------------------------------------------- */
  function initPerfil() {
    $$('[data-year]').forEach(e => { e.textContent = new Date().getFullYear(); });
    const nombre = PERFIL.nombre || 'Carballo Nelson';
    $$('[data-perfil="nombre-mayus"]').forEach(e => { e.textContent = nombre.toUpperCase(); });
    const estado = $('[data-perfil="estado"]');
    if (estado) estado.textContent = PERFIL.disponible === false ? 'AGENDA//LLENA' : 'EDITOR//DISPONIBLE';

    const stats = $('#hero-stats');
    const st = PERFIL.stats || [];
    stats.innerHTML = st.map(s => `<div class="stat"><div class="stat__v">${esc(s.valor)}</div><div class="stat__l mono-sm">${esc(s.etiqueta)}</div></div>`).join('');
    stats.hidden = !st.length;

    const tools = PERFIL.herramientas || [];
    $('#tools').innerHTML = tools.map(t => `<span>${esc(t)}</span>`).join('');
    const meta = $('#meta-tools');
    if (meta) meta.textContent = tools.slice(0, 3).map(t => t.toUpperCase()).join(' • ');

    const bio = Array.isArray(PERFIL.bio) ? PERFIL.bio : (PERFIL.bio ? [PERFIL.bio] : []);
    $('#about-bio').innerHTML = bio.map(p => `<p>${esc(p)}</p>`).join('');

    $('#quals').innerHTML = (PERFIL.cualidades || []).map((q, i) => `
      <div class="qual"><span class="msym">${esc(q.icono || 'check_circle')}</span>
        <div><strong>${esc(q.titulo)}</strong><span>${esc(q.texto)}</span></div></div>`).join('');
    // la promesa admite <b>negrita</b>
    $('#promise').innerHTML = esc(PERFIL.promesa || '').replace(/&lt;(\/?)b&gt;/g, '<$1b>');

    const hab = PERFIL.habilidades || [];
    $('#pc-stats').innerHTML = hab.map(h => {
      const v = Math.max(0, Math.min(100, +h.nivel || 0));
      return `<div class="pstat"><span>${esc(String(h.nombre).toUpperCase())}</span><span class="c-primary">${v}</span><span class="pstat__bar"><i style="--v:${v}%"></i></span></div>`;
    }).join('');
    if (hab.length) $('#pc-lvl').textContent = Math.round(hab.reduce((a, h) => a + (+h.nivel || 0), 0) / hab.length);

    $('#services').innerHTML = (PERFIL.servicios || []).map((s, i) => `
      <article class="service card" data-touch>
        <span class="service__num mono-sm">${pad2(i + 1)}</span>
        <span class="service__ico"><span class="msym">${esc(s.icono || 'star')}</span></span>
        <h3 class="h3">${esc(s.titulo)}</h3>
        <p>${esc(s.texto)}</p>
        ${s.items && s.items.length ? `<ul class="mono-sm">${s.items.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      </article>`).join('');

    $('#guarantees').innerHTML = (PERFIL.garantias || []).map(g => `<div><b>${esc(g.titulo)}</b>${esc(g.texto)}</div>`).join('');
  }

  /* ---------------------------------------------------------------------
     HEADER: timecode, progreso, menú móvil, enlace activo
     --------------------------------------------------------------------- */
  function initHeader() {
    const bar = $('#scroll-progress');
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + '%';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const nav = $('#nav'), tg = $('#nav-toggle');
    const setMenu = open => {
      nav.classList.toggle('is-open', open);
      tg.setAttribute('aria-expanded', String(open));
      $('.msym', tg).textContent = open ? 'close' : 'menu';
    };
    tg.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
    document.addEventListener('click', e => { if (!e.target.closest('#topbar')) setMenu(false); });

    const links = $$('#nav a');
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.remove('is-active'));
        const a = map.get(en.target.id);
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach(s => io.observe(s));
  }

  /* ---------------------------------------------------------------------
     SHOWREEL
     --------------------------------------------------------------------- */
  const Reel = (() => {
    const frame = $('#reel-frame'), screen = $('#reel-screen'), nameEl = $('#reel-name');
    const tcEl = $('#reel-tc'), status = $('#reel-status');
    const raw = String(PERFIL.showreel || GAL.showreel || '').trim();
    const yt = ytId(raw);
    const reticle = `<div class="reticle mono-sm"><div class="reticle__row"><span>[ SHOWREEL ]</span><span>REC.709</span></div><span class="reticle__cross"></span><div class="reticle__row"><span>1920×1080</span><span>23.976 FPS</span></div></div>`;
    const bigplay = `<button class="bigplay" type="button" aria-label="Reproducir showreel"><span><span class="msym msym--fill">play_arrow</span></span></button>`;

    function empty() {
      const top = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      const mid = ['#0000c0', '#131315', '#c000c0', '#131315', '#00c0c0', '#131315', '#c0c0c0'];
      const low = ['#00214c', '#e5e1e4', '#32006a', '#131315', '#090909', '#131315', '#1d1d1d', '#131315'];
      const bars = arr => arr.map(c => `<i style="background:${c}"></i>`).join('');
      screen.innerHTML = `<div class="nosignal" style="filter:saturate(.75) brightness(.8)"><div class="nosignal__bars">${bars(top)}</div><div class="nosignal__mid">${bars(mid)}</div><div class="nosignal__low">${bars(low)}</div></div>
        <div class="nosignal__msg"><strong>SIN SEÑAL</strong><span class="mono-sm">SHOWREEL EN CAMINO // PRÓXIMAMENTE</span></div>`;
      nameEl.textContent = 'NO_SIGNAL.MOV';
      status.textContent = 'SIN SEÑAL';
      frame.insertAdjacentHTML('afterend', devHint('Para el showreel, pon un video en <code>contenido/showreel/</code> y ejecuta <code>ACTUALIZAR-GALERIA.bat</code>, o pega un link de YouTube en <code>contenido/perfil.js</code> → <code>showreel</code>.'));
    }

    function youtube() {
      nameEl.textContent = 'SHOWREEL // YOUTUBE';
      screen.innerHTML = `<img alt="Showreel de ${esc(PERFIL.nombre || 'Carballo Nelson')}" src="https://i.ytimg.com/vi/${yt}/maxresdefault.jpg">${reticle}${bigplay}`;
      const img = $('img', screen);
      const fallback = () => { if (!img.dataset.fb) { img.dataset.fb = 1; img.src = `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`; } };
      img.addEventListener('error', fallback);
      img.addEventListener('load', () => { if (img.naturalWidth && img.naturalWidth <= 120) fallback(); });
      $('.bigplay', screen).addEventListener('click', () => {
        screen.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&playsinline=1" title="Showreel" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        frame.classList.add('is-playing');
        status.textContent = 'REPRODUCIENDO';
      });
    }

    function file(path) {
      nameEl.textContent = (path.split('/').pop() || 'SHOWREEL').toUpperCase();
      screen.innerHTML = `<video preload="metadata" playsinline src="${esc(src(path))}#t=0.1"></video>${reticle}${bigplay}`;
      const v = $('video', screen);
      $('.bigplay', screen).addEventListener('click', () => {
        $$('.reticle, .bigplay', screen).forEach(e => e.remove());
        v.controls = true;
        v.play().catch(() => {});
      });
      v.addEventListener('play', () => { frame.classList.add('is-playing'); status.textContent = 'REPRODUCIENDO'; });
      v.addEventListener('pause', () => { frame.classList.remove('is-playing'); status.textContent = 'PAUSA'; });
      v.addEventListener('timeupdate', () => {
        const t = v.currentTime;
        tcEl.textContent = `${pad2(Math.floor(t / 3600))}:${pad2(Math.floor(t / 60) % 60)}:${pad2(Math.floor(t) % 60)}:${pad2(Math.floor((t % 1) * 24))}`;
      });
      v.addEventListener('error', () => { status.textContent = 'FORMATO NO SOPORTADO'; });
    }

    if (yt) youtube();
    else if (raw) file(raw);
    else empty();

    $$('.ratio button', frame).forEach(b => b.addEventListener('click', () => {
      $$('.ratio button', frame).forEach(x => x.classList.toggle('is-on', x === b));
      const r = b.dataset.ratio;
      screen.style.aspectRatio = r.replace('/', ' / ');
      screen.style.maxWidth = r === '9/16' ? 'min(100%, 380px)' : '';
    }));

    function power() {
      frame.classList.remove('is-powered');
      void frame.offsetWidth;
      frame.classList.add('is-powered');
      clearTimeout(power._t);
      power._t = setTimeout(() => frame.classList.remove('is-powered'), 1600);
    }
    return { power };
  })();

  /* ---------------------------------------------------------------------
     CANALES (carrusel, sin enlaces)
     --------------------------------------------------------------------- */
  (function initCanales() {
    const track = $('#car-track'), prev = $('#car-prev'), next = $('#car-next'), info = $('#car-info');
    if (!track) return;
    const canales = (GAL.canales || []).filter(c => c && (c.nombre || c.id));
    const shortUrl = c => 'youtube.com/' + String(c.id || '').replace(/^\/+/, '');

    if (canales.length) {
      track.innerHTML = canales.map(c => `
        <div class="channel" role="group" aria-label="${esc(c.nombre)}">
          <span class="channel__ava">${c.avatar ? `<img src="${esc(src(c.avatar))}" alt="" decoding="async" draggable="false">` : `<i>${esc(String(c.nombre || '?').charAt(0))}</i>`}</span>
          <span class="channel__name">${esc(c.nombre)}</span>
          <span class="channel__url mono-sm">${esc(shortUrl(c))}</span>
          ${c.suscriptores ? `<span class="channel__subs mono-sm"><span class="msym msym--fill">smart_display</span>${esc(c.suscriptores)}</span>` : ''}
        </div>`).join('');
      // tarjeta "+N ocultos por contrato"
      const oc = PERFIL.canalesOcultos || {};
      const nOc = parseInt(oc.cantidad, 10) || 0;
      if (nOc > 0) {
        track.insertAdjacentHTML('beforeend', `
          <div class="channel channel--hidden" role="group" aria-label="${nOc} canales más, ${esc(oc.texto || 'ocultos por contrato')}">
            <span class="channel__ava"><i>+${nOc}</i></span>
            <span class="channel__name">${nOc} canales más</span>
            <span class="channel__url mono-sm">${esc((oc.texto || 'Ocultos por contrato').toUpperCase())}</span>
            <span class="channel__subs mono-sm"><span class="msym msym--fill">lock</span>Confidencial</span>
          </div>`);
      }
      info.innerHTML = `<b>${pad2(canales.length + nOc)}</b> CANALES // DESLIZA PARA VER MÁS`;
    } else {
      track.innerHTML = Array.from({ length: 5 }, (_, i) => `
        <div class="channel channel--empty"><span class="channel__ava"><i>?</i></span>
          <span class="channel__name">Canal ${pad2(i + 1)}</span><span class="channel__url mono-sm">PRÓXIMAMENTE</span></div>`).join('');
      $('#car-hint').innerHTML = devHint('pega los links de los canales en <code>contenido/canales.txt</code> y ejecuta <code>ACTUALIZAR-GALERIA.bat</code>.');
    }

    const step = () => { const c = track.firstElementChild; return c ? c.getBoundingClientRect().width + 16 : 240; };
    const atEnd = () => track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const update = () => {
      const overflow = track.scrollWidth > track.clientWidth + 4;
      prev.disabled = !overflow || track.scrollLeft <= 4;
      next.disabled = !overflow || atEnd();
    };
    prev.addEventListener('click', () => { track.scrollBy({ left: -step(), behavior: 'smooth' }); pause(); });
    next.addEventListener('click', () => { track.scrollBy({ left: step(), behavior: 'smooth' }); pause(); });
    track.addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();

    // arrastrar con el mouse
    let down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
      pause();
    });
    addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) { moved = true; track.classList.add('is-drag'); }
      track.scrollLeft = startLeft - dx;
    });
    addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      track.classList.remove('is-drag');
      if (moved) track.scrollBy({ left: 1, behavior: 'smooth' }); // vuelve a encajar en una tarjeta
    });

    // avance automático (se pausa al interactuar)
    let pausedUntil = 0;
    function pause() { pausedUntil = performance.now() + 6000; }
    track.addEventListener('mouseenter', () => { pausedUntil = Infinity; });
    track.addEventListener('mouseleave', () => { pausedUntil = performance.now() + 1500; });
    track.addEventListener('touchstart', pause, { passive: true });
    if (!reduceMotion.matches && canales.length) {
      setInterval(() => {
        if (performance.now() < pausedUntil || !inView(track)) return;
        if (track.scrollWidth <= track.clientWidth + 4) return;
        if (atEnd()) track.scrollTo({ left: 0, behavior: 'smooth' });
        else track.scrollBy({ left: step(), behavior: 'smooth' });
      }, 3200);
    }
  })();

  /* ---------------------------------------------------------------------
     LIGHTBOX DE MINIATURAS
     --------------------------------------------------------------------- */
  const Lightbox = (() => {
    const m = $('#lightbox'), img = $('#lb-img'), title = $('#lb-title'), cat = $('#lb-cat');
    const desc = $('#lb-desc'), count = $('#lb-count'), prev = $('#lb-prev'), next = $('#lb-next');
    let list = [], idx = 0;
    function show(i) {
      idx = (i + list.length) % list.length;
      const t = list[idx];
      img.src = src(t.web || t.archivo);
      // sin nombre de archivo/cliente: solo número
      img.alt = `Miniatura ${idx + 1}`;
      title.textContent = `Miniatura ${pad2(idx + 1)}`;
      cat.textContent = t.categoria ? nice(t.categoria) : 'Miniatura de YouTube';
      desc.textContent = t.descripcion || 'Diseño de miniatura para YouTube';
      count.textContent = `${pad2(idx + 1)} / ${pad2(list.length)}`;
      prev.hidden = next.hidden = list.length < 2;
      [idx - 1, idx + 1].forEach(j => { const n = list[(j + list.length) % list.length]; if (n) new Image().src = src(n.web || n.archivo); });
    }
    function open(l, i) { list = l; show(i); Modal.show(m, () => { img.src = 'data:,'; }); }
    prev.addEventListener('click', () => show(idx - 1));
    next.addEventListener('click', () => show(idx + 1));
    document.addEventListener('keydown', e => {
      if (Modal.current !== m) return;
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    let sx = null;
    m.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    m.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50 && list.length > 1) show(idx + (dx < 0 ? 1 : -1));
    });
    return { open };
  })();

  /* ---------------------------------------------------------------------
     MINIATURAS
     --------------------------------------------------------------------- */
  const Thumbs = (() => {
    const grid = $('#thumb-grid'), filters = $('#thumb-filters'), more = $('#thumb-more');
    const count = $('#thumb-count'), hint = $('#thumb-hint');
    const orden = PERFIL.ordenMiniaturas || {};
    // creador = nombre del archivo sin el número final ("borja-288aa.jpg" -> "borja")
    const creator = t => (t.archivo.split('/').pop().replace(/\.[^.]+$/, '').replace(/[\s_-]+\d+[a-z]*$/i, '') || t.archivo).toLowerCase();

    // primero una de cada creador; después se reparten evitando repetir creador seguido
    function interleave(list) {
      const groups = new Map();
      list.forEach(t => { const k = creator(t); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); });
      const queues = [...groups.values()];
      const first = queues.map(q => q.shift());
      // el resto se reparte parejo: cada creador ocupa posiciones espaciadas según cuántas tiene
      const rest = [];
      queues.forEach((q, g) => q.forEach((t, k) => rest.push({ t, key: (k + 0.5) / q.length + g * 1e-4 })));
      rest.sort((a, b) => a.key - b.key);
      const out = first.concat(rest.map(r => r.t));
      // evita dos seguidas del mismo creador
      for (let i = 1; i < out.length; i++) {
        if (creator(out[i]) !== creator(out[i - 1])) continue;
        const j = out.findIndex((x, n) => n > i && creator(x) !== creator(out[i - 1]) && (n + 1 >= out.length || creator(out[n + 1]) !== creator(out[i])) && creator(out[n - 1]) !== creator(out[i]));
        if (j > i) [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }

    function arrange(list) {
      const destacadas = list.filter(t => t.destacada);
      let rest = list.filter(t => !t.destacada);
      if (orden.intercalarCreadores !== false) rest = interleave(rest);
      let out = destacadas.concat(rest);
      // categorías fijadas en ciertos lugares (sin repetir creador si se puede)
      (orden.posiciones || []).forEach(p => {
        const cat = String(p.categoria || '').toLowerCase();
        const picks = [];
        (p.lugares || []).forEach(() => {
          const pool = out.filter(t => (t.categoria || '').toLowerCase() === cat && !picks.includes(t));
          const t = pool.find(x => !picks.some(y => creator(y) === creator(x))) || pool[0];
          if (t) picks.push(t);
        });
        out = out.filter(t => !picks.includes(t));
        picks.forEach((t, k) => out.splice(Math.max(0, Math.min(out.length, p.lugares[k] - 1)), 0, t));
      });
      return out;
    }

    const all = arrange((GAL.miniaturas || []).filter(m => m && m.archivo));
    let cat = 'all', limit = 0, current = [];
    const pageSize = () => innerWidth < 600 ? 6 : innerWidth < 1024 ? 8 : innerWidth < 1500 ? 9 : 12;

    function card(t, i, d) {
      return `<button type="button" class="thumb" data-i="${i}" style="--d:${d}" aria-label="Ver miniatura ${i + 1} en grande">
        <span class="thumb__media">
          <img src="${esc(src(t.web || t.archivo))}" alt="Miniatura ${i + 1}" loading="lazy" decoding="async">
          ${t.destacada ? '<span class="thumb__tag mono-sm">★ DESTACADA</span>' : ''}
          <span class="thumb__ov"><span class="mono-sm"><span class="msym">visibility</span>VER EN GRANDE</span></span>
        </span>
      </button>`;
    }

    function renderEmpty() {
      filters.hidden = true;
      count.textContent = '0';
      const n = innerWidth >= 1500 ? 8 : 6;
      grid.innerHTML = Array.from({ length: n }, (_, i) => `
        <div class="thumb thumb--empty" style="--d:${i}">
          <span class="thumb__media"><span class="empty-slot"><span class="msym">add_photo_alternate</span><span class="mono-sm">SLOT ${pad2(i + 1)} // VACÍO</span></span></span>
          <span class="thumb__meta"><span><span class="thumb__cat mono-sm">PRÓXIMAMENTE</span><span class="thumb__title">Miniatura en camino</span></span><span class="msym">hourglass_empty</span></span>
        </div>`).join('');
      hint.innerHTML = devHint('pon tus imágenes en <code>contenido/miniaturas/</code> (las subcarpetas son categorías: <code>gaming/</code>, <code>vlogs/</code>…) y haz doble clic en <code>ACTUALIZAR-GALERIA.bat</code>.');
    }

    function render(append) {
      current = cat === 'all' ? all : all.filter(t => (t.categoria || '') === cat);
      const from = append ? grid.children.length : 0;
      if (!append) grid.innerHTML = '';
      grid.insertAdjacentHTML('beforeend', current.slice(from, limit).map((t, k) => card(t, from + k, k)).join(''));
      count.textContent = current.length;
      const left = current.length - limit;
      more.hidden = left <= 0;
      more.lastChild.textContent = `Ver más miniaturas (${Math.max(0, left)})`;
    }

    function renderFilters() {
      const m = new Map();
      let uncategorized = false;
      all.forEach(t => { if (t.categoria) m.set(t.categoria, (m.get(t.categoria) || 0) + 1); else uncategorized = true; });
      if (m.size + (uncategorized ? 1 : 0) < 2) { filters.hidden = true; return; }
      filters.innerHTML = `<button type="button" class="is-on" data-cat="all">Todas<sup>${all.length}</sup></button>` +
        [...m].map(([c, n]) => `<button type="button" data-cat="${esc(c)}">${esc(nice(c))}<sup>${n}</sup></button>`).join('');
      filters.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        cat = b.dataset.cat;
        $$('button', filters).forEach(x => x.classList.toggle('is-on', x === b));
        limit = pageSize();
        render(false);
      });
    }

    if (!all.length) renderEmpty();
    else {
      renderFilters();
      limit = pageSize();
      render(false);
      more.addEventListener('click', () => { limit += pageSize(); render(true); });
      grid.addEventListener('click', e => {
        const b = e.target.closest('.thumb[data-i]');
        if (b) Lightbox.open(current, +b.dataset.i);
      });
      grid.addEventListener('error', e => {
        if (e.target.tagName === 'IMG') e.target.closest('.thumb').style.opacity = '.35';
      }, true);
    }

    // el personaje "señala" miniaturas al azar
    let timer = 0, spot = null;
    function spotlight() {
      const cards = $$('.thumb', grid).filter(inView);
      if (!cards.length) return;
      let el = cards[Math.floor(Math.random() * cards.length)];
      if (cards.length > 1 && el === spot) el = cards[(cards.indexOf(el) + 1) % cards.length];
      if (spot) spot.classList.remove('is-spotlight');
      spot = el;
      el.classList.add('is-spotlight');
    }
    return {
      spotStart() { clearInterval(timer); spotlight(); timer = setInterval(spotlight, 1800); },
      spotStop() { clearInterval(timer); if (spot) spot.classList.remove('is-spotlight'); spot = null; }
    };
  })();

  /* ---------------------------------------------------------------------
     ANTES & DESPUÉS
     --------------------------------------------------------------------- */
  const Compare = (() => {
    const box = $('#compare'), range = $('#ba-range'), after = $('#ba-after'), before = $('#ba-before');
    const pairsEl = $('#ba-pairs');
    const pairs = (GAL.antesDespues || []).filter(p => p && p.antes && p.despues);
    let userAt = 0, raf = 0;
    const set = v => { box.style.setProperty('--pos', v + '%'); range.value = v; };

    range.addEventListener('input', () => { userAt = performance.now(); cancelAnimationFrame(raf); set(range.value); });
    box.addEventListener('pointerdown', () => { userAt = performance.now(); cancelAnimationFrame(raf); });

    function load(i) {
      const p = pairs[i];
      const n = p.nombre || 'Comparación';
      after.innerHTML = `<img src="${esc(src(p.despuesWeb || p.despues))}" alt="Después: ${esc(n)}" decoding="async"><span class="compare__tag mono-sm">DESPUÉS</span>`;
      before.innerHTML = `<img src="${esc(src(p.antesWeb || p.antes))}" alt="Antes: ${esc(n)}" decoding="async"><span class="compare__tag mono-sm">ANTES</span>`;
      $$('button', pairsEl).forEach((b, j) => b.classList.toggle('is-on', j === i));
      set(50);
    }

    if (pairs.length) {
      if (pairs.length > 1) {
        pairsEl.innerHTML = pairs.map((p, i) => `<button type="button" role="tab">${pad2(i + 1)} // ${esc((p.nombre || 'Comparación').toUpperCase())}</button>`).join('');
        pairsEl.addEventListener('click', e => {
          const b = e.target.closest('button');
          if (b) load($$('button', pairsEl).indexOf(b));
        });
      }
      load(0);
    } else {
      after.innerHTML = `<div class="compare__ph compare__ph--after"><b>¡WOW!</b></div><span class="compare__tag mono-sm">DESPUÉS</span>`;
      before.innerHTML = `<div class="compare__ph compare__ph--before"><b>captura.jpg</b></div><span class="compare__tag mono-sm">ANTES</span>`;
      box.parentElement.insertAdjacentHTML('beforeend', devHint('pon pares de imágenes en <code>contenido/antes-despues/</code> llamadas <code>nombre-antes.jpg</code> y <code>nombre-despues.jpg</code>, y ejecuta <code>ACTUALIZAR-GALERIA.bat</code>.'));
    }

    function sweep() {
      if (reduceMotion.matches || performance.now() - userAt < 4000) return;
      cancelAnimationFrame(raf);
      const pts = [+range.value, 14, 86, 50], seg = 650, t0 = performance.now();
      const step = now => {
        const e = (now - t0) / seg, k = Math.floor(e);
        if (k >= pts.length - 1) { set(50); return; }
        let u = e - k;
        u = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        set(pts[k] + (pts[k + 1] - pts[k]) * u);
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }
    return { sweep };
  })();

  /* ---------------------------------------------------------------------
     VIDEOS
     --------------------------------------------------------------------- */
  const VideoModal = (() => {
    const m = $('#vmodal'), media = $('#vm-media'), title = $('#vm-title'), cat = $('#vm-cat');
    const desc = $('#vm-desc'), link = $('#vm-link');
    function open(v) {
      const vertical = v.formato === 'vertical';
      title.textContent = vTitle(v);
      cat.textContent = v.categoria ? nice(v.categoria) : (vertical ? 'Formato vertical' : 'Largo formato');
      desc.textContent = v.descripcion || '';
      const wrap = document.createElement('div');
      wrap.className = 'vplayer' + (vertical ? ' is-v' : '');
      if (v.tipo === 'youtube' && location.protocol === 'file:') {
        // YouTube no permite reproducir videos embebidos en una web abierta con doble clic (file://).
        // Publicada en internet (o abierta con VER-WEB.bat) se reproduce aquí mismo.
        const url = vertical ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
        wrap.style.position = 'relative';
        wrap.innerHTML = `<img src="https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg" alt="" style="width:100%;height:100%;object-fit:cover">
          <div class="yt-local"><a class="btn btn--primary" href="${url}" target="_blank" rel="noopener"><span class="msym msym--fill">play_arrow</span>Ver en YouTube</a>
          <p class="mono-sm">Abriste la web con doble clic: YouTube solo deja reproducir aquí cuando la web está publicada o abierta con VER-WEB.bat.</p></div>`;
        link.href = url;
        link.hidden = false;
      } else if (v.tipo === 'youtube') {
        wrap.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&rel=0&playsinline=1" title="${esc(v.titulo || 'Video')}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
        link.href = vertical ? `https://www.youtube.com/shorts/${v.id}` : `https://www.youtube.com/watch?v=${v.id}`;
        link.hidden = false;
      } else {
        wrap.innerHTML = `<video controls autoplay playsinline ${v.poster ? `poster="${esc(src(v.poster))}"` : ''} src="${esc(src(v.archivo))}"></video>`;
        link.hidden = true;
      }
      media.innerHTML = '';
      media.appendChild(wrap);
      Modal.show(m, () => { media.innerHTML = ''; });
    }
    return { open };
  })();

  (function initVideos() {
    const grid = $('#video-grid'), row = $('#shorts-row'), hint = $('#video-hint');
    const vids = (GAL.videos || []).filter(v => v && (v.archivo || v.id));
    const isV = v => v.formato === 'vertical';
    const H = vids.filter(v => !isV(v)), V = vids.filter(isV);

    const media = (v, vertical) => {
      const alt = esc(v.titulo || 'Video');
      if (v.tipo === 'youtube') return `<img src="https://i.ytimg.com/vi/${encodeURIComponent(v.id)}/hqdefault.jpg" alt="${alt}" loading="lazy" decoding="async">`;
      if (v.poster) return `<img src="${esc(src(v.poster))}" alt="${alt}" loading="lazy" decoding="async">`;
      return `<video muted playsinline preload="metadata" src="${esc(src(v.archivo))}#t=0.5" aria-label="${alt}"></video>`;
    };
    const card = (v, i, vertical) => {
      const tag = v.tipo === 'youtube' ? (vertical ? 'SHORT' : 'YOUTUBE') : (vertical ? 'VERTICAL' : 'VIDEO');
      const c = v.categoria ? nice(v.categoria) : (vertical ? 'Formato vertical' : 'Largo formato');
      return `<button type="button" class="vcard${vertical ? ' vcard--v' : ''}" data-k="${vertical ? 'v' : 'h'}" data-i="${i}" style="--d:${i % 8}">
        <span class="vcard__media">${media(v, vertical)}<span class="vcard__tag mono-sm">${tag}</span><span class="vcard__play"><span class="msym msym--fill">play_arrow</span></span></span>
        <span class="vcard__body"><span class="vcard__cat mono-sm">${esc(c)}</span><span class="vcard__title">${esc(vTitle(v))}</span>${v.descripcion && !vertical ? `<span class="vcard__desc">${esc(v.descripcion)}</span>` : ''}</span>
      </button>`;
    };
    const empty = (n, vertical) => Array.from({ length: n }, (_, i) => `
      <div class="vcard vcard--empty${vertical ? ' vcard--v' : ''}" style="--d:${i}">
        <span class="vcard__media"><span class="empty-slot"><span class="msym">${vertical ? 'smartphone' : 'movie'}</span><span class="mono-sm">SLOT ${pad2(i + 1)} // VACÍO</span></span></span>
        <span class="vcard__body"><span class="vcard__cat mono-sm">PRÓXIMAMENTE</span><span class="vcard__title">${vertical ? 'Short en camino' : 'Video en camino'}</span></span>
      </div>`).join('');

    grid.innerHTML = H.length ? H.map((v, i) => card(v, i, false)).join('') : empty(3, false);
    row.innerHTML = V.length ? V.map((v, i) => card(v, i, true)).join('') : empty(6, true);
    if (!vids.length) hint.innerHTML = devHint('pon videos en <code>contenido/videos/</code> (los verticales en <code>contenido/videos/shorts/</code>) o pega links en <code>contenido/videos/youtube.txt</code>, y ejecuta <code>ACTUALIZAR-GALERIA.bat</code>.');

    const onClick = e => {
      const b = e.target.closest('.vcard[data-i]');
      if (!b) return;
      VideoModal.open((b.dataset.k === 'v' ? V : H)[+b.dataset.i]);
    };
    grid.addEventListener('click', onClick);
    row.addEventListener('click', onClick);

    // vista previa al pasar el mouse (videos locales sin póster)
    if (matchMedia('(hover: hover)').matches) {
      $$('.vcard video').forEach(vd => {
        const c = vd.closest('.vcard');
        c.addEventListener('mouseenter', () => { vd.play().catch(() => {}); });
        c.addEventListener('mouseleave', () => { vd.pause(); });
      });
    }
  })();

  /* ---------------------------------------------------------------------
     CONTACTO
     --------------------------------------------------------------------- */
  function initContact() {
    const c = PERFIL.contacto || {};
    const handle = v => String(v).trim().replace(/^@/, '');
    const isUrl = v => /^https?:\/\//i.test(String(v));
    const wa = c.whatsapp ? String(c.whatsapp).replace(/\D/g, '') : '';
    const items = [];
    if (c.email) items.push({ c: '#dc2626', ico: '<span class="msym">mail</span>', t: 'Escríbeme un correo', s: c.email, href: 'mailto:' + c.email });
    if (c.whatsapp) items.push({ c: '#25D366', ico: 'WA', t: 'Chat por WhatsApp', s: 'Respuesta rápida', href: isUrl(c.whatsapp) ? c.whatsapp : 'https://wa.me/' + wa });
    if (c.discord) items.push({ c: '#5865F2', ico: 'D', t: 'Escríbeme por Discord', s: '@' + handle(c.discord) + ' — clic para copiar', copy: handle(c.discord) });
    if (c.instagram) items.push({ c: '#E1306C', ico: 'IG', t: 'Instagram', s: '@' + handle(c.instagram), href: isUrl(c.instagram) ? c.instagram : 'https://instagram.com/' + handle(c.instagram) });
    if (c.tiktok) items.push({ c: '#fe2c55', ico: 'TT', t: 'TikTok', s: '@' + handle(c.tiktok), href: isUrl(c.tiktok) ? c.tiktok : 'https://www.tiktok.com/@' + handle(c.tiktok) });
    if (c.x) items.push({ c: '#71767b', ico: 'X', t: 'X / Twitter', s: '@' + handle(c.x), href: isUrl(c.x) ? c.x : 'https://x.com/' + handle(c.x) });
    if (c.youtube) items.push({ c: '#ff0000', ico: '<span class="msym msym--fill">smart_display</span>', t: 'Mi canal de YouTube', s: isUrl(c.youtube) ? c.youtube.replace(/^https?:\/\/(www\.)?/, '') : '@' + handle(c.youtube), href: isUrl(c.youtube) ? c.youtube : 'https://www.youtube.com/@' + handle(c.youtube) });

    const box = $('#contact-links');
    if (!items.length) {
      box.innerHTML = devHint('agrega tu correo y redes en <code>contenido/perfil.js</code> → <code>contacto</code>. Aquí aparecerán como botones.');
    } else {
      box.innerHTML = `<span class="links__label mono-sm">Contacto directo:</span>` + items.map(it => {
        const inner = `<span class="clink__l"><span class="clink__ico">${it.ico}</span><span style="min-width:0"><strong>${esc(it.t)}</strong><small>${esc(it.s)}</small></span></span><span class="msym">${it.copy ? 'content_copy' : 'arrow_forward'}</span>`;
        if (it.copy) return `<button type="button" class="clink" style="--c:${it.c}" data-copy="${esc(it.copy)}">${inner}</button>`;
        const ext = it.href.startsWith('mailto:') ? '' : ' target="_blank" rel="noopener"';
        return `<a class="clink" style="--c:${it.c}" href="${esc(it.href)}"${ext}>${inner}</a>`;
      }).join('');
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-copy]');
        if (!b) return;
        const small = $('small', b), prevTxt = small.textContent;
        const done = ok => { small.textContent = ok ? '✓ ¡Usuario copiado!' : '@' + b.dataset.copy; setTimeout(() => { small.textContent = prevTxt; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(() => done(true), () => done(false));
        else done(false);
      });
    }

    const form = $('#contact-form'), ok = $('#contact-ok');
    const btn = $('#contact-submit');
    const showOk = (msg, ms) => {
      ok.textContent = msg;
      ok.hidden = false;
      clearTimeout(form._t);
      form._t = setTimeout(() => { ok.hidden = true; }, ms || 8000);
    };
    // Plan B: abrir el correo / WhatsApp del visitante con el mensaje ya escrito
    const fallback = (subj, body) => {
      if (c.email) {
        location.href = `mailto:${c.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
        return '✓ Se abrió tu app de correo con el mensaje preparado. Solo dale a enviar.';
      }
      if (wa) {
        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(subj + '\n\n' + body)}`, '_blank', 'noopener');
        return '✓ Se abrió WhatsApp con tu mensaje.';
      }
      return 'Escríbeme por cualquiera de los medios de contacto.';
    };

    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const d = new FormData(form);
      if (d.get('_honey')) return; // bot
      const subj = `Proyecto: ${d.get('servicio')} — ${d.get('nombre')}`;
      const body = `Nombre: ${d.get('nombre')}\nCanal: ${d.get('canal')}\nContacto: ${d.get('contacto')}\nServicio: ${d.get('servicio')}\n\n${d.get('mensaje') || ''}`;

      // Envío directo a tu correo con FormSubmit (el visitante no tiene que enviar nada)
      const destino = PERFIL.formulario && PERFIL.formulario.formsubmit;
      if (destino && location.protocol !== 'file:') {
        const label = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="ping-dot ping-dot--white"></span>ENVIANDO...';
        try {
          const r = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(destino).replace('%40', '@'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              _subject: '📩 Nuevo mensaje del portfolio — ' + subj,
              _template: 'table',
              _captcha: 'false',
              _replyto: /@/.test(d.get('contacto')) ? d.get('contacto') : undefined,
              Nombre: d.get('nombre'),
              Canal: d.get('canal'),
              Contacto: d.get('contacto'),
              Servicio: d.get('servicio'),
              Mensaje: d.get('mensaje') || '(sin mensaje)'
            })
          });
          const res = await r.json().catch(() => ({}));
          if (!r.ok || String(res.success) !== 'true') throw new Error(res.message || 'error');
          showOk('✓ ¡Mensaje enviado! Te respondo lo antes posible.', 10000);
          form.reset();
          if (window.NelsonActor) window.NelsonActor.cheer(1400);
        } catch (err) {
          showOk('No se pudo enviar automáticamente. ' + fallback(subj, body), 10000);
        } finally {
          btn.disabled = false;
          btn.innerHTML = label;
        }
        return;
      }

      if (c.email) {
        location.href = `mailto:${c.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
        ok.textContent = '✓ ¡Listo! Se abrió tu app de correo con el mensaje preparado. Solo dale a enviar.';
      } else if (wa) {
        window.open(`https://wa.me/${wa}?text=${encodeURIComponent(subj + '\n\n' + body)}`, '_blank', 'noopener');
        ok.textContent = '✓ ¡Listo! Se abrió WhatsApp con tu mensaje.';
      } else {
        ok.textContent = IS_DEV ? 'Configura tu correo en contenido/perfil.js → contacto.email para que el formulario funcione.' : 'Escríbeme por cualquiera de los medios de contacto.';
      }
      ok.hidden = false;
      clearTimeout(form._t);
      form._t = setTimeout(() => { ok.hidden = true; }, 8000);
      if (window.NelsonActor) window.NelsonActor.cheer();
    });
  }

  /* ---------------------------------------------------------------------
     TARJETA DE JUGADOR (sprite grande)
     --------------------------------------------------------------------- */
  function initPlayerCard() {
    const cv = $('#pc-sprite'), card = $('#pcard');
    if (!cv || !window.NelsonSprite) return;
    const ctx = cv.getContext('2d');
    const fr = { ox: 4, ay: 56 };
    let pose = 'idle', poseUntil = 0, visible = false, blinkUntil = 0, nextBlink = 0, last = 0, raf = 0;
    const loop = now => {
      raf = 0;
      if (!visible) return;
      raf = requestAnimationFrame(loop);
      if (now - last < 60) return;
      last = now;
      if (now > poseUntil) pose = 'idle';
      if (now > nextBlink) { blinkUntil = now + 130; nextBlink = now + 2200 + Math.random() * 2800; }
      window.NelsonSprite.draw(ctx, { pose, t: now, dir: 1, gaze: 0, blink: now < blinkUntil, talk: pose === 'wave' }, fr);
    };
    window.NelsonSprite.draw(ctx, { pose: 'idle', t: 0, dir: 1 }, fr);
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(loop);
    }, { threshold: .2 }).observe(card);
    cv.addEventListener('click', () => {
      pose = pose === 'wave' ? 'celebrate' : 'wave';
      poseUntil = performance.now() + 1800;
    });
  }

  /* ---------------------------------------------------------------------
     REVELADO
     --------------------------------------------------------------------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion.matches) { els.forEach(e => e.classList.add('is-in')); return; }
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
  }

  initPerfil();
  initHeader();
  initContact();
  initPlayerCard();
  initReveal();

  // API para que el personaje interactúe con la página
  window.Portfolio = {
    react(name, on) {
      if (name === 'reel' && on) Reel.power();
      else if (name === 'thumbs') { if (on) Thumbs.spotStart(); else Thumbs.spotStop(); }
      else if (name === 'compare' && on) Compare.sweep();
      else if (name === 'contact') { const b = $('#contact-submit'); if (b) b.classList.toggle('is-nudge', !!on); }
    }
  };
})();
