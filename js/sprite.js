/* =========================================================================
   SPRITE PIXEL-ART DE NELSON
   Todo el personaje está dibujado por código (mapas de píxeles) para poder
   animarlo: caminar, saludar, señalar, sentarse, teclear, paracaídas, etc.
   Cada letra de los mapas es un color de la paleta. "." = transparente.
   ========================================================================= */
(function (global) {
  'use strict';

  const PAL = {
    o: '#0c0a0d',                                  // contorno
    H: '#2a1d18', h: '#4b362c', k: '#160f0c',      // pelo
    S: '#c98a66', s: '#a1664a', L: '#e2a983',      // piel
    E: '#140b0b', W: '#f4ebe4', B: '#24160f',      // ojos / cejas
    M: '#5e2422', T: '#f6f0ea',                    // boca / dientes
    C: '#1f1d22', c: '#131216', X: '#34303a',      // camiseta negra
    P: '#3c392e', p: '#29271f', Q: '#4f4b3d',      // pantalón cargo
    b: '#0e0d0f', G: '#9c958f',                    // cinturón / hebilla
    F: '#1e1c1d', f: '#0a090a', l: '#38353a',      // zapatillas
    R: '#070708',                                  // pulsera
    g: '#2b2a2e', d: '#3b3a3f',                    // laptop
    r: '#dc2626', n: '#ffb4ab', N: '#ff6b6b',      // acentos carmesí
    w: '#ffffff', y: '#ffd166', O: '#ff7a2f', a: '#8a7a76',
    Z: 'rgba(0,0,0,0.38)'
  };

  const mirror = (rows, swap) => rows.map(r => {
    let out = r.split('').reverse().join('');
    if (swap) for (const k in swap) out = out.split(k).join(swap[k]);
    return out;
  });

  /* ---------------- PARTES DEL CUERPO ---------------- */
  // Cabeza 14x15 (ojos y boca se dibujan aparte para animarlos)
  const HEAD = [
    '....oooooo....',
    '..ooHHHhhHoo..',
    '.oHHhhHHHHhHo.',
    'oHHHHHHHHHHHHo',
    'oHHkHHHkHHHkHo',
    'oHkSkHkSSkHSHo',
    'oHSSSSSSSSSSHo',
    'oHSBBSSSSBBSHo',
    'oSSSSSSSSSSSSo',
    'osSSSSSsSSSSso',
    '.oSSSSSsSSSSo.',
    '.osSSSSSSSSso.',
    '..osSSSSSSso..',
    '...ossSSsso...',
    '....oooooo....'
  ];

  // Torso 16x14 (camiseta + cinturón)
  const TORSO = [
    '....ooCssCoo....',
    '..ooCCCssCCCoo..',
    '.oCCCCCccCCCCCo.',
    'oXXCCCCCCCCCCCco',
    'oXCCCCCCCCCCCCco',
    'oXCCCCCCCCCCCcco',
    'oCCCCCCCCCCCCcco',
    '.oCCCCCCCCCCCco.',
    '.oCCCCCCCCCCCco.',
    '.oCCCCCcCCCCCco.',
    '.ocCCCCCCCCCcco.',
    '.occCCCCCCCccco.',
    '.obbbbbbbbbbbbo.',
    '.obbbbbGGbbbbbo.'
  ];

  // Brazo izquierdo 5x17 (con pulsera negra como en la referencia)
  const ARM_L = [
    '...oo',
    '..oCC',
    '.oXCC',
    'oXXCC',
    'oXCCC',
    'oCCCc',
    'occco',
    'oSSSo',
    'oLSSo',
    'oLSso',
    'oSSso',
    'oSSso',
    'oRRRo',
    'oSSSo',
    'oSSso',
    'oSSso',
    '.ooo.'
  ];
  const ARM_R = mirror(ARM_L, { R: 'S', L: 'S', X: 'C' });

  // Brazo levantado (saludar / celebrar / paracaídas)
  const ARM_UP_R = [
    '..oo.',
    '.oSSo',
    'oSSSo',
    'oLSso',
    'oSSso',
    '.oSso',
    '.oSso',
    '.oSso',
    '.oSso',
    'oCCCo',
    'oCCCo',
    'CCCCo',
    'CCCco',
    'CCcco',
    'Ccco.',
    'cco..',
    'oo...'
  ];
  const ARM_UP_L = mirror(ARM_UP_R, { c: 'X' });

  // Brazo señalando 13x6
  const ARM_POINT = [
    '.ooo.........',
    'oCCCoooooooo.',
    'CCCCSSSSSSSSo',
    'CccoSSSSSsoo.',
    'occoossssso..',
    '.oo..ooooo...'
  ];

  // Piernas cargo 7x17 (bolsillo lateral)
  const LEG_L = [
    'oPPPPPP',
    'oQPPPPP',
    'oQPPPPp',
    'oQPPPPp',
    'oQPPPPp',
    'opppPPp',
    'opQpPPp',
    'opQpPPp',
    'opppPPp',
    'oQPPPPp',
    'oQPPPPp',
    'oPPPPPp',
    'oQPPPpo',
    'oQPPPpo',
    'oPPPPpo',
    'oPPPPpo',
    'oPPPppo'
  ];
  const LEG_R = mirror(LEG_L, { Q: 'P' });

  // Piernas sentado (muslos en escorzo + canillas colgando)
  const SIT_L = [
    'oPPPPPP',
    'oQQPPPP',
    'oQPPPPp',
    'opPPPpp',
    '.oPPPpo',
    '.oQPPpo',
    '.oQPPpo',
    '.oPPPpo',
    '.oPPppo'
  ];
  const SIT_R = mirror(SIT_L, { Q: 'P' });

  const SHOE_L = [
    '.oFFFFFo',
    'oFlFFFFo',
    'oFFFFFFo',
    'offffffo',
    '.oooooo.'
  ];
  const SHOE_R = mirror(SHOE_L);

  // Laptop (vista trasera de la tapa, con logo carmesí)
  const lapRow = (mid) => 'o' + mid + 'o';
  const LAPTOP_A = [
    'o'.repeat(20),
    lapRow('g'.repeat(18)),
    lapRow('g'.repeat(8) + 'rr' + 'g'.repeat(8)),
    lapRow('g'.repeat(7) + 'rnnr' + 'g'.repeat(7)),
    lapRow('g'.repeat(8) + 'rr' + 'g'.repeat(8)),
    lapRow('g'.repeat(18)),
    lapRow('g'.repeat(18)),
    lapRow('d'.repeat(18)),
    'o'.repeat(20)
  ];
  const LAPTOP_B = LAPTOP_A.map(r => r.replace(/r/g, 'N'));

  const POPCORN = [
    '..wy..',
    '.wywy.',
    'oywywo',
    'orwrwo',
    'orwrwo',
    '.orwo.',
    '..oo..'
  ];

  /* ---------------- DIBUJO ---------------- */
  function dot(ctx, ch, x, y) {
    const col = PAL[ch];
    if (!col) return;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, 1, 1);
  }

  function blit(ctx, rows, x, y, maxRows) {
    const n = maxRows == null ? rows.length : Math.min(maxRows, rows.length);
    for (let j = 0; j < n; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[i];
        if (ch === '.') continue;
        dot(ctx, ch, x + i, y + j);
      }
    }
  }

  function line(P, x0, y0, x1, y1, c) {
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let guard = 0; guard < 200; guard++) {
      P(c, x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  // Lienzo por defecto: 40x124. El cuerpo (24x51) se dibuja en x=8.
  // "ay" es la fila del lienzo donde apoya el personaje (pies / asiento).
  const FRAME = { ox: 8, ay: 104 };
  const ANCHOR = { stand: 51, sit: 33, type: 30 };

  /**
   * st = { pose, t, dir (1|-1), gaze (-1|0|1), blink, talk, prop }
   * Poses: idle, walk, wave, point, celebrate, fall, rocket, sit, type
   */
  function draw(ctx, st, fr) {
    fr = fr || FRAME;
    const cw = ctx.canvas.width, chh = ctx.canvas.height;
    ctx.clearRect(0, 0, cw, chh);
    ctx.save();
    if (st.dir < 0) { ctx.translate(cw, 0); ctx.scale(-1, 1); }

    const t = st.t || 0;
    const pose = st.pose || 'idle';
    const anchorRow = pose === 'sit' ? ANCHOR.sit : pose === 'type' ? ANCHOR.type : ANCHOR.stand;
    const ox = fr.ox;
    let oy = fr.ay - anchorRow;
    const B = (rows, x, y, n) => blit(ctx, rows, ox + x, oy + y, n);
    const P = (c, x, y) => dot(ctx, c, ox + x, oy + y);

    let bob = Math.floor(t / 650) % 2;
    let gaze = st.gaze || 0;
    let mouth = 'smile';
    let armL = 'down', armR = 'down', armLdy = 0, armRdy = 0;
    let legs = 'stand', liftL = false, liftR = false;
    let jump = 0, flames = false, canopy = false, wave = 0, typing = -1, shadow = true;
    let prop = st.prop || null;

    switch (pose) {
      case 'walk': {
        const f = Math.floor(t / 125) % 4;
        liftL = f === 0; liftR = f === 2; bob = f % 2;
        armLdy = liftR ? -1 : 0; armRdy = liftL ? -1 : 0;
        gaze = 1; prop = null;
        break;
      }
      case 'wave':
        armR = 'up'; wave = Math.floor(t / 200) % 2;
        break;
      case 'point':
        armR = 'point'; gaze = 1;
        break;
      case 'celebrate': {
        const f = Math.floor(t / 100) % 6;
        jump = [0, -2, -4, -5, -4, -2][f];
        armL = 'up'; armR = 'up'; mouth = 'open'; bob = 0; prop = null;
        break;
      }
      case 'fall':
        armL = 'up'; armR = 'up'; mouth = 'o'; canopy = true; shadow = false; bob = 0; prop = null;
        break;
      case 'rocket':
        armL = 'up'; armR = 'up'; mouth = 'open'; flames = true; shadow = false; bob = 0; prop = null;
        break;
      case 'sit':
        legs = 'sit'; shadow = false;
        break;
      case 'type':
        legs = 'none'; prop = 'laptop'; typing = Math.floor(t / 140) % 2;
        bob = Math.floor(t / 900) % 2; shadow = false;
        break;
      default:
        break;
    }
    if (st.talk && pose !== 'fall') mouth = (Math.floor(t / 150) % 2) ? 'open' : 'smile';

    // sombra en el piso
    if (shadow) {
      const shrink = Math.abs(jump);
      for (let i = 3 + shrink; i < 21 - shrink; i++) P('Z', i, 51);
      for (let i = 6 + shrink; i < 18 - shrink; i++) P('Z', i, 52);
    }

    oy += jump;

    // paracaídas (detrás del cuerpo)
    if (canopy) {
      const sway = Math.floor(t / 320) % 2;
      const cx = 12 + sway, top = -26;
      const widths = [10, 16, 20, 24, 26, 28, 28];
      widths.forEach((w, j) => {
        const x0 = cx - w / 2;
        for (let i = 0; i < w; i++) {
          const edge = i === 0 || i === w - 1 || j === 0;
          const stripe = Math.floor((x0 + i - (cx - 14)) / 4) % 2;
          P(edge ? 'o' : (j === 1 ? 'N' : (stripe ? 'n' : 'r')), x0 + i, top + j);
        }
      });
      for (let i = 0; i < 28; i++) if (i % 4 !== 3) P('o', cx - 14 + i, top + 7);
      line(P, cx - 13, top + 8, 2, 5, 'a');
      line(P, cx - 5, top + 8, 3, 5, 'a');
      line(P, cx + 4, top + 8, 21, 5, 'a');
      line(P, cx + 12, top + 8, 22, 5, 'a');
    }

    // piernas
    if (legs === 'stand') {
      B(LEG_L, 5, 29, liftL ? 15 : 17);
      B(LEG_R, 12, 29, liftR ? 15 : 17);
      B(SHOE_L, 4 + (liftL ? 1 : 0), liftL ? 44 : 46);
      B(SHOE_R, 12 + (liftR ? 1 : 0), liftR ? 44 : 46);
      if (flames) {
        const f = Math.floor(t / 70) % 3;
        [4, 12].forEach(sx => {
          for (let i = 2; i < 6; i++) P('y', sx + i, 51);
          for (let i = 2 + (f === 1 ? 1 : 0); i < 6 - (f === 2 ? 1 : 0); i++) P('O', sx + i, 52);
          P('r', sx + 3, 53); P('r', sx + 4, 53);
          if (f !== 1) P('O', sx + 3 + (f === 2 ? 1 : 0), 54);
        });
      }
    } else if (legs === 'sit') {
      const f = Math.floor(t / 420) % 2;
      B(SIT_L, 5, 29); B(SIT_R, 12, 29);
      B(SHOE_L, 4 - f, 38); B(SHOE_R, 13 - f, 38);
    }

    // torso + brazos
    const uy = bob;
    B(TORSO, 4, 15 + uy);

    if (armL === 'down') B(ARM_L, 0, 16 + uy + armLdy, typing >= 0 ? 10 + typing : null);
    else if (armL === 'up') B(ARM_UP_L, 0, 4 + uy);

    if (armR === 'down') B(ARM_R, 19, 16 + uy + armRdy, typing >= 0 ? 11 - typing : null);
    else if (armR === 'up') {
      if (wave) { B(ARM_UP_R.slice(0, 9), 19 + wave, 4 + uy); B(ARM_UP_R.slice(9), 19, 13 + uy); }
      else B(ARM_UP_R, 19, 4 + uy);
    } else if (armR === 'point') B(ARM_POINT, 18, 16 + uy);

    // cabeza, ojos, boca
    const hx = 5, hy = uy;
    B(HEAD, hx, hy);
    if (st.blink) {
      [3, 4, 9, 10].forEach(c => P('B', hx + c, hy + 8));
    } else if (gaze > 0) {
      P('W', hx + 3, hy + 8); P('E', hx + 4, hy + 8); P('W', hx + 9, hy + 8); P('E', hx + 10, hy + 8);
    } else if (gaze < 0) {
      P('E', hx + 3, hy + 8); P('W', hx + 4, hy + 8); P('E', hx + 9, hy + 8); P('W', hx + 10, hy + 8);
    } else {
      [3, 4, 9, 10].forEach(c => P('E', hx + c, hy + 8));
    }
    if (mouth === 'smile') {
      P('M', hx + 5, hy + 11); P('T', hx + 6, hy + 11); P('T', hx + 7, hy + 11); P('M', hx + 8, hy + 11);
      P('M', hx + 6, hy + 12); P('M', hx + 7, hy + 12);
    } else if (mouth === 'open') {
      P('M', hx + 5, hy + 11); P('T', hx + 6, hy + 11); P('T', hx + 7, hy + 11); P('M', hx + 8, hy + 11);
      for (let i = 5; i <= 8; i++) P('M', hx + i, hy + 12);
    } else if (mouth === 'o') {
      P('M', hx + 6, hy + 11); P('M', hx + 7, hy + 11); P('M', hx + 6, hy + 12); P('M', hx + 7, hy + 12);
    }

    // accesorios al frente
    if (prop === 'laptop') B(Math.floor(t / 500) % 4 === 0 ? LAPTOP_B : LAPTOP_A, 2, 21);
    else if (prop === 'popcorn') B(POPCORN, 14, 24 + uy);

    ctx.restore();
  }

  global.NelsonSprite = {
    draw,
    W: 40,
    H: 124,
    FRAME,
    ANCHOR,
    // expuesto para pruebas
    _maps: { HEAD, TORSO, ARM_L, ARM_R, ARM_UP_R, ARM_UP_L, ARM_POINT, LEG_L, LEG_R, SIT_L, SIT_R, SHOE_L, SHOE_R, LAPTOP_A, POPCORN }
  };
})(window);
