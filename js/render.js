/* ============================================================================
   render.js
   ----------------------------------------------------------------------------
   Motor genérico de CRUD. Dado o objeto de configuração de uma entidade
   (ver data.js), estas funções constroem:
     - o formulário de criar/editar (buildForm)
     - a tabela de listagem (buildTable) — cada entidade ganha ícone
       próprio (usado no cabeçalho e nos estados vazios)
     - a legenda discreta com os endpoints reais (buildApiNote)

   Nenhuma destas funções conhece "moradores" ou "condomínios" especificamente
   — tudo é gerado a partir da config, para evitar repetir HTML/JS em cada uma
   das ~25 telas do sistema.
   ============================================================================ */

let editingState = {}; // guarda, por entidade, o id do registro em edição (ou null)

const ACCENT_PALETTE = ['#2954d6', '#0f8a72', '#7a4fd6', '#c9660f', '#c2417f', '#0f8fa8', '#4f7a1e', '#b23b3b'];

function nextId(entityKey) {
  const rows = DB[entityKey];
  return rows.length ? Math.max(...rows.map(r => r.id)) + 1 : 1;
}

// Devolve todos os itens de menu de um perfil, "achatando" os grupos
// (usado sempre que for preciso procurar/percorrer itens sem interessar
// se estão soltos ou dentro de uma secção).
function flatMenuItems(role) {
  const out = [];
  (MENUS[role] || []).forEach(entry => {
    if (entry.group) out.push(...entry.items);
    else out.push(entry);
  });
  return out;
}

function entityIcon(entityKey) {
  for (const role in MENUS) {
    const found = flatMenuItems(role).find(m => m.entity === entityKey);
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
  const text = document.createElement('input');
  text.type = 'text';
  text.id = `field-${idPrefix}-${field.key}`;
  text.className = 'ref-combo-input';
  text.autocomplete = 'off';
  text.placeholder = field.placeholder || 'Pesquisar e selecionar…';
  text.setAttribute('role', 'combobox');
  text.setAttribute('aria-expanded', 'false');

  const hidden = document.createElement('input');
  hidden.type = 'hidden';
  hidden.name = field.key;
  hidden.id = `field-${idPrefix}-${field.key}-id`;

  const statusIcon = document.createElement('span');
  statusIcon.className = 'ref-combo-status';
  statusIcon.innerHTML = icon('search', 14);

  const menu = document.createElement('div');
  menu.className = 'ref-combo-menu';
  menu.setAttribute('role', 'listbox');

  let activeIndex = -1;
  let visibleRows = refRows.slice();

  function label(row) { return String(refLabelOf(field.ref, row) || ''); }

  function closeMenu() {
    menu.classList.remove('is-open');
    text.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function selectRow(row) {
    text.value = label(row);
    hidden.value = row.id;
    wrap.classList.add('ref-combo-matched');
    wrap.classList.remove('ref-combo-unmatched');
    statusIcon.innerHTML = icon('check', 14);
    closeMenu();
  }

  function renderMenu(query) {
    const q = String(query || '').trim().toLocaleLowerCase('pt-PT');
    visibleRows = refRows.filter(row => !q || label(row).toLocaleLowerCase('pt-PT').includes(q));
    menu.innerHTML = '';

    if (!visibleRows.length) {
      const empty = document.createElement('div');
      empty.className = 'ref-combo-empty';
      empty.textContent = 'Nenhum registo encontrado';
      menu.appendChild(empty);
    } else {
      const hint = document.createElement('div');
      hint.className = 'ref-combo-heading';
      hint.textContent = `${visibleRows.length} opção${visibleRows.length === 1 ? '' : 'ões'} disponível${visibleRows.length === 1 ? '' : 'eis'}`;
      menu.appendChild(hint);
      visibleRows.forEach((row, index) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'ref-combo-option';
        option.setAttribute('role', 'option');
        option.dataset.index = index;
        option.innerHTML = `<span class="ref-combo-option-main">${label(row)}</span><span class="ref-combo-option-id">#${row.id}</span>`;
        option.addEventListener('mousedown', e => e.preventDefault());
        option.addEventListener('click', () => selectRow(row));
        menu.appendChild(option);
      });
    }
    activeIndex = -1;
  }

  function openMenu() {
    renderMenu(text.value);
    menu.classList.add('is-open');
    text.setAttribute('aria-expanded', 'true');
  }

  function sync() {
    const match = refRows.find(r => label(r).toLocaleLowerCase('pt-PT') === text.value.trim().toLocaleLowerCase('pt-PT'));
    hidden.value = match ? match.id : '';
    wrap.classList.toggle('ref-combo-matched', !!match);
    wrap.classList.toggle('ref-combo-unmatched', !match && text.value.trim() !== '');
    statusIcon.innerHTML = match ? icon('check', 14) : icon('search', 14);
  }

  function highlight(index) {
    const options = [...menu.querySelectorAll('.ref-combo-option')];
    options.forEach((option, i) => option.classList.toggle('is-active', i === index));
    if (options[index]) options[index].scrollIntoView({ block: 'nearest' });
  }

  if (currentId !== undefined && currentId !== '' && currentId !== null) {
    const match = refRows.find(r => r.id === Number(currentId));
    if (match) selectRow(match);
  }

  text.addEventListener('focus', openMenu);
  text.addEventListener('input', () => { sync(); openMenu(); });
  text.addEventListener('keydown', e => {
    const options = visibleRows;
    if (e.key === 'ArrowDown') {
      e.preventDefault(); if (!menu.classList.contains('is-open')) openMenu();
      activeIndex = Math.min(options.length - 1, activeIndex + 1); highlight(activeIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); highlight(activeIndex);
    } else if (e.key === 'Enter' && activeIndex >= 0 && options[activeIndex]) {
      e.preventDefault(); selectRow(options[activeIndex]);
    } else if (e.key === 'Escape') closeMenu();
  });
  text.addEventListener('blur', () => setTimeout(() => { sync(); closeMenu(); }, 150));

  wrap.append(statusIcon, text, hidden, menu);
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
    // Campos "hidden" nunca aparecem no formulário — são definidos por outra
    // pessoa/perfil (ex: "visibilidade" é controlada pelo sistema, e as datas
    // de entrada/saída de visitantes são preenchidas pelo porteiro na
    // portaria, não pelo morador/síndico que só pré-regista a visita).
    if (field.hidden) return;

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
      if (field.hidden) {
        // Campo não editável por este formulário: mantém o valor existente
        // ao editar, ou usa um valor por omissão sensato ao criar.
        record[field.key] = isEditing ? editItem[field.key] : (field.hiddenDefault !== undefined ? field.hiddenDefault : (field.options ? field.options[0] : ''));
        return;
      }
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
   Constrói a tabela de uma entidade dentro de `container`: cabeçalho com
   título, contagem e pesquisa, e uma linha por registo (mais "humano" e
   fácil de escanear do que um grid de cartões repetidos).
   --------------------------------------------------------------------------- */
function buildTable(container, config) {
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

  const toolbar = document.createElement('div');
  toolbar.className = 'table-toolbar';
  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'table-search-input';
  searchInput.placeholder = 'Pesquise aqui…';
  toolbar.appendChild(searchInput);
  wrapper.appendChild(toolbar);

  const iconName = entityIcon(config.key);
  const tableSlot = document.createElement('div');
  wrapper.appendChild(tableSlot);

  function draw() {
    tableSlot.innerHTML = '';
    const term = searchInput.value.trim().toLowerCase();
    const allRows = DB[config.key];
    const rows = term
      ? allRows.filter(row => config.columns.some(c => String(cellValue(config, row, c)).toLowerCase().includes(term)))
      : allRows;

    if (!allRows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = icon(iconName, 30) + '<div>Ainda não há registos aqui.' + (config.readonly ? '' : ' Use o formulário acima para criar o primeiro.') + '</div>';
      tableSlot.appendChild(empty);
      return;
    }
    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = icon('search', 30) + '<div>Nenhum resultado para "' + searchInput.value + '".</div>';
      tableSlot.appendChild(empty);
      return;
    }

    const badgeCols = config.columns.filter(c => c === 'visibilidade' || c === 'estado');

    const table = document.createElement('table');
    table.className = 'crud-table';

    const thead = document.createElement('thead');
    const headTr = document.createElement('tr');
    config.columns.forEach(c => {
      const th = document.createElement('th');
      th.textContent = columnLabel(config, c);
      headTr.appendChild(th);
    });
    if (!config.readonly) {
      const th = document.createElement('th');
      th.className = 'crud-table-actions-col';
      th.textContent = 'Ação';
      headTr.appendChild(th);
    }
    thead.appendChild(headTr);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(row => {
      const tr = document.createElement('tr');
      config.columns.forEach(c => {
        const td = document.createElement('td');
        if (badgeCols.includes(c)) {
          td.innerHTML = `<span class="badge ${badgeClass(row[c])}">${formatCell(row[c])}</span>`;
        } else {
          td.textContent = cellValue(config, row, c);
        }
        tr.appendChild(td);
      });

      if (!config.readonly) {
        const td = document.createElement('td');
        td.className = 'crud-table-actions-col';
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'crud-table-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'icon-action-btn';
        editBtn.title = 'Editar';
        editBtn.innerHTML = icon('edit', 15);
        editBtn.addEventListener('click', () => {
          editingState[config.key] = row.id;
          renderEntityScreen(config.key);
        });
        actionsWrap.appendChild(editBtn);

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'icon-action-btn icon-action-btn-danger';
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

        td.appendChild(actionsWrap);
        tr.appendChild(td);
      }

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableSlot.appendChild(table);
  }

  searchInput.addEventListener('input', draw);
  draw();

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
  layout.className = 'crud-layout';

  if (!config.readonly) {
    const formContainer = document.createElement('div');
    formContainer.className = 'crud-form-container';
    layout.appendChild(formContainer);
    buildForm(formContainer, config);
  }

  const tableContainer = document.createElement('div');
  tableContainer.className = 'crud-table-container';
  layout.appendChild(tableContainer);
  buildTable(tableContainer, config);

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
