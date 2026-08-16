/* ============================================================================
   render.js
   ----------------------------------------------------------------------------
   Motor genérico de CRUD. Dado o objeto de configuração de uma entidade
   (ver data.js), estas funções constroem:
     - o formulário de criar/editar (buildForm)
     - o grid de cartões de listagem (buildCardGrid) — cada entidade ganha
       ícone + cor de acento próprios, atribuídos deterministicamente
     - a legenda discreta com os endpoints reais (buildApiNote)

   Nenhuma destas funções conhece "moradores" ou "condomínios" especificamente
   — tudo é gerado a partir da config, para evitar repetir HTML/JS em cada uma
   das ~25 telas do sistema.
   ============================================================================ */

let editingState = {}; // guarda, por entidade, o id do registro em edição (ou null)

const ACCENT_PALETTE = ['#cba35c', '#4fb3a9', '#8b7fd9', '#d98b9e', '#6fa8dc', '#e0a458', '#5fb88f', '#c17ec9'];
const STAT_FIELD_HINTS = ['valor', 'preco', 'capacidade'];

function nextId(entityKey) {
  const rows = DB[entityKey];
  return rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
}

function entityIcon(entityKey) {
  for (const role in MENUS) {
    const found = MENUS[role].find(m => m.entity === entityKey);
    if (found) return found.icon;
  }
  return 'grid';
}

function entityAccent(entityKey) {
  let hash = 0;
  for (let i = 0; i < entityKey.length; i++) hash = (hash * 31 + entityKey.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

function formatNumber(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('pt-PT');
}

/* ---------------------------------------------------------------------------
   Campos de referência (ex: "Área Comum", "Centralidade", "Taxa"): em vez de
   obrigar o utilizador a escrever um ID técnico, mostramos um campo de texto
   com autocompletar por nome — a resolução para o ID acontece sozinha, por
   baixo dos panos, comparando o texto digitado com os registos já existentes.
   --------------------------------------------------------------------------- */
function refLabelOf(ref, row) {
  if (!row) return '';
  return typeof ref.display === 'function' ? ref.display(row) : row[ref.display];
}

function refLabelForId(ref, id) {
  if (id === '' || id === undefined || id === null) return '';
  const rows = DB[ref.entity] || [];
  const match = rows.find(r => r.id === Number(id));
  return match ? refLabelOf(ref, match) : '';
}

// Mapeamento extra para colunas somente-leitura que guardam um id mas não têm
// campo de formulário correspondente (ex: "Meus Pagamentos" do morador).
const READONLY_REF_LOOKUP = {
  meusPagamentos: { id_taxa: { entity: 'taxas', display: r => `Kz ${formatNumber(r.valor_taxa)} · venc. ${r.data_limite}` } },
};

function cellValue(config, row, colKey) {
  const field = config.fields.find(f => f.key === colKey);
  if (field && field.type === 'ref') return refLabelForId(field.ref, row[colKey]) || '—';
  const fallback = READONLY_REF_LOOKUP[config.key];
  if (fallback && fallback[colKey]) return refLabelForId(fallback[colKey], row[colKey]) || '—';
  return formatCell(row[colKey]);
}

/* ---------------------------------------------------------------------------
   Constrói o "combobox" de referência: um campo de texto com sugestões
   (datalist nativo, leve e sem dependências) + um input oculto que guarda o
   ID real vinculado ao nome escolhido. Reaproveitado tanto nos formulários
   de entidade quanto na tela "Vincular Morador".
   --------------------------------------------------------------------------- */
function buildRefCombobox(idPrefix, field, currentId) {
  const wrap = document.createElement('div');
  wrap.className = 'ref-combo neu-inset';

  const refRows = DB[field.ref.entity] || [];
  const listId = `dl-${idPrefix}-${field.key}`;

  const text = document.createElement('input');
  text.type = 'text';
  text.id = `field-${idPrefix}-${field.key}`;
  text.className = 'ref-combo-input';
  text.autocomplete = 'off';
  text.setAttribute('list', listId);
  text.placeholder = field.placeholder || 'Digite o nome para pesquisar…';

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.name = field.key;
  hidden.id = `field-${idPrefix}-${field.key}-id`;

  const datalist = document.createElement('datalist');
  datalist.id = listId;
  refRows.forEach(r => {
    const opt = document.createElement('option');
    opt.value = refLabelOf(field.ref, r);
    datalist.appendChild(opt);
  });

  const statusIcon = document.createElement('span');
  statusIcon.className = 'ref-combo-status';
  statusIcon.innerHTML = icon('search', 14);

  function sync() {
    const match = refRows.find(r => refLabelOf(field.ref, r) === text.value);
    hidden.value = match ? match.id : '';
    wrap.classList.toggle('ref-combo-matched', !!match);
    wrap.classList.toggle('ref-combo-unmatched', !match && text.value.trim() !== '');
    statusIcon.innerHTML = match ? icon('check', 14) : icon('search', 14);
  }

  if (currentId !== undefined && currentId !== '' && currentId !== null) {
    const match = refRows.find(r => r.id === Number(currentId));
    if (match) { text.value = refLabelOf(field.ref, match); hidden.value = match.id; wrap.classList.add('ref-combo-matched'); statusIcon.innerHTML = icon('check', 14); }
  }

  text.addEventListener('input', sync);
  text.addEventListener('change', sync);

  wrap.appendChild(statusIcon);
  wrap.appendChild(text);
  wrap.appendChild(hidden);
  wrap.appendChild(datalist);
  return wrap;
}

/* ---------------------------------------------------------------------------
   Legenda discreta com o(s) endpoint(s) reais que um dev vai plugar depois.
   --------------------------------------------------------------------------- */
function buildApiNote(endpoints) {
  const p = document.createElement('p');
  p.className = 'api-note';
  const parts = Object.values(endpoints).filter(Boolean);
  p.textContent = 'Endpoint(s) real(is): ' + parts.join('  ·  ');
  return p;
}

/* ---------------------------------------------------------------------------
   Constrói o formulário de criar/editar de uma entidade dentro de `container`.
   --------------------------------------------------------------------------- */
function buildForm(container, config) {
  container.innerHTML = '';

  const isEditing = editingState[config.key] != null;
  const editItem = isEditing ? DB[config.key].find(r => r.id === editingState[config.key]) : null;

  const wrapper = document.createElement('div');
  wrapper.className = 'form-card glass';

  const title = document.createElement('h3');
  title.textContent = isEditing ? `Editar ${config.labelSingular}` : `Novo(a) ${config.labelSingular}`;
  wrapper.appendChild(title);

  const form = document.createElement('form');
  form.className = 'crud-form';
  form.noValidate = true;

  config.fields.forEach(field => {
    // Campos "onlyCreate" (ex: senha) não aparecem ao editar
    if (field.onlyCreate && isEditing) return;

    const row = document.createElement('div');
    row.className = 'form-row';

    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    label.htmlFor = `field-${config.key}-${field.key}`;
    row.appendChild(label);

    if (field.type === 'ref') {
      row.appendChild(buildRefCombobox(config.key, field, editItem ? editItem[field.key] : ''));
      form.appendChild(row);
      return;
    }

    let input;
    if (field.type === 'textarea') {
      input = document.createElement('textarea');
      input.rows = 3;
    } else if (field.type === 'select') {
      input = document.createElement('select');
      const emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = 'Selecione...';
      input.appendChild(emptyOpt);
      field.options.forEach(opt => {
        const o = document.createElement('option');
        o.value = opt;
        o.textContent = opt;
        input.appendChild(o);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type || 'text';
      if (field.placeholder) input.placeholder = field.placeholder;
    }

    input.id = `field-${config.key}-${field.key}`;
    input.name = field.key;
    if (field.required) input.required = true;

    if (editItem && editItem[field.key] !== undefined) {
      input.value = editItem[field.key];
    }

    row.appendChild(input);
    form.appendChild(row);
  });

  const actions = document.createElement('div');
  actions.className = 'form-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-primary';
  saveBtn.innerHTML = icon(isEditing ? 'check' : 'plus', 16) + `<span>${isEditing ? 'Guardar alterações' : 'Salvar'}</span>`;
  actions.appendChild(saveBtn);

  if (isEditing) {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Cancelar edição';
    cancelBtn.addEventListener('click', () => {
      editingState[config.key] = null;
      renderEntityScreen(config.key);
    });
    actions.appendChild(cancelBtn);
  }

  form.appendChild(actions);

  form.addEventListener('submit', e => {
    e.preventDefault();
    const formData = new FormData(form);
    const record = {};
    config.fields.forEach(field => {
      if (field.onlyCreate && isEditing) return; // mantém valor antigo (senha etc.)
      record[field.key] = formData.get(field.key) || '';
    });

    if (isEditing) {
      // --------------------------------------------------------------------
      // Endpoint real: PUT /<recurso>/:id  (ver config.endpoints.update)
      // --------------------------------------------------------------------
      Object.assign(editItem, record);
      editingState[config.key] = null;
      showToast(`${config.labelSingular} atualizado(a).`);
    } else {
      // --------------------------------------------------------------------
      // Endpoint real: POST /<recurso>  (ver config.endpoints.create)
      // --------------------------------------------------------------------
      const newRecord = { id: nextId(config.key), ...record };
      DB[config.key].push(newRecord);
      showToast(`${config.labelSingular} salvo(a) com sucesso.`);
    }

    renderEntityScreen(config.key);
  });

  wrapper.appendChild(form);
  wrapper.appendChild(buildApiNote({
    create: config.endpoints.create,
    update: config.endpoints.update,
  }));
  container.appendChild(wrapper);
}

/* ---------------------------------------------------------------------------
   Planta baixa 3D (isométrica-leve, CSS puro) — usada em vez do grid de
   cartões apenas para "Unidades", onde a noção de planta física faz sentido.
   Cada ladrilho é clicável e abre o formulário de edição, tal como o botão
   "editar" do grid genérico. Cor por status (campo "visibilidade").
   --------------------------------------------------------------------------- */
function buildIsoFloorPlan(config, rows) {
  const outer = document.createElement('div');
  outer.className = 'iso-plan-outer';

  const stage = document.createElement('div');
  stage.className = 'iso-plan-stage';

  rows.forEach(row => {
    const ativo = String(row.visibilidade || '').toLowerCase() === 'ativo';
    const tile = document.createElement('div');
    tile.className = 'iso-tile';
    tile.tabIndex = 0;
    tile.style.setProperty('--tile-c', ativo ? 'var(--jade)' : 'var(--bad-fg)');
    tile.title = `Editar ${row.numero || ('#' + row.id)}`;
    tile.innerHTML = `
      <span class="iso-tile-inner">
        <span class="iso-tile-label">${row.numero || '#' + row.id}</span>
        <span class="iso-tile-sub">${row.tipo || ''}</span>
      </span>
    `;
    const openEdit = () => { editingState[config.key] = row.id; renderEntityScreen(config.key); };
    tile.addEventListener('click', openEdit);
    tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEdit(); } });
    stage.appendChild(tile);
  });

  outer.appendChild(stage);

  const legend = document.createElement('div');
  legend.className = 'iso-plan-legend';
  legend.innerHTML = `
    <span><i class="iso-dot" style="background:var(--jade)"></i>Ativo</span>
    <span><i class="iso-dot" style="background:var(--bad-fg)"></i>Inativo</span>
    <span style="color:var(--ink-3)">${icon('drag', 12)} clique numa unidade para editar</span>
  `;
  outer.appendChild(legend);

  return outer;
}

/* ---------------------------------------------------------------------------
   Constrói o grid de cartões de uma entidade dentro de `container`.
   Cada cartão ganha ícone + cor de acento próprios (identidade visual por
   tipo de entidade) e as ações de editar/excluir só aparecem ao hover.
   --------------------------------------------------------------------------- */
function buildCardGrid(container, config) {
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'table-card glass';

  const headerRow = document.createElement('div');
  headerRow.className = 'table-card-header';
  const title = document.createElement('h3');
  title.textContent = config.label;
  headerRow.appendChild(title);
  const countTag = document.createElement('span');
  countTag.className = 'entity-card-id';
  countTag.textContent = DB[config.key].length + ' registo(s)';
  headerRow.appendChild(countTag);
  wrapper.appendChild(headerRow);

  const rows = DB[config.key];
  const accent = entityAccent(config.key);
  const iconName = entityIcon(config.key);

  if (!rows.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = icon(iconName, 30) + '<div>Ainda não há registos aqui. Use o formulário ao lado para criar o primeiro.</div>';
    wrapper.appendChild(empty);
  } else if (config.key === 'unidades') {
    wrapper.appendChild(buildIsoFloorPlan(config, rows));
  } else {
    const grid = document.createElement('div');
    grid.className = 'entity-grid';

    const badgeCols = config.columns.filter(c => c === 'visibilidade' || c === 'estado');
    const primaryCol = config.columns[0];
    const isRefCol = c => (config.fields.find(f => f.key === c) || {}).type === 'ref';
    const statCol = config.columns.find(c => !isRefCol(c) && STAT_FIELD_HINTS.some(hint => c.toLowerCase().includes(hint)) && rows.some(r => r[c] !== '' && !Number.isNaN(Number(r[c]))));
    const otherCols = config.columns.filter(c => c !== primaryCol && c !== statCol && !badgeCols.includes(c));

    rows.forEach(row => {
      const card = document.createElement('div');
      card.className = 'entity-card tilt-3d';
      card.style.setProperty('--accent-c', accent);

      const top = document.createElement('div');
      top.className = 'entity-card-top';
      top.innerHTML = `
        <span class="entity-card-icon">${icon(iconName, 19)}</span>
        <span class="entity-card-id">#${String(row.id).padStart(3, '0')}</span>
      `;
      card.appendChild(top);

      const titleEl = document.createElement('div');
      titleEl.className = 'entity-card-title';
      titleEl.textContent = cellValue(config, row, primaryCol);
      card.appendChild(titleEl);

      if (statCol && row[statCol] !== '' && !Number.isNaN(Number(row[statCol]))) {
        const statWrap = document.createElement('div');
        statWrap.className = 'entity-card-stat';
        const isCurrency = statCol.toLowerCase().includes('valor') || statCol.toLowerCase().includes('preco');
        statWrap.innerHTML = `
          <span class="brut-num entity-card-stat-value">${formatNumber(row[statCol])}${isCurrency ? ' Kz' : ''}</span>
          <span class="entity-card-stat-label">${columnLabel(config, statCol)}</span>
        `;
        card.appendChild(statWrap);
      }

      if (otherCols.length) {
        const fieldsWrap = document.createElement('div');
        fieldsWrap.className = 'entity-card-fields';
        otherCols.slice(0, 3).forEach(colKey => {
          const fieldRow = document.createElement('div');
          fieldRow.className = 'entity-card-field';
          fieldRow.innerHTML = `
            <span class="entity-card-field-label">${columnLabel(config, colKey)}</span>
            <span class="entity-card-field-value">${cellValue(config, row, colKey)}</span>
          `;
          fieldsWrap.appendChild(fieldRow);
        });
        card.appendChild(fieldsWrap);
      }

      if (badgeCols.length) {
        const badgesWrap = document.createElement('div');
        badgesWrap.className = 'entity-card-badges';
        badgeCols.forEach(colKey => {
          const badge = document.createElement('span');
          badge.className = 'badge ' + badgeClass(row[colKey]);
          badge.textContent = formatCell(row[colKey]);
          badgesWrap.appendChild(badge);
        });
        card.appendChild(badgesWrap);
      }

      if (!config.readonly) {
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'entity-card-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.title = 'Editar';
        editBtn.innerHTML = icon('edit', 15);
        editBtn.addEventListener('click', () => {
          editingState[config.key] = row.id;
          renderEntityScreen(config.key);
        });
        actionsWrap.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'card-delete-btn';
        delBtn.title = 'Excluir';
        delBtn.innerHTML = icon('trash', 15);
        delBtn.addEventListener('click', () => {
          // ------------------------------------------------------------------
          // Endpoint real: DELETE /<recurso>/:id (ver config.endpoints.remove)
          // ------------------------------------------------------------------
          if (confirm(`Excluir este(a) ${config.labelSingular.toLowerCase()}?`)) {
            DB[config.key] = DB[config.key].filter(r => r.id !== row.id);
            showToast(`${config.labelSingular} excluído(a).`);
            renderEntityScreen(config.key);
          }
        });
        actionsWrap.appendChild(delBtn);

        card.appendChild(actionsWrap);
      }

      grid.appendChild(card);
    });

    wrapper.appendChild(grid);
  }

  wrapper.appendChild(buildApiNote({ list: config.endpoints.list }));
  container.appendChild(wrapper);
}

function columnLabel(config, colKey) {
  const field = config.fields.find(f => f.key === colKey);
  if (field) return field.label;
  // Colunas "somente leitura" sem campo de formulário correspondente (ex: usuarios)
  const fallback = {
    id_usuario: 'ID Usuário', id_principal: 'ID Principal', tipo_usuario: 'Tipo de Usuário', estado: 'Estado',
  };
  return fallback[colKey] || colKey;
}

function formatCell(value) {
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function badgeClass(value) {
  const v = String(value).toLowerCase();
  if (['ativo', 'pago', 'disponível', 'resolvido'].includes(v)) return 'badge-green';
  if (['inativo', 'atrasado', 'indisponível'].includes(v)) return 'badge-red';
  return 'badge-yellow';
}

/* ---------------------------------------------------------------------------
   Renderiza uma tela de entidade completa (form + grid, ou só grid se
   for somente leitura) dentro do container de conteúdo da tela atual.
   --------------------------------------------------------------------------- */
function renderEntityScreen(entityKey) {
  const config = ENTITIES[entityKey];
  const screenBody = document.getElementById('generic-screen-body');
  if (!screenBody) return;
  screenBody.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  const h2 = document.createElement('h2');
  h2.textContent = config.label;
  heading.appendChild(h2);
  if (config.readonly) {
    const tag = document.createElement('span');
    tag.className = 'readonly-tag';
    tag.textContent = 'Somente leitura';
    heading.appendChild(tag);
  }
  screenBody.appendChild(heading);

  const layout = document.createElement('div');
  layout.className = config.readonly ? 'crud-layout crud-layout-single' : 'crud-layout';

  if (!config.readonly) {
    const formContainer = document.createElement('div');
    formContainer.className = 'crud-form-container';
    layout.appendChild(formContainer);
    buildForm(formContainer, config);
  }

  const gridContainer = document.createElement('div');
  gridContainer.className = 'crud-table-container';
  layout.appendChild(gridContainer);
  buildCardGrid(gridContainer, config);

  screenBody.appendChild(layout);
}

/* ---------------------------------------------------------------------------
   Pequena notificação temporária (feedback visual de "salvo com sucesso").
   --------------------------------------------------------------------------- */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast-visible');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove('toast-visible'), 2200);
}
