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

  // Helpers for special field types
  function buildImageUpload(field, currentValue) {
    const wrap = document.createElement('div');
    wrap.className = 'upload-image-wrap' + (field.avatar ? ' upload-image-avatar' : '');
    wrap.dataset.fieldKey = field.key;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = field.key;
    hidden.id = `field-${config.key}-${field.key}`;
    hidden.value = currentValue || '';

    const zone = document.createElement('div');
    zone.className = 'upload-zone' + (currentValue ? ' has-preview' : '');
    zone.tabIndex = 0;

    const empty = document.createElement('div');
    empty.className = 'upload-empty';
    empty.innerHTML = `
      <div class="upload-empty-icon">${typeof icon === 'function' ? icon('image', 28) : '📷'}</div>
      <strong>Upload de imagem</strong>
      <span>Arraste uma imagem para aqui<br>ou selecione no computador</span>
      <small>PNG, JPG, JPEG, GIF ou WEBP · Máx. 20 MB</small>
      <button type="button" class="btn btn-secondary btn-small upload-select-btn">Selecionar imagem</button>
    `;

    const preview = document.createElement('div');
    preview.className = 'upload-preview';
    preview.innerHTML = `
      <img alt="Pré-visualização" class="upload-preview-img">
      <div class="upload-preview-actions">
        <button type="button" class="btn btn-secondary btn-small upload-replace-btn">Substituir</button>
        <button type="button" class="btn btn-danger btn-small upload-remove-btn">Remover</button>
      </div>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';
    fileInput.className = 'upload-file-input';
    fileInput.hidden = true;

    function showPreview(dataUrl) {
      hidden.value = dataUrl;
      preview.querySelector('.upload-preview-img').src = dataUrl;
      zone.classList.add('has-preview');
    }
    function clearPreview() {
      hidden.value = '';
      preview.querySelector('.upload-preview-img').src = '';
      zone.classList.remove('has-preview');
      fileInput.value = '';
    }
    function handleFile(file) {
      if (!file) return;
      const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowed.includes(file.type) && !/\.(png|jpe?g|gif|webp)$/i.test(file.name)) {
        showToast('Formato inválido. Use PNG, JPG, JPEG, GIF ou WEBP.');
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        showToast('A imagem excede o limite de 20 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => showPreview(reader.result);
      reader.readAsDataURL(file);
    }

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });
    empty.querySelector('.upload-select-btn').addEventListener('click', () => fileInput.click());
    preview.querySelector('.upload-replace-btn').addEventListener('click', () => fileInput.click());
    preview.querySelector('.upload-remove-btn').addEventListener('click', clearPreview);
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    if (currentValue) showPreview(currentValue);

    zone.appendChild(empty);
    zone.appendChild(preview);
    wrap.appendChild(hidden);
    wrap.appendChild(zone);
    wrap.appendChild(fileInput);
    return wrap;
  }

  function buildDocumentUpload(field, currentValue) {
    const wrap = document.createElement('div');
    wrap.className = 'upload-doc-wrap';
    wrap.dataset.fieldKey = field.key;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = field.key;
    hidden.id = `field-${config.key}-${field.key}`;
    // Store JSON {name, size, data} or plain name string for compatibility
    hidden.value = currentValue || '';

    const zone = document.createElement('div');
    zone.className = 'upload-doc-zone' + (currentValue ? ' has-file' : '');

    const empty = document.createElement('div');
    empty.className = 'upload-doc-empty';
    empty.innerHTML = `
      <strong>Arraste o documento para aqui</strong>
      <span>ou selecione no computador</span>
      <small>PDF, DOC, DOCX, XLS, XLSX e outros</small>
      <button type="button" class="btn btn-secondary btn-small upload-select-btn">Selecionar ficheiro</button>
    `;

    const preview = document.createElement('div');
    preview.className = 'upload-doc-preview';
    preview.innerHTML = `
      <div class="upload-doc-icon">📄</div>
      <div class="upload-doc-info">
        <strong class="upload-doc-name">documento.pdf</strong>
        <span class="upload-doc-size">—</span>
      </div>
      <div class="upload-doc-actions">
        <button type="button" class="btn btn-secondary btn-small upload-replace-btn">Substituir</button>
        <button type="button" class="btn btn-danger btn-small upload-remove-btn">Remover</button>
      </div>
    `;

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    fileInput.className = 'upload-file-input';
    fileInput.hidden = true;

    function formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function showFile(name, size, dataUrl) {
      const payload = JSON.stringify({ name, size, data: dataUrl || name });
      hidden.value = payload;
      preview.querySelector('.upload-doc-name').textContent = name;
      preview.querySelector('.upload-doc-size').textContent = size ? formatSize(size) : '—';
      zone.classList.add('has-file');
    }
    function clearFile() {
      hidden.value = '';
      zone.classList.remove('has-file');
      fileInput.value = '';
    }
    function handleFile(file) {
      if (!file) return;
      if (file.size > 20 * 1024 * 1024) {
        showToast('O ficheiro excede o limite de 20 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => showFile(file.name, file.size, reader.result);
      reader.readAsDataURL(file);
    }

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFile(e.dataTransfer.files[0]);
    });
    empty.querySelector('.upload-select-btn').addEventListener('click', () => fileInput.click());
    preview.querySelector('.upload-replace-btn').addEventListener('click', () => fileInput.click());
    preview.querySelector('.upload-remove-btn').addEventListener('click', clearFile);
    fileInput.addEventListener('change', () => handleFile(fileInput.files[0]));

    if (currentValue) {
      try {
        const parsed = JSON.parse(currentValue);
        showFile(parsed.name || 'documento', parsed.size || 0, parsed.data);
      } catch {
        showFile(String(currentValue).split('/').pop() || 'documento', 0, currentValue);
      }
    }

    zone.appendChild(empty);
    zone.appendChild(preview);
    wrap.appendChild(hidden);
    wrap.appendChild(zone);
    wrap.appendChild(fileInput);
    return wrap;
  }

  function buildPollOptions(field, currentValue) {
    const wrap = document.createElement('div');
    wrap.className = 'poll-options-wrap';
    wrap.dataset.fieldKey = field.key;

    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = field.key;
    hidden.id = `field-${config.key}-${field.key}`;

    const list = document.createElement('div');
    list.className = 'poll-options-list';

    let options = [];
    if (currentValue) {
      options = String(currentValue).split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (options.length < 2) options = ['', ''];

    function syncHidden() {
      const vals = [...list.querySelectorAll('.poll-option-input')].map(i => i.value.trim()).filter(Boolean);
      hidden.value = vals.join('\n');
    }

    function addOption(value) {
      const row = document.createElement('div');
      row.className = 'poll-option-row';
      const idx = list.children.length + 1;
      row.innerHTML = `
        <label class="poll-option-label">Opção ${idx}</label>
        <input type="text" class="poll-option-input" placeholder="Texto da opção" value="${(value || '').replace(/"/g, '&quot;')}">
        <button type="button" class="btn btn-secondary btn-small poll-option-remove" title="Remover">Remover</button>
      `;
      const input = row.querySelector('.poll-option-input');
      input.addEventListener('input', syncHidden);
      row.querySelector('.poll-option-remove').addEventListener('click', () => {
        if (list.children.length <= 2) {
          showToast('É necessário pelo menos 2 opções.');
          return;
        }
        row.remove();
        // renumber
        [...list.querySelectorAll('.poll-option-label')].forEach((lab, i) => { lab.textContent = `Opção ${i + 1}`; });
        syncHidden();
      });
      list.appendChild(row);
      syncHidden();
    }

    options.forEach(o => addOption(o));

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'btn btn-secondary btn-small poll-add-option';
    addBtn.innerHTML = '+ Adicionar opção';
    addBtn.addEventListener('click', () => {
      if (list.children.length >= 12) {
        showToast('Limite de 12 opções atingido.');
        return;
      }
      addOption('');
      list.lastElementChild.querySelector('input').focus();
    });

    wrap.appendChild(hidden);
    wrap.appendChild(list);
    wrap.appendChild(addBtn);
    return wrap;
  }

  config.fields.forEach(field => {
    if (field.onlyCreate && isEditing) return;
    if (field.hidden) return;

    const row = document.createElement('div');
    row.className = 'form-row';
    if (field.span === 2 || field.type === 'textarea' || field.type === 'image' || field.type === 'document' || field.type === 'poll-options') {
      row.classList.add('form-row-full');
    }
    if (field.type === 'checkbox') row.classList.add('form-row-checkbox');

    const label = document.createElement('label');
    label.textContent = field.label + (field.required ? ' *' : '');
    label.htmlFor = `field-${config.key}-${field.key}`;
    if (field.type !== 'checkbox') row.appendChild(label);

    const currentVal = editItem && editItem[field.key] !== undefined ? editItem[field.key] : '';

    if (field.type === 'ref') {
      row.appendChild(buildRefCombobox(config.key, field, currentVal));
      form.appendChild(row);
      return;
    }

    if (field.type === 'image') {
      row.appendChild(buildImageUpload(field, currentVal));
      form.appendChild(row);
      return;
    }

    if (field.type === 'document') {
      row.appendChild(buildDocumentUpload(field, currentVal));
      form.appendChild(row);
      return;
    }

    if (field.type === 'poll-options') {
      row.appendChild(buildPollOptions(field, currentVal));
      form.appendChild(row);
      return;
    }

    if (field.type === 'checkbox') {
      const checkWrap = document.createElement('label');
      checkWrap.className = 'form-checkbox-label';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `field-${config.key}-${field.key}`;
      input.name = field.key;
      input.checked = currentVal === true || currentVal === 'true' || currentVal === '1' || currentVal === 'Sim';
      checkWrap.appendChild(input);
      checkWrap.appendChild(document.createTextNode(' ' + field.label));
      row.appendChild(checkWrap);
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
    if (currentVal !== undefined && currentVal !== null) input.value = currentVal;

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
      if (field.onlyCreate && isEditing) return;
      if (field.hidden) {
        record[field.key] = isEditing ? editItem[field.key] : (field.hiddenDefault !== undefined ? field.hiddenDefault : (field.options ? field.options[0] : ''));
        return;
      }
      if (field.type === 'checkbox') {
        const el = form.querySelector(`[name="${field.key}"]`);
        record[field.key] = el && el.checked;
        return;
      }
      if (field.type === 'poll-options') {
        const val = formData.get(field.key) || '';
        const opts = String(val).split('\n').map(s => s.trim()).filter(Boolean);
        if (opts.length < 2) {
          showToast('Adicione pelo menos 2 opções válidas à votação.');
          e.stopImmediatePropagation();
          return;
        }
        record[field.key] = opts.join('\n');
        return;
      }
      record[field.key] = formData.get(field.key) || '';
    });

    // Validation for poll
    if (config.key === 'votacoes') {
      const opts = String(record.opcoes || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (opts.length < 2) {
        showToast('Adicione pelo menos 2 opções válidas à votação.');
        return;
      }
    }

    if (isEditing) {
      Object.assign(editItem, record);
      editingState[config.key] = null;
      showToast(`${config.labelSingular} atualizado(a).`);
    } else {
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
  searchInput.placeholder = config.key === 'condominios'
    ? 'Pesquisar condomínio, endereço ou tipo...'
    : 'Pesquise aqui…';
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

  if (entityKey === 'anuncios') {
    const info = document.createElement('div');
    info.className = 'ads-admin-intro card';
    info.innerHTML = `<div class="ads-admin-intro-icon">${icon('megaphone', 24)}</div><div><strong>Central de Publicidade / ADS</strong><p>Aqui o Administrador publica e gere os banners comerciais que aparecem automaticamente no carrossel de publicidade do CONVIVA.</p></div><span>ADMIN · PUBLICIDADE</span>`;
    screenBody.appendChild(info);
  }

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
