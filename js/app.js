/* ============================================================================
   app.js
   ----------------------------------------------------------------------------
   Ponto de entrada do mockup. Cuida de:
     - navegação entre "telas" (seções do index.html que trocam de
       visibilidade via classe .active — nada de reload de página)
     - landing page pública
     - login (com seletor "Entrar como" para não precisar simular auth real)
     - cadastro público (Síndico / Morador)
     - montagem da sidebar de cada perfil (Admin / Síndico / Morador) a
       partir de MENUS (data.js) e das telas de CRUD genéricas (render.js)
   ============================================================================ */

const APP_STATE = {
  role: null, // 'admin' | 'sindico' | 'morador'
};

/* ---------------------------------------------------------------------------
   Navegação entre telas de topo (landing, login, cadastro, app)
   --------------------------------------------------------------------------- */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

/* ---------------------------------------------------------------------------
   LOGIN
   --------------------------------------------------------------------------- */
function initLogin() {
  const roleButtons = document.querySelectorAll('#login-role-selector .role-option');
  let selectedRole = 'sindico';

  roleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      roleButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedRole = btn.dataset.role;
    });
  });
  // marca "Síndico" como seleção inicial visível
  const initialBtn = document.querySelector('#login-role-selector .role-option[data-role="sindico"]');
  if (initialBtn) initialBtn.classList.add('selected');

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /auth/login  { email, senha }
    // (aqui não fazemos nenhuma verificação real, é só um mockup visual)
    // ------------------------------------------------------------------
    goToApp(selectedRole);
  });
}

/* ---------------------------------------------------------------------------
   CADASTRO
   --------------------------------------------------------------------------- */
function initCadastro() {
  document.getElementById('btn-cadastro-sindico').addEventListener('click', () => showScreen('screen-cadastro-sindico'));
  document.getElementById('btn-cadastro-morador').addEventListener('click', () => showScreen('screen-cadastro-morador'));

  document.getElementById('form-cadastro-sindico').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /condominio  (cria o condomínio + o login do síndico)
    // ------------------------------------------------------------------
    alert('Cadastro simulado com sucesso! O login do síndico é o próprio condomínio.');
    e.target.reset();
    showScreen('screen-login');
  });

  document.getElementById('form-cadastro-morador').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /morador-publico
    // (o morador nasce sem unidade vinculada; o síndico vincula depois)
    // ------------------------------------------------------------------
    alert('Cadastro simulado com sucesso! Assim que o síndico vincular a sua unidade, ela vai aparecer na sua área.');
    e.target.reset();
    showScreen('screen-login');
  });
}

/* ---------------------------------------------------------------------------
   APLICAÇÃO (Admin / Síndico / Morador)
   --------------------------------------------------------------------------- */
const ROLE_LABELS = { admin: 'Administrador da Plataforma', sindico: 'Síndico', morador: 'Morador' };

function goToApp(role) {
  APP_STATE.role = role;
  editingState = {}; // limpa qualquer edição pendente de uma sessão anterior

  document.getElementById('app-role-label').textContent = ROLE_LABELS[role];
  document.getElementById('app-role-label-topbar').textContent = ROLE_LABELS[role];
  document.body.setAttribute('data-role', role);

  buildSidebar(role);
  renderHomeScreen();
  showScreen('screen-app');
}

function logout() {
  APP_STATE.role = null;
  showScreen('screen-landing');
}

function buildSidebar(role) {
  const nav = document.getElementById('app-sidebar-nav');
  nav.innerHTML = '';

  MENUS[role].forEach(item => {
    const btn = document.createElement('button');
    btn.className = 'sidebar-link';
    btn.innerHTML = `<span class="sidebar-icon">${icon(item.icon, 17)}</span><span>${item.label}</span>`;

    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (item.type === 'home') renderHomeScreen();
      else if (item.type === 'entity') renderEntityScreen(item.entity);
      else if (item.type === 'vincular') renderVincularScreen();
      else if (item.type === 'minhaUnidade') renderMinhaUnidadeScreen();
    });

    nav.appendChild(btn);
  });

  // seleciona "Início" por padrão
  const first = nav.querySelector('.sidebar-link');
  if (first) first.classList.add('active');
}

/* ---------------------------------------------------------------------------
   Tela "Início" — pequeno resumo com contagens dos módulos do perfil atual.
   --------------------------------------------------------------------------- */
function renderHomeScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = `<h2>Bem-vindo(a), ${ROLE_LABELS[APP_STATE.role]}</h2>`;
  body.appendChild(heading);

  const p = document.createElement('p');
  p.className = 'home-intro';
  p.textContent = 'Este é um mockup visual — os dados abaixo são simulados localmente e não vêm de nenhum servidor real.';
  body.appendChild(p);

  const grid = document.createElement('div');
  grid.className = 'home-cards-grid';

  MENUS[APP_STATE.role]
    .filter(item => item.type === 'entity')
    .forEach((item, idx) => {
      const config = ENTITIES[item.entity];
      const card = document.createElement('div');
      card.className = 'home-card neu tilt-3d';
      card.dataset.idx = String(idx + 1).padStart(2, '0');
      card.style.setProperty('--accent-c', entityAccent(item.entity));
      card.innerHTML = `
        <span class="home-card-icon">${icon(item.icon, 22)}</span>
        <span class="home-card-count brut-num odometer" data-odometer-value="${DB[item.entity].length}"></span>
        <span class="home-card-label">${config.label}</span>
      `;
      grid.appendChild(card);
    });

  body.appendChild(grid);
  initOdometersInScope(grid);
}

/* ---------------------------------------------------------------------------
   Tela "Vincular Morador" (Síndico) — tela simples fora do padrão de CRUD.
   --------------------------------------------------------------------------- */
function renderVincularScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Vincular Morador à Unidade</h2>';
  body.appendChild(heading);

  const layout = document.createElement('div');
  layout.className = 'crud-layout';

  // -------- formulário --------
  const formContainer = document.createElement('div');
  formContainer.className = 'crud-form-container';

  const formCard = document.createElement('div');
  formCard.className = 'form-card glass';
  formCard.innerHTML = `<h3>Vincular / Desvincular</h3><p class="form-hint">Digite os nomes — a unidade e o morador são encontrados e ligados automaticamente por trás dos panos.</p>`;

  const form = document.createElement('form');
  form.className = 'crud-form';
  form.id = 'form-vincular';
  form.noValidate = true;

  const rowUnidade = document.createElement('div');
  rowUnidade.className = 'form-row';
  const labelUnidade = document.createElement('label');
  labelUnidade.textContent = 'Unidade *';
  labelUnidade.htmlFor = 'field-vincular-unidade';
  rowUnidade.appendChild(labelUnidade);
  const comboUnidade = buildRefCombobox('vincular', { key: 'unidade', ref: { entity: 'unidades', display: 'numero' } }, '');
  rowUnidade.appendChild(comboUnidade);
  form.appendChild(rowUnidade);

  const rowMorador = document.createElement('div');
  rowMorador.className = 'form-row';
  const labelMorador = document.createElement('label');
  labelMorador.textContent = 'Morador *';
  labelMorador.htmlFor = 'field-vincular-morador';
  rowMorador.appendChild(labelMorador);
  const comboMorador = buildRefCombobox('vincular', { key: 'morador', ref: { entity: 'moradores', display: 'nome' } }, '');
  rowMorador.appendChild(comboMorador);
  form.appendChild(rowMorador);

  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.innerHTML = `
    <button type="submit" class="btn btn-primary" id="btn-vincular">${icon('link', 16)}<span>Vincular</span></button>
    <button type="button" class="btn btn-secondary" id="btn-desvincular">Desvincular</button>
  `;
  form.appendChild(actions);
  form.addEventListener('submit', e => e.preventDefault());
  formCard.appendChild(form);
  formContainer.appendChild(formCard);
  formContainer.appendChild(buildApiNote({
    vincular: 'POST /unidade/:id_unidade/morador/:id_morador',
    desvincular: 'DELETE /unidade/:id_unidade/morador/:id_morador',
  }));
  layout.appendChild(formContainer);

  // -------- tabela de vínculos --------
  const tableContainer = document.createElement('div');
  tableContainer.className = 'crud-table-container';
  layout.appendChild(tableContainer);

  body.appendChild(layout);

  function renderVinculosTable() {
    tableContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'table-card glass';
    wrapper.innerHTML = '<div class="table-card-header"><h3>Vínculos Atuais</h3></div>';

    if (!VINCULOS.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Nenhum vínculo cadastrado ainda.';
      wrapper.appendChild(empty);
    } else {
  const table = document.createElement('table');
      table.className = 'crud-table';
      table.innerHTML = `
        <thead><tr><th>Unidade</th><th>Morador</th></tr></thead>
        <tbody>
          ${VINCULOS.map(v => {
            const unidade = DB.unidades.find(u => u.id === v.id_unidade);
            const morador = DB.moradores.find(m => m.id === v.id_morador);
            return `<tr><td>${unidade ? unidade.numero : '#' + v.id_unidade}</td><td>${morador ? morador.nome : '#' + v.id_morador}</td></tr>`;
          }).join('')}
        </tbody>
      `;
      wrapper.appendChild(table);
    }
    tableContainer.appendChild(wrapper);
  }

  renderVinculosTable();

  function readVincularIds() {
    const idUnidade = document.getElementById('field-vincular-unidade-id').value;
    const idMorador = document.getElementById('field-vincular-morador-id').value;
    return { idUnidade, idMorador };
  }

  document.getElementById('btn-vincular').addEventListener('click', () => {
    const { idUnidade, idMorador } = readVincularIds();
    if (!idUnidade || !idMorador) { alert('Digite um nome de unidade e de morador que já existam nas listas.'); return; }
    // ------------------------------------------------------------------
    // Endpoint real: POST /unidade/:id_unidade/morador/:id_morador
    // ------------------------------------------------------------------
    VINCULOS.push({ id: VINCULOS.length ? Math.max(...VINCULOS.map(v => v.id)) + 1 : 1, id_unidade: Number(idUnidade), id_morador: Number(idMorador) });
    showToast('Morador vinculado à unidade.');
    renderVinculosTable();
  });

  document.getElementById('btn-desvincular').addEventListener('click', () => {
    const { idUnidade, idMorador } = readVincularIds();
    if (!idUnidade || !idMorador) { alert('Digite um nome de unidade e de morador que já existam nas listas.'); return; }
    // ------------------------------------------------------------------
    // Endpoint real: DELETE /unidade/:id_unidade/morador/:id_morador
    // ------------------------------------------------------------------
    const before = VINCULOS.length;
    const filtered = VINCULOS.filter(v => !(v.id_unidade === Number(idUnidade) && v.id_morador === Number(idMorador)));
    VINCULOS.length = 0;
    VINCULOS.push(...filtered);
    showToast(before === VINCULOS.length ? 'Nenhum vínculo correspondente encontrado.' : 'Vínculo removido.');
    renderVinculosTable();
  });
}

/* ---------------------------------------------------------------------------
   Tela "Minha Unidade" (Morador) — somente leitura, dados fixos de exemplo.
   --------------------------------------------------------------------------- */
function renderMinhaUnidadeScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Minha Unidade</h2><span class="readonly-tag">Somente leitura</span>';
  body.appendChild(heading);

  const card = document.createElement('div');
  card.className = 'table-card glass';
  const u = MINHA_UNIDADE_EXEMPLO;
  card.innerHTML = `
    <div class="table-card-header"><h3>Dados da Unidade</h3></div>
    <dl class="detail-list">
      <div><dt>Número</dt><dd>${u.numero}</dd></div>
      <div><dt>Tipo</dt><dd>${u.tipo}</dd></div>
      <div><dt>Condomínio</dt><dd>${u.condominio}</dd></div>
      <div><dt>Estado</dt><dd><span class="badge badge-green">${u.visibilidade}</span></dd></div>
    </dl>
  `;
  body.appendChild(card);
  body.appendChild(buildApiNote({ list: 'GET /morador/unidade' }));
}

/* ---------------------------------------------------------------------------
   Inicialização geral
   --------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  renderIcons();

  // Landing page
  document.querySelectorAll('[data-goto]').forEach(el => {
    el.addEventListener('click', () => showScreen(el.dataset.goto));
  });

  initLogin();
  initCadastro();

  document.getElementById('btn-logout').addEventListener('click', logout);

  showScreen('screen-landing');
});
