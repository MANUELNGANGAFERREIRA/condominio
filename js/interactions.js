/* ============================================================================
   interactions.js
   ----------------------------------------------------------------------------
   Dois utilitários puramente visuais, independentes do CRUD:
     - Tema claro/escuro (persistido em localStorage, aplicado via
       data-theme na <html>, sem re-render nenhum — é só CSS reagindo).
     - Inclinação 3D leve (tilt) nos cartões com a classe .tilt-3d, usando
       apenas transform CSS (sem WebGL, sem custo extra de GPU).
   ============================================================================ */

const THEME_KEY = 'condogest-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    btn.title = theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
  });
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ambiente sem storage — ignora */ }
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
}

function initTheme() {
  let saved = 'dark';
  try {
    saved = localStorage.getItem(THEME_KEY) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  } catch (e) { /* ignora */ }
  applyTheme(saved);

  document.addEventListener('click', e => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
  });
}

/* ---------------------------------------------------------------------------
   Tilt 3D — delegado no document, então funciona mesmo em cartões que são
   recriados dinamicamente pelo motor de CRUD (não precisa re-inicializar).
   Também alimenta --mx/--my, usadas pelo véu do .glass para "derreter" na
   direção do cursor (ver .glass.tilt-3d.tilt-active::after no CSS).
   --------------------------------------------------------------------------- */
function initTilt3D() {
  let raf = null, pendingEvent = null;

  function apply() {
    raf = null;
    const e = pendingEvent;
    if (!e) return;
    const card = e.target.closest && e.target.closest('.tilt-3d');
    if (!card) return;
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    const rx = (0.5 - py) * 9;
    const ry = (px - 0.5) * 10;
    card.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
    card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
    card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    card.classList.add('tilt-active');
  }

  document.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    pendingEvent = e;
    if (!raf) raf = requestAnimationFrame(apply);
  });

  document.addEventListener('pointerleave', e => {
    const card = e.target && e.target.closest ? e.target.closest('.tilt-3d') : null;
    if (card) { card.style.transform = ''; card.classList.remove('tilt-active'); }
  }, true);
}

/* ---------------------------------------------------------------------------
   Cursor líquido customizado ("íman de vidro") — só em dispositivos com rato
   fino (pointer:fine, hover:hover) e sem prefers-reduced-motion. Em touch,
   fica completamente desligado (nunca cria o elemento sequer).
   --------------------------------------------------------------------------- */
function initLiquidCursor() {
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduced) return;

  const blob = document.createElement('div');
  blob.id = 'cursor-blob';
  document.body.appendChild(blob);
  document.body.classList.add('has-liquid-cursor');

  let x = -100, y = -100, tx = -100, ty = -100, raf = null;

  function loop() {
    x += (tx - x) * 0.22;
    y += (ty - y) * 0.22;
    blob.style.transform = `translate3d(${x - 17}px, ${y - 17}px, 0)`;
    raf = requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    tx = e.clientX; ty = e.clientY;
    blob.classList.add('cb-visible');
    if (!raf) raf = requestAnimationFrame(loop);
  });
  window.addEventListener('pointerdown', () => blob.classList.add('cb-active'));
  window.addEventListener('pointerup', () => blob.classList.remove('cb-active'));
  document.addEventListener('mouseleave', () => blob.classList.remove('cb-visible'));
}

/* ---------------------------------------------------------------------------
   Odómetro — números que "sobem" dígito a dígito ao carregar. Marcado
   declarativamente com [data-odometer-value] no HTML, ou pode ser montado
   manualmente com mountOdometer(el, value, suffix) sempre que o motor de
   CRUD renderiza novos números (ver render.js / app.js).
   --------------------------------------------------------------------------- */
function mountOdometer(el, value, suffix) {
  const digits = String(Math.round(Number(value) || 0)).split('');
  el.innerHTML = digits.map(() =>
    '<span class="odometer-digit"><span class="odometer-strip">' +
    Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('') +
    '</span></span>'
  ).join('') + (suffix ? `<span class="odometer-suffix">${suffix}</span>` : '');

  const strips = el.querySelectorAll('.odometer-strip');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    strips.forEach((strip, i) => {
      const d = Number(digits[i]);
      strip.style.transitionDelay = reduced ? '0s' : (i * 70) + 'ms';
      strip.style.transform = `translateY(${-d}em)`;
    });
  }));
}

function initOdometersInScope(root) {
  (root || document).querySelectorAll('[data-odometer-value]:not([data-odometer-mounted])').forEach(el => {
    el.setAttribute('data-odometer-mounted', '1');
    mountOdometer(el, el.dataset.odometerValue, el.dataset.odometerSuffix || '');
  });
}

/* ---------------------------------------------------------------------------
   Ícones com peso físico — bounce tipo mola ao clicar em qualquer botão.
   --------------------------------------------------------------------------- */
function initIconBounce() {
  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('button, .sidebar-link, .role-option');
    if (!btn) return;
    const ic = btn.querySelector('.icon');
    if (!ic) return;
    ic.classList.remove('icon-bounce');
    void ic.offsetWidth; // reinicia a animação mesmo em cliques repetidos
    ic.classList.add('icon-bounce');
  });
}

/* ---------------------------------------------------------------------------
   Fallback para a barra de progresso em navegadores sem animation-timeline.
   --------------------------------------------------------------------------- */
function initScrollProgressFallback() {
  const supportsScrollTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  if (supportsScrollTimeline) return;
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  bar.style.animation = 'none';
  let raf = null;
  function update() {
    raf = null;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const ratio = max > 0 ? h.scrollTop / max : 0;
    bar.style.transform = `scaleX(${ratio})`;
  }
  document.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* ---------------------------------------------------------------------------
   Navbar líquida — encolhe e intensifica a sombra ao rolar a página, e
   controla o menu mobile (glass panel que desliza para baixo).
   --------------------------------------------------------------------------- */
function initLuxNav() {
  const nav = document.getElementById('lux-nav');
  const burger = document.getElementById('lux-nav-burger');
  const mobile = document.getElementById('lux-nav-mobile');
  if (!nav) return;

  let raf = null;
  function onScroll() {
    raf = null;
    nav.classList.toggle('nav-shrunk', window.scrollY > 24);
  }
  document.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(onScroll); }, { passive: true });
  onScroll();

  if (burger && mobile) {
    burger.addEventListener('click', () => {
      const open = mobile.classList.toggle('mobile-open');
      burger.classList.toggle('burger-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobile.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        mobile.classList.remove('mobile-open');
        burger.classList.remove('burger-open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/* ---------------------------------------------------------------------------
   Parallax por rato no hero — pequenos fragmentos de vidro e o cartão do
   prédio reagem à posição do cursor, somando-se ao parallax de scroll já
   existente (--pdepth). Desligado em touch e prefers-reduced-motion.
   --------------------------------------------------------------------------- */
function initHeroPointerParallax() {
  const hero = document.getElementById('hero-section');
  if (!hero) return;
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduced) return;

  const layers = Array.from(hero.querySelectorAll('[data-depth]'));
  if (!layers.length) return;

  let raf = null, px = 0.5, py = 0.5;
  function apply() {
    raf = null;
    layers.forEach(el => {
      const depth = Number(el.dataset.depth) || 0;
      const x = (px - 0.5) * depth;
      const y = (py - 0.5) * depth;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width;
    py = (e.clientY - r.top) / r.height;
    if (!raf) raf = requestAnimationFrame(apply);
  });
  hero.addEventListener('pointerleave', () => {
    px = 0.5; py = 0.5;
    if (!raf) raf = requestAnimationFrame(apply);
  });
}

/* ---------------------------------------------------------------------------
   Botões magnéticos — o botão desloca-se levemente em direção ao cursor
   dentro da sua própria área, e volta ao centro ao sair.
   --------------------------------------------------------------------------- */
function initMagneticButtons() {
  const canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canHover || reduced) return;

  document.addEventListener('pointermove', e => {
    const btn = e.target.closest && e.target.closest('.btn-magnetic');
    document.querySelectorAll('.btn-magnetic').forEach(el => {
      if (el !== btn) el.style.transform = '';
    });
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.28;
    const y = (e.clientY - r.top - r.height / 2) * 0.5;
    btn.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  });
  document.addEventListener('pointerleave', e => {
    const btn = e.target && e.target.closest ? e.target.closest('.btn-magnetic') : null;
    if (btn) btn.style.transform = '';
  }, true);
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initTilt3D();
  initLiquidCursor();
  initIconBounce();
  initScrollProgressFallback();
  initOdometersInScope(document);
  initLuxNav();
  initHeroPointerParallax();
  initMagneticButtons();
});
