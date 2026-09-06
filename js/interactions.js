/* ============================================================================
   interactions.js
   ----------------------------------------------------------------------------
   Utilitário visual, independente do CRUD: tema claro/escuro, persistido em
   localStorage e aplicado via [data-theme] na <html> — sem re-render
   nenhum, é só CSS a reagir à mudança do atributo.
   ============================================================================ */

const THEME_KEY = 'conviva-theme';

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
    btn.title = theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro';
  });
  try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ambiente sem storage — ignora */ }
}

function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function initTheme() {
  let saved = 'light';
  try {
    saved = localStorage.getItem(THEME_KEY) ||
      (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (e) { /* ignora */ }
  applyTheme(saved);

  document.addEventListener('click', e => {
    const btn = e.target.closest('.theme-toggle');
    if (!btn) return;
    applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
  });
}

/* ---------------------------------------------------------------------------
   Botão flutuante de tema — fica quase todo escondido encostado à direita
   e "sai" para a vista quando o rato passa por cima, quando recebe foco
   (teclado) ou quando é tocado no telemóvel; volta sozinho a esconder-se
   pouco depois de deixar de ser usado.
   --------------------------------------------------------------------------- */
function initThemeFab() {
  const fab = document.getElementById('theme-fab');
  if (!fab) return;

  let hideTimer = null;
  const REVEALED = 'theme-fab-revealed';

  function reveal() {
    clearTimeout(hideTimer);
    fab.classList.add(REVEALED);
  }
  function scheduleHide(delay) {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => fab.classList.remove(REVEALED), delay || 1500);
  }

  fab.addEventListener('mouseenter', reveal);
  fab.addEventListener('mouseleave', () => scheduleHide(300));
  fab.addEventListener('focus', reveal);
  fab.addEventListener('blur', () => scheduleHide(300));
  fab.addEventListener('touchstart', () => reveal(), { passive: true });
  fab.addEventListener('click', () => scheduleHide(1500));
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initThemeFab();
});
