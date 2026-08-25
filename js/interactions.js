/* ============================================================================
   interactions.js
   ----------------------------------------------------------------------------
   Utilitário visual, independente do CRUD: tema claro/escuro, persistido em
   localStorage e aplicado via [data-theme] na <html> — sem re-render
   nenhum, é só CSS a reagir à mudança do atributo.
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

document.addEventListener('DOMContentLoaded', initTheme);
