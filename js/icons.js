/* ============================================================================
   icons.js
   ----------------------------------------------------------------------------
   Biblioteca de ícones SVG inline (sem emojis, sem dependência de rede).
   Cada ícone é desenhado em stroke, viewBox 24x24, e herda a cor do texto
   (currentColor) para se adaptar a qualquer contexto — sidebar, cards,
   badges, botões de ação, etc.
   ============================================================================ */

const ICON_PATHS = {
  home:        '<path d="M4 11 12 4l8 7"/><path d="M6 10v10h5v-6h2v6h5V10"/>',
  building:    '<rect x="5" y="3" width="14" height="18" rx="1.2"/><rect x="8" y="6.4" width="2.2" height="2.2"/><rect x="13.8" y="6.4" width="2.2" height="2.2"/><rect x="8" y="10.8" width="2.2" height="2.2"/><rect x="13.8" y="10.8" width="2.2" height="2.2"/><rect x="8" y="15.2" width="2.2" height="2.2"/><rect x="13.8" y="15.2" width="2.2" height="2.2"/>',
  door:        '<rect x="6" y="3" width="12" height="18" rx="1"/><circle cx="14.6" cy="12" r="0.9" fill="currentColor" stroke="none"/>',
  users:       '<circle cx="9" cy="8" r="3.1"/><path d="M3.8 20c0-3.4 2.3-5.6 5.2-5.6s5.2 2.2 5.2 5.6"/><circle cx="17" cy="9" r="2.3"/><path d="M15.4 14.6c2.4.2 4.2 2.2 4.2 5"/>',
  link:        '<circle cx="7.5" cy="12" r="3"/><circle cx="16.5" cy="12" r="3"/><line x1="10.4" y1="12" x2="13.6" y2="12"/>',
  wrench:      '<circle cx="6.5" cy="17.5" r="2.6"/><line x1="8.4" y1="15.6" x2="16.5" y2="7.5"/><path d="M14.5 5.5a3.3 3.3 0 0 1 4.6 4.6l-1.6 1.6-4.6-4.6z"/>',
  waves:       '<path d="M2.5 11c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0"/><path d="M2.5 16.4c1.6-1.6 3.2-1.6 4.8 0s3.2 1.6 4.8 0 3.2-1.6 4.8 0 3.2 1.6 4.8 0"/>',
  calendar:    '<rect x="3.2" y="5" width="17.6" height="15.5" rx="1.6"/><line x1="3.2" y1="9.6" x2="20.8" y2="9.6"/><line x1="7.6" y1="3" x2="7.6" y2="6.8"/><line x1="16.4" y1="3" x2="16.4" y2="6.8"/>',
  megaphone:   '<path d="M3 10v4h3.6l7 3.6V6.4l-7 3.6z"/><path d="M17 9.4a3.6 3.6 0 0 1 0 5.2"/><path d="M6.6 14.2 8 19.6h2.4l-1-4.6"/>',
  scroll:      '<rect x="5.4" y="3.6" width="13.2" height="16.8" rx="1.6"/><line x1="8.4" y1="8.4" x2="15.6" y2="8.4"/><line x1="8.4" y1="12" x2="15.6" y2="12"/><line x1="8.4" y1="15.6" x2="13" y2="15.6"/>',
  wallet:      '<rect x="3" y="6.4" width="18" height="12.8" rx="1.8"/><path d="M15.6 12.4h3.6v3.2h-3.6z"/><line x1="3" y1="10" x2="21" y2="10"/>',
  receipt:     '<path d="M5.4 3h13.2v18l-2.2-1.5-2.2 1.5-2.2-1.5-2.2 1.5-2.2-1.5-2.2 1.5z"/><line x1="8.2" y1="8" x2="15.8" y2="8"/><line x1="8.2" y1="12" x2="15.8" y2="12"/>',
  coins:       '<circle cx="9.2" cy="9.2" r="5.2"/><circle cx="14.8" cy="14.8" r="5.2"/>',
  alert:       '<path d="M12 3 21 19H3z"/><line x1="12" y1="10" x2="12" y2="14.4"/><circle cx="12" cy="17" r="0.55" fill="currentColor" stroke="none"/>',
  car:         '<rect x="3" y="11" width="18" height="6.2" rx="1.8"/><path d="M5 11l2-5.2h10l2 5.2"/><circle cx="7.6" cy="17.4" r="1.5"/><circle cx="16.4" cy="17.4" r="1.5"/>',
  walker:      '<circle cx="12" cy="6.8" r="3"/><path d="M5.8 21c0-4 2.7-6.4 6.2-6.4s6.2 2.4 6.2 6.4"/>',
  shield:      '<path d="M12 3 19 6v6c0 5-3 8-7 9-4-1-7-4-7-9V6z"/>',
  mapPin:      '<path d="M12 21s7-7.6 7-12.4A7 7 0 1 0 5 8.6C5 13.4 12 21 12 21z"/><circle cx="12" cy="8.6" r="2.4"/>',
  layers:      '<polygon points="12,3 21,8 12,13 3,8"/><polyline points="3,13 12,18 21,13"/>',
  creditCard:  '<rect x="3" y="6" width="18" height="13" rx="1.8"/><line x1="3" y1="10.4" x2="21" y2="10.4"/><line x1="6.4" y1="14.6" x2="10" y2="14.6"/>',
  package:     '<path d="M3 8l9-5 9 5-9 5-9-5z"/><line x1="3" y1="8" x2="3" y2="16"/><line x1="21" y1="8" x2="21" y2="16"/><line x1="12" y1="13" x2="12" y2="21"/><polyline points="3,16 12,21 21,16"/>',
  grid:        '<rect x="3.2" y="3.2" width="7.6" height="7.6" rx="1"/><rect x="13.2" y="3.2" width="7.6" height="7.6" rx="1"/><rect x="3.2" y="13.2" width="7.6" height="7.6" rx="1"/><rect x="13.2" y="13.2" width="7.6" height="7.6" rx="1"/>',
  logout:      '<path d="M9.6 21H5.6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9.6" y2="12"/>',
  plus:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  edit:        '<path d="M12.4 20h8"/><path d="M16.6 3.6a2.2 2.2 0 0 1 3.1 3.1L8.4 18l-4 1 1-4z"/>',
  trash:       '<polyline points="4.4,7 19.6,7"/><path d="M6.4 7l1 12.2A2 2 0 0 0 9.4 21h5.2a2 2 0 0 0 2-1.8l1-12.2"/><line x1="10" y1="10.6" x2="10" y2="17"/><line x1="14" y1="10.6" x2="14" y2="17"/><path d="M9 7V4.4h6V7"/>',
  check:       '<polyline points="4,12.6 9.2,18 20,6"/>',
  x:           '<line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/><line x1="18.5" y1="5.5" x2="5.5" y2="18.5"/>',
  chevronRight:'<polyline points="9,5 16,12 9,19"/>',
  eye:         '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  arrowLeft:   '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="11,5 5,12 11,19"/>',
  mail:        '<rect x="3" y="5.4" width="18" height="13.2" rx="1.8"/><polyline points="3.4,7 12,13.2 20.6,7"/>',
  lock:        '<rect x="5.2" y="11" width="13.6" height="9.6" rx="1.8"/><path d="M8 11V7.4a4 4 0 0 1 8 0V11"/>',
  gem:         '<path d="M12 2.4 15 8.6 21.2 10 12 21.6 2.8 10 9 8.6z"/><line x1="2.8" y1="10" x2="21.2" y2="10"/><line x1="9" y1="8.6" x2="12" y2="21.6"/><line x1="15" y1="8.6" x2="12" y2="21.6"/>',
  drag:        '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  cube:        '<path d="M12 3 20 7.4v9.2L12 21 4 16.6V7.4z"/><path d="M4 7.4 12 11.8l8-4.4"/><line x1="12" y1="11.8" x2="12" y2="21"/>',
  sun:         '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.4" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.6"/><line x1="2.4" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.6" y2="12"/><line x1="4.9" y1="4.9" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.1" y2="19.1"/><line x1="4.9" y1="19.1" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.1" y2="4.9"/>',
  moon:        '<path d="M20.2 14.4A8.6 8.6 0 1 1 9.6 3.8a7 7 0 0 0 10.6 10.6z"/>',
  sparkle:     '<path d="M12 3 13.4 9 19.4 10.4 13.4 11.8 12 17.8 10.6 11.8 4.6 10.4 10.6 9z"/>',
  search:      '<circle cx="10.6" cy="10.6" r="6.6"/><line x1="15.4" y1="15.4" x2="20.6" y2="20.6"/>',
  bolt:        '<polygon points="13,2 4,14 11,14 9.5,22 20,9 12.5,9"/>',
  star:        '<polygon points="12,2.6 15.1,9.1 22.2,10 17.1,15 18.4,22.1 12,18.7 5.6,22.1 6.9,15 1.8,10 8.9,9.1"/>',
  quote:       '<path d="M4 15V9.4A4.4 4.4 0 0 1 8.4 5"/><path d="M4 15h4.4v4.4H4z"/><path d="M13.6 15V9.4A4.4 4.4 0 0 1 18 5"/><path d="M13.6 15H18v4.4h-4.4z"/>',
  arrowRight:  '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="13,5 19,12 13,19"/>',
  arrowUp:     '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5,11 12,4 19,11"/>',
  instagram:   '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/>',
  linkedin:    '<rect x="3.2" y="3.2" width="17.6" height="17.6" rx="3"/><line x1="7.6" y1="10" x2="7.6" y2="16.6"/><circle cx="7.6" cy="7" r="0.4" fill="currentColor" stroke="none"/><path d="M11.6 16.6V10"/><path d="M11.6 12.8c0-1.8 1.4-2.8 2.8-2.8s2.4 1 2.4 3v3.6"/>',
  twitterX:    '<line x1="4.4" y1="4.4" x2="19.6" y2="19.6"/><line x1="19.6" y1="4.4" x2="4.4" y2="19.6"/>',
  send:        '<line x1="21" y1="3" x2="10.6" y2="13.4"/><path d="M21 3 14.4 21l-3.8-7.6L3 9.6z"/>',
  compass:     '<circle cx="12" cy="12" r="9"/><polygon points="15,9 13,13 9,15 11,11"/>',
};

function icon(name, size) {
  size = size || 20;
  const body = ICON_PATHS[name] || ICON_PATHS.grid;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

function renderIcons(root) {
  (root || document).querySelectorAll('[data-icon]').forEach(el => {
    const size = el.getAttribute('data-icon-size') || 20;
    el.innerHTML = icon(el.getAttribute('data-icon'), Number(size));
  });
}
