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
   Cada papel (síndico / morador / admin) tem a sua própria tela e o seu
   próprio formulário — nenhum seletor de papel dentro do formulário, o
   papel já vem fixo pela tela onde a pessoa entrou.
   --------------------------------------------------------------------------- */
function initLogin() {
  // Tela de escolha "Entrar como…" — os dois cartões grandes funcionam
  // exatamente como os da escolha de cadastro (clicáveis + teclado).
  const sindicoCard = document.getElementById('btn-login-sindico');
  const moradorCard = document.getElementById('btn-login-morador');
  if (sindicoCard) sindicoCard.addEventListener('click', () => showScreen('screen-login-sindico'));
  if (moradorCard) moradorCard.addEventListener('click', () => showScreen('screen-login-morador'));
  [sindicoCard, moradorCard].forEach(card => {
    if (!card) return;
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  // Cada formulário entra diretamente no papel correspondente à sua tela.
  const loginForms = [
    { id: 'login-form-sindico', role: 'sindico' },
    { id: 'login-form-morador', role: 'morador' },
    { id: 'login-form-porteiro', role: 'porteiro' },
    { id: 'login-form-admin', role: 'admin' },
  ];
  loginForms.forEach(({ id, role }) => {
    const form = document.getElementById(id);
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      // ------------------------------------------------------------------
      // Endpoint real: POST /auth/login  { email, senha }
      // (aqui não fazemos nenhuma verificação real, é só um mockup visual)
      // ------------------------------------------------------------------
      goToApp(role);
    });
  });
}

/* ---------------------------------------------------------------------------
   CADASTRO
   --------------------------------------------------------------------------- */
function initCadastro() {
  const sindicoCard = document.getElementById('btn-cadastro-sindico');
  const moradorCard = document.getElementById('btn-cadastro-morador');
  sindicoCard.addEventListener('click', () => showScreen('screen-cadastro-sindico'));
  moradorCard.addEventListener('click', () => showScreen('screen-cadastro-morador'));
  // Os cartões usam role="button" (não são <button> nativos), então garantimos
  // que também respondem a Enter/Espaço para quem navega pelo teclado.
  [sindicoCard, moradorCard].forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });

  initCadastroSindicoWizard();

  document.getElementById('form-cadastro-morador').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /morador-publico
    // (o morador nasce sem unidade vinculada; o síndico vincula depois)
    // ------------------------------------------------------------------
    alert('Cadastro simulado com sucesso! Assim que o síndico vincular a sua unidade, ela vai aparecer na sua área.');
    e.target.reset();
    showScreen('screen-login-morador');
  });
}

/* ---------------------------------------------------------------------------
   ASSISTENTE DE CADASTRO DO SÍNDICO — dados → plano → pagamento → confirmação.
   Tudo simulado no cliente (sem chamadas reais), mas já organizado nos passos
   e nos pontos exatos onde entra a integração com o backend/gateway de
   pagamento — ver comentários "Endpoint real" abaixo.
   --------------------------------------------------------------------------- */
function initCadastroSindicoWizard() {
  const wizard = document.getElementById('screen-cadastro-sindico');
  const panels = wizard.querySelectorAll('.signup-panel');
  const steps = wizard.querySelectorAll('.signup-step');
  let selectedPlan = { name: 'Profissional', price: '35.000 Kz/mês' };

  function goToPanel(panelId) {
    panels.forEach(p => p.classList.toggle('active', p.dataset.panel === String(panelId)));
    // O passo "processing" é uma transição visual do passo 3 (pagamento),
    // por isso mantém o indicador de passos em "3" enquanto ele é mostrado.
    const stepNum = panelId === 'processing' ? 3 : Number(panelId);
    steps.forEach(s => {
      const n = Number(s.dataset.step);
      s.classList.toggle('done', n < stepNum);
      s.classList.toggle('active', n === stepNum);
    });
  }

  // -------- Passo 1 → 2 (dados do condomínio) --------
  document.getElementById('form-cadastro-sindico').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /condominio  (cria o condomínio + o login do síndico)
    // ------------------------------------------------------------------
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
    goToPanel(2);
  });

  // -------- Passo 2 → 3 (escolha de plano) --------
  document.getElementById('btn-plano-voltar').addEventListener('click', () => goToPanel(1));
  document.getElementById('btn-plano-continuar').addEventListener('click', () => {
    const chosen = wizard.querySelector('input[name="signup-plan"]:checked');
    const option = chosen.closest('.signup-plan-option');
    selectedPlan = { name: chosen.value, price: option.dataset.planPrice };
    document.getElementById('summary-plan-name').textContent = selectedPlan.name;
    document.getElementById('summary-plan-price').textContent = selectedPlan.price;
    goToPanel(3);
  });

  // -------- Passo 3 (pagamento) --------
  document.getElementById('btn-pagamento-voltar').addEventListener('click', () => goToPanel(2));

  // Formatação cosmética dos campos do cartão (mockup — sem validação real de bandeira/Luhn)
  const numeroInput = document.getElementById('pg-numero');
  numeroInput.addEventListener('input', () => {
    numeroInput.value = numeroInput.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
  const validadeInput = document.getElementById('pg-validade');
  validadeInput.addEventListener('input', () => {
    let v = validadeInput.value.replace(/\D/g, '').slice(0, 4);
    if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
    validadeInput.value = v;
  });
  const cvcInput = document.getElementById('pg-cvc');
  cvcInput.addEventListener('input', () => { cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4); });

  document.getElementById('form-pagamento').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: POST /pagamentos/checkout  { plano, dados_cartao (tokenizados no gateway) }
    // O ideal em produção é nunca enviar o número do cartão diretamente ao
    // nosso backend — usar o SDK do gateway (Stripe, Multicaixa Express, etc.)
    // para tokenizar no cliente e enviar só o token.
    // ------------------------------------------------------------------
    if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
    goToPanel('processing');
    setTimeout(() => {
      document.getElementById('success-plan-name').textContent = selectedPlan.name;
      document.getElementById('success-plan-price').textContent = selectedPlan.price;
      goToPanel(4);
    }, 1500);
  });

  // -------- Passo 4 (confirmação) → login liberado --------
  document.getElementById('btn-signup-finalizar').addEventListener('click', () => {
    // ------------------------------------------------------------------
    // Endpoint real: POST /auth/login  (sessão iniciada automaticamente
    // depois de o pagamento e o cadastro serem confirmados no backend)
    // ------------------------------------------------------------------
    document.getElementById('form-cadastro-sindico').reset();
    document.getElementById('form-pagamento').reset();
    goToPanel(1);
    showScreen('screen-login-sindico');
  });
}

/* ---------------------------------------------------------------------------
   APLICAÇÃO (Admin / Síndico / Morador)
   --------------------------------------------------------------------------- */
const ROLE_LABELS = { admin: 'Administrador da Plataforma', sindico: 'Síndico', morador: 'Morador', porteiro: 'Porteiro' };
const ROLE_BADGE_LABELS = { admin: 'ADM', sindico: 'Síndico', morador: 'Morador', porteiro: 'Porteiro' };

function goToApp(role) {
  // Validação defensiva: evita que um papel inválido deixe a aplicação numa
  // tela intermédia ou provoque um erro de acesso a MENUS[role].
  if (!ROLE_LABELS[role] || !MENUS[role]) {
    console.error('Perfil de acesso inválido:', role);
    showToast('Não foi possível iniciar a sessão. Tente novamente.');
    return;
  }

  APP_STATE.role = role;
  editingState = {}; // limpa qualquer edição pendente de uma sessão anterior

  const roleBadgeEl = document.getElementById('app-role-label');
  const profileNameEl = document.getElementById('topbar-profile-name');
  if (roleBadgeEl) {
    roleBadgeEl.textContent = ROLE_BADGE_LABELS[role];
    roleBadgeEl.title = ROLE_LABELS[role];
  }
  if (profileNameEl) profileNameEl.textContent = ROLE_LABELS[role];
  document.body.setAttribute('data-role', role);

  // Mostra primeiro a área logada. Assim, um erro isolado num gráfico do
  // dashboard nunca impede o utilizador de entrar na aplicação.
  showScreen('screen-app');

  try {
    buildSidebar(role);
    renderHomeScreen();
  } catch (error) {
    console.error('Erro ao montar o dashboard:', error);
    renderHomeFallback(error);
  }
}

// Fallback seguro para garantir o acesso ao sistema mesmo que um componente
// visual do dashboard falhe. Os menus continuam funcionais e o erro fica
// isolado da autenticação.
function renderHomeFallback(error) {
  const body = document.getElementById('generic-screen-body');
  if (!body) return;
  body.innerHTML = `
    <div class="screen-heading"><h2>Bem-vindo à sua área</h2></div>
    <div class="table-card glass home-fallback-card">
      <h3>Dashboard temporariamente indisponível</h3>
      <p>A sessão foi iniciada com sucesso. Pode continuar a utilizar todos os módulos pelo menu lateral.</p>
      <button type="button" class="btn btn-primary" id="btn-retry-dashboard">Tentar carregar novamente</button>
    </div>
  `;
  const retry = document.getElementById('btn-retry-dashboard');
  if (retry) retry.addEventListener('click', () => {
    try { renderHomeScreen(); } catch (retryError) { console.error('Erro ao recarregar dashboard:', retryError); }
  });
}

/* ---------------------------------------------------------------------------
   Menu mobile — a sidebar vira uma gaveta lateral (off-canvas) em ecrãs
   pequenos, aberta/fechada pelo botão de hambúrguer na topbar.
   --------------------------------------------------------------------------- */
function initMobileMenu() {
  const sidebar = document.getElementById('app-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggleBtn = document.getElementById('btn-menu-toggle');
  if (!sidebar || !overlay || !toggleBtn) return;

  function setOpen(open) {
    sidebar.classList.toggle('sidebar-open', open);
    overlay.classList.toggle('sidebar-overlay-visible', open);
  }

  toggleBtn.addEventListener('click', () => setOpen(!sidebar.classList.contains('sidebar-open')));
  overlay.addEventListener('click', () => setOpen(false));
  sidebar.addEventListener('click', e => {
    if (e.target.closest('.sidebar-link')) setOpen(false);
  });
}

function logout() {
  APP_STATE.role = null;
  showScreen('screen-landing');
}

/* ---------------------------------------------------------------------------
   Menu do perfil no topo (o "boneco" no header da área logada) — abre um
   menu pequeno com "Editar perfil" e "Sair".
   --------------------------------------------------------------------------- */
function initTopbarProfile() {
  const wrap = document.getElementById('topbar-profile');
  const btn = document.getElementById('btn-topbar-profile');
  const menu = document.getElementById('topbar-profile-menu');
  if (!wrap || !btn || !menu) return;

  function setOpen(open) {
    wrap.classList.toggle('topbar-profile-open', open);
  }

  btn.addEventListener('click', () => setOpen(!wrap.classList.contains('topbar-profile-open')));
  document.addEventListener('click', e => {
    if (!wrap.classList.contains('topbar-profile-open')) return;
    if (e.target.closest('#topbar-profile')) return;
    setOpen(false);
  });

  document.getElementById('btn-topbar-editar-perfil').addEventListener('click', () => {
    setOpen(false);
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    renderPerfilScreen();
  });
  document.getElementById('btn-topbar-logout').addEventListener('click', () => {
    setOpen(false);
    logout();
  });
}

/* ---------------------------------------------------------------------------
   Tela "Editar perfil" — dados da própria conta (nome, email, telefone,
   senha). Fora do padrão de CRUD porque não é uma lista, é a conta atual.
   --------------------------------------------------------------------------- */

function renderAdsCarousel(body, role) {
  const audience = role === 'sindico' ? 'Síndicos' : role === 'morador' ? 'Moradores' : role === 'porteiro' ? 'Porteiros' : 'Todos';
  const today = new Date().toISOString().slice(0, 10);
  const ads = (DB.anuncios || []).filter(a => {
    const active = a.estado === 'Ativo';
    const audienceOk = ['Todos', audience].includes(a.publico);
    const dateOk = (!a.data_inicio || a.data_inicio <= today) && (!a.data_fim || a.data_fim >= today);
    return active && audienceOk && dateOk;
  });
  if (!ads.length) return;

  const wrap = document.createElement('section');
  wrap.className = 'ads-carousel-simple';
  wrap.innerHTML = `
    <div class="ads-label"><span></span> Publicidade</div>
    <div class="ads-viewport"><div class="ads-track"></div></div>`;

  const track = wrap.querySelector('.ads-track');
  const viewport = wrap.querySelector('.ads-viewport');
  let current = 1;
  let timer = null;
  let isAnimating = false;
  const duration = 4800;

  // Clones nas extremidades para criar um loop visual contínuo.
  const slides = [ads[ads.length - 1], ...ads, ads[0]];
  slides.forEach((a, i) => {
    const slide = document.createElement('a');
    slide.className = 'ads-slide-simple';
    slide.href = a.link && a.link !== '#' ? a.link : '#';
    if (a.link && a.link !== '#') {
      slide.target = '_blank';
      slide.rel = 'noopener noreferrer';
    } else {
      slide.addEventListener('click', e => e.preventDefault());
    }
    slide.setAttribute('aria-label', `Publicidade: ${a.titulo || 'Anúncio'}`);
    slide.innerHTML = a.imagem
      ? `<img src="${a.imagem}" alt="${a.titulo || 'Publicidade'}" loading="lazy">`
      : `<div class="ads-slide-fallback"><strong>${a.anunciante || 'Publicidade'}</strong><span>${a.titulo || ''}</span></div>`;
    track.appendChild(slide);
  });

  function position(animate = true) {
    track.style.transition = animate ? 'transform .65s cubic-bezier(.22,.61,.36,1)' : 'none';
    track.style.transform = `translate3d(-${current * 100}%,0,0)`;
  }

  function next() {
    if (isAnimating || ads.length < 2) return;
    isAnimating = true;
    current += 1;
    position(true);
  }

  track.addEventListener('transitionend', () => {
    if (current === ads.length + 1) {
      current = 1;
      position(false);
    } else if (current === 0) {
      current = ads.length;
      position(false);
    }
    isAnimating = false;
  });

  function start() {
    clearInterval(timer);
    if (ads.length > 1) timer = setInterval(next, duration);
  }

  viewport.addEventListener('mouseenter', () => clearInterval(timer));
  viewport.addEventListener('mouseleave', start);
  viewport.addEventListener('touchstart', () => clearInterval(timer), { passive: true });
  viewport.addEventListener('touchend', start, { passive: true });

  // Swipe simples no mobile.
  let touchX = null;
  viewport.addEventListener('touchstart', e => { touchX = e.changedTouches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', e => {
    if (touchX === null) return;
    const delta = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(delta) > 45) {
      if (delta < 0) next();
      else if (!isAnimating && ads.length > 1) { current -= 1; position(true); }
    }
  }, { passive: true });

  body.appendChild(wrap);
  requestAnimationFrame(() => position(false));
  start();
}

function renderComunicadosMoradorScreen(){
  const body=document.getElementById('generic-screen-body');body.innerHTML='';
  const items=DB.comunicadosView||[];
  body.innerHTML=`<div class="screen-heading"><div><h2>Comunicados</h2><p>Informações oficiais do condomínio.</p></div></div><div class="announcement-list">${items.map((c,i)=>`<button type="button" class="announcement-item card" data-announcement="${i}"><span class="announcement-icon">${icon('megaphone',20)}</span><span><strong>${c.titulo}</strong><small>${c.mensagem}</small></span><span>${icon('chevronRight',16)}</span></button>`).join('')||'<div class="home-empty-state">Não existem comunicados.</div>'}</div>`;
  body.querySelectorAll('[data-announcement]').forEach(b=>b.onclick=()=>{const c=items[Number(b.dataset.announcement)];renderComunicadoDetail(c);});
}
function renderComunicadoDetail(c){
  const body=document.getElementById('generic-screen-body');body.innerHTML=`<div class="screen-heading"><button class="btn btn-secondary" id="back-comunicados">${icon('arrowLeft',15)} Voltar</button></div><article class="communication-detail card"><div class="communication-detail-icon">${icon('megaphone',28)}</div><span class="home-eyebrow">Comunicado do condomínio</span><h2>${c.titulo||'Comunicado'}</h2><p class="communication-date">Publicado recentemente</p><div class="communication-body">${String(c.mensagem||'').replace(/\n/g,'<br>')}</div><div class="communication-footer"><span>CONVIVA</span><span>Informação oficial</span></div></article>`;body.querySelector('#back-comunicados').onclick=renderComunicadosMoradorScreen;
}

function renderCustomScreen(screen) {
  if(screen==='chat') return renderChatScreen();
  if(screen==='mensalidade') return renderMensalidadeScreen();
  if(screen==='pagar') return renderPagarMensalidadeScreen();
  if(screen==='manutencoesMorador') return renderManutencoesMoradorScreen();
  if(screen==='pesquisaPortaria') return renderPesquisaPortariaScreen();
}

function renderChatScreen(){
  const body=document.getElementById('generic-screen-body'); body.innerHTML='';
  const card=document.createElement('section'); card.className='chat-shell card';
  const messages=[['João Manuel','Bom dia a todos. A manutenção do elevador está agendada.','09:12'],['Maria José','Obrigada pelo aviso.','09:18'],['Síndico','A equipa técnica estará no Bloco A às 14h.','09:26'],['Carlos Pedro','Perfeito, obrigado.','09:31']];
  card.innerHTML=`<aside class="chat-members"><div class="chat-title"><div><span class="home-eyebrow">Comunidade</span><h2>Chat do Condomínio</h2></div><span class="chat-online">${messages.length+8} membros</span></div><input class="chat-search" placeholder="Pesquisar conversa..."><div class="chat-member-list">${['Síndico','Maria José','João Manuel','Carlos Pedro','Ana Paula'].map((n,i)=>`<div class="chat-member"><span class="chat-avatar">${n[0]}</span><div><strong>${n}</strong><small>${i===0?'Administrador do condomínio':'Morador'}</small></div></div>`).join('')}</div></aside><section class="chat-main"><header><div><strong>Grupo do condomínio</strong><small>Todos os membros autorizados</small></div><span class="status-badge status-ok">Online</span></header><div class="chat-messages"></div><form class="chat-compose"><input required placeholder="Escreva uma mensagem..."><button class="btn btn-primary" type="submit">Enviar</button></form></section>`;
  const list=card.querySelector('.chat-messages'); messages.forEach((m,i)=>{const el=document.createElement('div');el.className='chat-message '+(i===2?'mine':'');el.innerHTML=`<div class="chat-bubble"><strong>${m[0]}</strong><p>${m[1]}</p><small>${m[2]}</small></div>`;list.appendChild(el);});
  card.querySelector('.chat-compose').addEventListener('submit',e=>{e.preventDefault();const input=e.target.querySelector('input');const el=document.createElement('div');el.className='chat-message mine';el.innerHTML=`<div class="chat-bubble"><strong>Você</strong><p>${input.value.replace(/[<>]/g,'')}</p><small>agora</small></div>`;list.appendChild(el);input.value='';list.scrollTop=list.scrollHeight;showToast('Mensagem enviada.');});
  body.appendChild(card);
}

function renderMensalidadeScreen(){
  const body=document.getElementById('generic-screen-body'); body.innerHTML=''; const taxa=(DB.taxas||[])[0]||{valor_taxa:0,valor_multa:0,data_limite:'—'};
  body.innerHTML=`<div class="screen-heading"><h2>Minha Mensalidade</h2><span class="readonly-tag">Valor definido pelo condomínio</span></div><div class="payment-overview-grid"><div class="payment-main-card card"><span>Mensalidade atual</span><strong>${formatNumber(taxa.valor_taxa)} Kz</strong><small>Vencimento: ${taxa.data_limite}</small><button class="btn btn-primary" id="btn-pay-now">Pagar mensalidade</button></div><div class="payment-info-card card"><div><span>Multa por atraso</span><strong>${formatNumber(taxa.valor_multa)} Kz</strong></div><div><span>Estado</span><strong class="badge badge-yellow">Pendente</strong></div><div><span>Referência</span><strong>CONVIVA-2026-08</strong></div></div></div><div class="table-card glass"><div class="table-card-header"><h3>Histórico recente</h3></div><div class="payment-history">${(DB.meusPagamentos||[]).map(p=>`<div><span>${p.mes_pago}</span><strong>${formatNumber(taxa.valor_taxa)} Kz</strong><span class="badge ${p.estado==='Pago'?'badge-green':p.estado==='Atrasado'?'badge-red':'badge-yellow'}">${p.estado}</span></div>`).join('')}</div></div>`;
  body.querySelector('#btn-pay-now').onclick=()=>renderPagarMensalidadeScreen();
}

function renderPagarMensalidadeScreen(){
  const body=document.getElementById('generic-screen-body'); body.innerHTML=''; const taxa=(DB.taxas||[])[0]||{valor_taxa:0,data_limite:'—'};
  body.innerHTML=`<div class="screen-heading"><h2>Pagar Mensalidade</h2></div><div class="pay-layout"><form class="form-card glass pay-form"><div class="form-card-header"><h3>Confirmar pagamento</h3><p>O valor da mensalidade é definido pelo condomínio e não pode ser alterado.</p></div><div class="pay-amount"><span>Valor a pagar</span><strong>${formatNumber(taxa.valor_taxa)} Kz</strong></div><label>Mês de referência<select required><option>Setembro 2026</option><option>Agosto 2026</option></select></label><label>Método de pagamento<select required><option>Referência</option><option>Transferência bancária</option><option>Multicaixa Express</option></select></label><label>Referência<input value="CONVIVA-2026-09-001" readonly></label><button class="btn btn-primary btn-block" type="submit">Confirmar pagamento</button></form><div class="payment-steps card"><div><span>01</span><strong>Confirmar mensalidade</strong><p>Confira o mês e o valor.</p></div><div><span>02</span><strong>Escolher método</strong><p>Use o método disponível.</p></div><div><span>03</span><strong>Receber comprovativo</strong><p>O comprovativo fica disponível no histórico.</p></div></div></div>`;
  body.querySelector('form').addEventListener('submit',e=>{e.preventDefault();const id=(DB.meusPagamentos||[]).length+1;DB.meusPagamentos.push({id,mes_pago:'2026-09-01',estado:'Pago',data_pagamento:new Date().toISOString().slice(0,10),id_taxa:taxa.id||1});showToast('Pagamento registado com sucesso.');renderMeusPagamentosScreen();});
}

function renderMeusPagamentosScreen(){
  const body=document.getElementById('generic-screen-body');body.innerHTML=''; const taxa=(DB.taxas||[])[0]||{valor_taxa:0};
  const rows=DB.meusPagamentos||[];
  body.innerHTML=`<div class="screen-heading"><h2>Meus Pagamentos</h2><button class="btn btn-primary" id="btn-new-payment">Pagar mensalidade</button></div><div class="table-card glass"><div class="table-card-header"><h3>Histórico de pagamentos</h3><span class="entity-card-id">${rows.length} registo(s)</span></div><div class="table-toolbar"><input id="payment-search" class="table-search-input" placeholder="Pesquisar por mês ou estado..."></div><div class="responsive-table"><table class="crud-table"><thead><tr><th>Mês</th><th>Valor</th><th>Estado</th><th>Data</th><th>Ações</th></tr></thead><tbody id="payments-body"></tbody></table></div></div>`;
  const draw=()=>{const q=(document.getElementById('payment-search').value||'').toLowerCase();document.getElementById('payments-body').innerHTML=rows.filter(r=>(r.mes_pago+' '+r.estado).toLowerCase().includes(q)).map(r=>`<tr><td>${r.mes_pago}</td><td>${formatNumber(taxa.valor_taxa)} Kz</td><td><span class="badge ${r.estado==='Pago'?'badge-green':r.estado==='Atrasado'?'badge-red':'badge-yellow'}">${r.estado}</span></td><td>${r.data_pagamento||'—'}</td><td><button class="icon-action-btn" data-receipt="${r.id}" title="Baixar comprovativo">${icon('receipt',15)}</button></td></tr>`).join('')||'<tr><td colspan="5">Nenhum pagamento encontrado.</td></tr>';document.querySelectorAll('[data-receipt]').forEach(b=>b.onclick=()=>downloadReceipt(Number(b.dataset.receipt)));};
  draw();document.getElementById('payment-search').oninput=draw;document.getElementById('btn-new-payment').onclick=()=>renderPagarMensalidadeScreen();
}
function downloadReceipt(id){const r=(DB.meusPagamentos||[]).find(x=>x.id===id);if(!r)return;const taxa=(DB.taxas||[])[0]||{valor_taxa:0};const html=`<!doctype html><html lang=\"pt\"><head><meta charset=\"utf-8\"><title>Comprovativo de pagamento</title><style>body{font-family:Arial,sans-serif;padding:42px;color:#16213a;max-width:760px;margin:auto}h1{margin-bottom:28px}.box{border:1px solid #d8deea;border-radius:16px;padding:24px}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #edf0f5}.row:last-child{border-bottom:0}.brand{font-size:24px;font-weight:800;margin-bottom:20px}</style></head><body><div class=\"brand\">CONVIVA</div><h1>Comprovativo de pagamento</h1><div class=\"box\"><div class=\"row\"><span>Mês</span><strong>${r.mes_pago}</strong></div><div class=\"row\"><span>Valor</span><strong>${formatNumber(taxa.valor_taxa)} Kz</strong></div><div class=\"row\"><span>Estado</span><strong>${r.estado}</strong></div><div class=\"row\"><span>Data</span><strong>${r.data_pagamento||'—'}</strong></div><div class=\"row\"><span>Referência</span><strong>CONVIVA-${r.id}</strong></div></div></body></html>`;const blob=new Blob([html],{type:'text/html;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`comprovativo-pagamento-${r.id}.html`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast('Comprovativo preparado para download.');}

function renderManutencoesMoradorScreen(){
  const body=document.getElementById('generic-screen-body');body.innerHTML=`<div class="screen-heading"><h2>Manutenções do Condomínio</h2><span class="readonly-tag">Consulta</span></div><div class="maintenance-grid">${(DB.manutencoes||[]).map(m=>`<article class="maintenance-card card"><div class="maintenance-icon">${icon('wrench',22)}</div><div><span class="badge ${m.estado==='Concluída'?'badge-green':m.estado==='Cancelada'?'badge-red':'badge-yellow'}">${m.estado}</span><h3>${m.titulo}</h3><p>${m.descricao}</p><div class="maintenance-meta"><span>${icon('mapPin',14)} ${m.local}</span><span>${icon('calendar',14)} ${m.data_prevista||'Sem data'}</span><span>${formatNumber(m.custo||0)} Kz</span></div></div></article>`).join('')}</div>`;
}

function renderPerfilScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Editar perfil</h2>';
  body.appendChild(heading);

  const p = document.createElement('p');
  p.className = 'home-intro';
  p.textContent = 'Estes dados são só um mockup — nada é enviado a nenhum servidor.';
  body.appendChild(p);

  const nomeAtual = document.getElementById('topbar-profile-name').textContent.trim() || `${ROLE_LABELS[APP_STATE.role]} Exemplo`;

  // -------- Cabeçalho do perfil: avatar, nome e badge de perfil --------
  const banner = document.createElement('div');
  banner.className = 'profile-banner card';
  banner.innerHTML = `
    <span class="profile-banner-avatar">${icon('user', 30)}</span>
    <div class="profile-banner-info">
      <span class="profile-banner-name" id="profile-banner-name">${nomeAtual}</span>
      <span class="profile-banner-meta">
        <span class="sidebar-role-badge profile-banner-badge">${ROLE_BADGE_LABELS[APP_STATE.role]}</span>
        <span id="profile-banner-email">voce@exemplo.com</span>
      </span>
    </div>
  `;
  body.appendChild(banner);

  // -------- Corpo: dados pessoais + segurança lado a lado --------
  const grid = document.createElement('div');
  grid.className = 'profile-sections-grid';
  grid.innerHTML = `
    <form class="table-card glass profile-section-card" id="form-perfil-dados">
      <h3>Dados pessoais</h3>
      <p class="form-hint">Como o teu nome e contacto aparecem no sistema.</p>
      <div class="form-row">
        <label for="perfil-nome">Nome</label>
        <input type="text" id="perfil-nome" value="${nomeAtual}">
      </div>
      <div class="form-row">
        <label for="perfil-email">Email</label>
        <input type="email" id="perfil-email" value="voce@exemplo.com">
      </div>
      <div class="form-row">
        <label for="perfil-telefone">Telefone</label>
        <input type="tel" id="perfil-telefone" value="900 000 000">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Guardar dados</button>
      </div>
    </form>

    <form class="table-card glass profile-section-card" id="form-perfil-seguranca">
      <h3>Segurança</h3>
      <p class="form-hint">Deixa em branco para manter a senha atual.</p>
      <div class="form-row">
        <label for="perfil-senha-atual">Senha atual</label>
        <input type="password" id="perfil-senha-atual" placeholder="••••••••">
      </div>
      <div class="form-row">
        <label for="perfil-senha">Nova senha</label>
        <input type="password" id="perfil-senha" placeholder="Deixa em branco para manter a atual">
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Atualizar senha</button>
      </div>
    </form>

    <div class="table-card glass profile-section-card">
      <h3>Preferências</h3>
      <p class="form-hint">Aparência da interface neste dispositivo.</p>
      <div class="profile-theme-row">
        <div>
          <span class="profile-theme-label">Tema escuro</span>
          <span class="profile-theme-sub">Alterna entre o visual claro e escuro do sistema</span>
        </div>
        <button type="button" class="theme-toggle profile-theme-switch" role="switch" aria-checked="false" title="Mudar tema">
          <span class="profile-theme-switch-dot"></span>
        </button>
      </div>
    </div>
  `;
  body.appendChild(grid);
  body.appendChild(buildApiNote({ update: 'PUT /conta/perfil' }));

  document.getElementById('form-perfil-dados').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: PUT /conta/perfil  { nome, email, telefone }
    // ------------------------------------------------------------------
    const novoNome = document.getElementById('perfil-nome').value || ROLE_LABELS[APP_STATE.role];
    document.getElementById('topbar-profile-name').textContent = novoNome;
    document.getElementById('profile-banner-name').textContent = novoNome;
    document.getElementById('profile-banner-email').textContent = document.getElementById('perfil-email').value;
    showToast('Dados do perfil atualizados.');
  });

  document.getElementById('form-perfil-seguranca').addEventListener('submit', e => {
    e.preventDefault();
    // ------------------------------------------------------------------
    // Endpoint real: PUT /conta/senha  { senha_atual, nova_senha }
    // ------------------------------------------------------------------
    e.target.reset();
    showToast('Senha atualizada.');
  });
}

/* ---------------------------------------------------------------------------
   Menu mobile da landing page (hambúrguer no header público)
   --------------------------------------------------------------------------- */
function initLandingMenu() {
  const toggleBtn = document.getElementById('btn-landing-menu');
  const menu = document.getElementById('landing-mobile-menu');
  if (!toggleBtn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle('landing-mobile-menu-open', open);
    toggleBtn.setAttribute('aria-expanded', String(open));
  }

  toggleBtn.addEventListener('click', () => {
    setOpen(!menu.classList.contains('landing-mobile-menu-open'));
  });
  menu.addEventListener('click', e => {
    if (e.target.closest('a, button')) setOpen(false);
  });
  document.addEventListener('click', e => {
    if (!menu.classList.contains('landing-mobile-menu-open')) return;
    if (e.target.closest('#landing-mobile-menu') || e.target.closest('#btn-landing-menu')) return;
    setOpen(false);
  });
}

function buildSidebar(role) {
  const nav = document.getElementById('app-sidebar-nav');
  nav.innerHTML = '';

  function dispatch(item, btn) {
    document.querySelectorAll('.sidebar-link').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (item.type === 'home') renderHomeScreen();
    else if (item.type === 'entity') {
      if (item.entity === 'comunicadosView') renderComunicadosMoradorScreen();
      else if (item.entity === 'meusPagamentos') renderMeusPagamentosScreen();
      else renderEntityScreen(item.entity);
    }
    else if (item.type === 'vincular') renderVincularScreen();
    else if (item.type === 'minhaUnidade') renderMinhaUnidadeScreen();
    else if (item.type === 'votar') renderVotacoesMoradorScreen();
    else if (item.type === 'visitasPorteiro') renderPorteiroVisitasScreen();
    else if (item.type === 'veiculosPorteiro') renderPorteiroVeiculosScreen();
    else if (item.type === 'custom') renderCustomScreen(item.screen);
  }

  function buildLink(item) {
    const btn = document.createElement('button');
    btn.className = 'sidebar-link';
    btn.innerHTML = `<span class="sidebar-icon">${icon(item.icon, 17)}</span><span>${item.label}</span>`;
    btn.addEventListener('click', () => dispatch(item, btn));
    return btn;
  }

  MENUS[role].forEach(entry => {
    if (entry.group) {
      // Secção com cabeçalho clicável (expande/recolhe a sublista) — igual
      // ao padrão "GERENCIAMENTO DE X" de referência.
      const section = document.createElement('div');
      section.className = 'sidebar-section';

      const header = document.createElement('button');
      header.type = 'button';
      header.className = 'sidebar-section-header';
      header.innerHTML = `
        <span class="sidebar-icon">${icon(entry.icon, 16)}</span>
        <span class="sidebar-section-label">${entry.group}</span>
        <span class="sidebar-section-caret">${icon('chevronRight', 14)}</span>
      `;

      const list = document.createElement('div');
      list.className = 'sidebar-section-list';
      entry.items.forEach(item => list.appendChild(buildLink(item)));

      // Secções começam recolhidas — a pessoa abre a que precisa.
      section.classList.toggle('sidebar-section-open', true);

      header.addEventListener('click', () => {
        section.classList.toggle('sidebar-section-open');
      });

      section.appendChild(header);
      section.appendChild(list);
      nav.appendChild(section);
    } else {
      nav.appendChild(buildLink(entry));
    }
  });

  // seleciona "Início" por padrão
  const first = nav.querySelector('.sidebar-link');
  if (first) first.classList.add('active');
}

/* ---------------------------------------------------------------------------
   Tela "Início" — resumo do perfil atual. Em vez de um mosaico de quadrados
   repetidos, usa alguns cartões finos (para os números mais importantes) e
   gráficos pensados para o que cada perfil realmente precisa de ver de
   relance (finanças e ocorrências para o síndico, pagamentos para o
   morador, situação das visitas para o porteiro).
   --------------------------------------------------------------------------- */
function addChartCard(grid, titleText, subtitleText, drawFn, opts) {
  const card = document.createElement('div');
  card.className = 'table-card glass home-chart-card' + (opts && opts.wide ? ' home-chart-card-wide' : '');
  card.innerHTML = `
    <div class="table-card-header home-chart-header">
      <div>
        <h3>${titleText}</h3>
        ${subtitleText ? `<p class="home-chart-subtitle">${subtitleText}</p>` : ''}
      </div>
    </div>
  `;
  const slot = document.createElement('div');
  card.appendChild(slot);
  drawFn(slot);
  grid.appendChild(card);
  return card;
}

function renderHomeScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  renderAdsCarousel(body, APP_STATE.role);

  const role = APP_STATE.role;
  const isSindico = role === 'sindico';
  const isMorador = role === 'morador';
  const isPorteiro = role === 'porteiro';
  const entityItems = flatMenuItems(role).filter(item => item.type === 'entity');

  // Cabeçalho executivo: a tela inicial deve parecer um centro de comando,
  // não uma página de CRUD.
  const heading = document.createElement('div');
  heading.className = 'home-hero';
  heading.innerHTML = `
    <div class="home-hero-copy">
      <div class="home-eyebrow"><span class="home-live-dot"></span> Visão geral do condomínio</div>
      <h2>Bom dia, ${ROLE_LABELS[role]}</h2>
      <p>Acompanhe os principais indicadores, operações e pontos que precisam de atenção.</p>
    </div>
    <div class="home-hero-meta">
      <span class="home-period">${new Date().toLocaleDateString('pt-PT', {day:'2-digit', month:'long', year:'numeric'})}</span>
      <span class="status-badge status-ok">Sistema operacional</span>
    </div>
  `;
  body.appendChild(heading);

  const stats = document.createElement('div');
  stats.className = 'home-kpi-grid';

  const paymentTotal = DB.pagamentos ? DB.pagamentos.length : 0;
  const paid = DB.pagamentos ? DB.pagamentos.filter(p => p.estado === 'Pago').length : 0;
  const pending = DB.pagamentos ? DB.pagamentos.filter(p => p.estado === 'Pendente').length : 0;
  const overdue = DB.pagamentos ? DB.pagamentos.filter(p => p.estado === 'Atrasado').length : 0;
  const collectionRate = paymentTotal ? Math.round(paid / paymentTotal * 100) : 0;
  const expenses = (DB.despesas || []).reduce((s,d)=>s+Number(d.valor||0),0);
  const openIncidents = (DB.ocorrencias || []).filter(o => o.estado !== 'Resolvido').length;
  const resolvedIncidents = (DB.ocorrencias || []).filter(o => o.estado === 'Resolvido').length;
  const units = (DB.unidades || []).length;
  const residents = (DB.moradores || []).length;

  const kpi = (label, value, meta, iconName, trend, points, tone) => {
    const card=document.createElement('div');
    card.className='home-kpi card';
    card.innerHTML=`
      <div class="home-kpi-top">
        <span class="home-kpi-icon ${tone||''}">${icon(iconName,18)}</span>
        <span class="home-kpi-label">${label}</span>
        ${trend ? `<span class="home-kpi-trend ${trend.startsWith('-')?'down':'up'}">${trend}</span>` : ''}
      </div>
      <div class="home-kpi-bottom">
        <div>
          <strong class="home-kpi-value brut-num">${value}</strong>
          <span class="home-kpi-meta">${meta}</span>
        </div>
        <span class="home-kpi-spark" data-points="${(points||[]).join(',')}"></span>
      </div>`;
    const spark=card.querySelector('.home-kpi-spark');
    if(points && points.length>1) buildSparkline(spark,points);
    stats.appendChild(card);
  };

  if (isSindico) {
    // Os sparklines do síndico usam apenas dados existentes no DB.
    // Quando não há histórico suficiente, não desenhamos uma tendência fictícia.
    const paymentMonths = getDashboardMonthKeys(6);
    const paymentCountByMonth = key => (DB.pagamentos || []).filter(p => dashboardMonthKey(p.mes_pago) === key).length;
    const overdueByMonth = key => (DB.pagamentos || []).filter(p => dashboardMonthKey(p.mes_pago) === key && p.estado === 'Atrasado').length;
    const openIncidentTotal = (DB.ocorrencias || []).filter(o => o.estado !== 'Resolvido').length;

    kpi('Moradores', residents, 'registados no condomínio', 'users', null, null, 'blue');
    kpi('Cobrança realizada', `${collectionRate}%`, `${paid} de ${paymentTotal} pagamentos`, 'coins', collectionRate >= 70 ? '+ saudável' : 'atenção',
      paymentMonths.map(paymentCountByMonth), 'green');
    kpi('Em atraso', overdue, 'pagamentos que exigem ação', 'alert', overdue ? `+${overdue}` : 'controlado',
      paymentMonths.map(overdueByMonth), 'red');
    kpi('Ocorrências abertas', openIncidentTotal, `${resolvedIncidents} resolvida(s)`, 'tool', null, null, 'orange');
  } else if (isMorador) {
    const myPaid=(DB.meusPagamentos||[]).filter(p=>p.estado==='Pago').length;
    const myTotal=(DB.meusPagamentos||[]).length;
    const myRate=myTotal?Math.round(myPaid/myTotal*100):0;
    const myOpen=(DB.minhasOcorrencias||[]).filter(o=>o.estado!=='Resolvido').length;
    kpi('Pagamentos', `${myRate}%`, `${myPaid} pagos`, 'coins', null, [50,60,50,75,80,myRate||80], 'green');
    kpi('Reservas', (DB.minhasReservas||[]).length, 'reservas registadas', 'calendar', null, [1,2,1,3,2,(DB.minhasReservas||[]).length], 'blue');
    kpi('Ocorrências', myOpen, 'a necessitar de atenção', 'alert', null, [3,2,2,1,2,myOpen], 'orange');
    kpi('Veículos', (DB.meusVeiculos||[]).length, 'veículo(s) associado(s)', 'car', null, [1,1,1,1,1,(DB.meusVeiculos||[]).length], 'purple');
  } else if (isPorteiro) {
    const visits=[...(DB.visitantes||[]),...(DB.minhasVisitas||[])];
    const inside=visits.filter(v=>v.data_entrada&&!v.data_saida).length;
    const waiting=visits.filter(v=>!v.data_entrada).length;
    kpi('Visitantes hoje', visits.length, 'registos na portaria', 'walker', null, [5,7,4,8,6,visits.length], 'blue');
    kpi('Dentro do condomínio', inside, 'visitas em curso', 'door', null, [1,2,1,3,2,inside], 'green');
    kpi('Aguardando entrada', waiting, 'por confirmar na portaria', 'calendar', waiting?'atenção':'normal', [3,2,4,2,1,waiting], 'orange');
    kpi('Viaturas', (DB.veiculos||[]).length+(DB.meusVeiculos||[]).length, 'registadas', 'car', null, [4,5,5,6,6,(DB.veiculos||[]).length+(DB.meusVeiculos||[]).length], 'purple');
  } else {
    kpi('Centralidades', (DB.centralidades||[]).length, 'registadas', 'building', null, [1,2,2,3,3,(DB.centralidades||[]).length], 'blue');
    kpi('Condomínios', (DB.condominios||[]).length, 'na plataforma', 'home', null, [2,2,3,3,4,(DB.condominios||[]).length], 'green');
    kpi('Moradores', residents, 'na base global', 'users', null, [5,7,8,10,11,residents], 'purple');
    kpi('Planos ativos', (DB.planos||[]).filter(p=>p.visibilidade==='Ativo').length, 'disponíveis', 'layers', null, [1,1,2,2,2,(DB.planos||[]).filter(p=>p.visibilidade==='Ativo').length], 'orange');
  }
  body.appendChild(stats);

  const grid=document.createElement('div');
  grid.className='home-dashboard-grid';

  const addPanel=(title,subtitle,content,wide=false)=>{
    const card=document.createElement('section');
    card.className=`home-panel card${wide?' home-panel-wide':''}`;
    card.innerHTML=`<div class="home-panel-head"><div><h3>${title}</h3>${subtitle?`<p>${subtitle}</p>`:''}</div></div>`;
    const slot=document.createElement('div');
    slot.className='home-panel-body';
    if(typeof content==='function') content(slot); else slot.innerHTML=content;
    card.appendChild(slot); grid.appendChild(card); return slot;
  };

  if(isSindico){
    /*
     * Os gráficos do síndico são alimentados exclusivamente pelo DB atual.
     * O mock não possui id_condominio/id_sindico nos registos; por isso não
     * inventamos um filtro por condomínio. Quando a API for ligada, os arrays
     * devem chegar já escopados pelo backend conforme o utilizador autenticado.
     */

    const taxaById = new Map((DB.taxas || []).map(t => [Number(t.id), t]));
    const paymentAmount = payment => Number(taxaById.get(Number(payment.id_taxa))?.valor_taxa || 0);
    const receivedPayment = payment => payment.estado === 'Pago' ? paymentAmount(payment) : 0;
    const monthKeys = getDashboardMonthKeys(6);
    const monthLabels = monthKeys.map(formatDashboardMonth);
    const receivedByMonth = monthKeys.map(key =>
      (DB.pagamentos || [])
        .filter(p => dashboardMonthKey(p.mes_pago) === key)
        .reduce((sum, p) => sum + receivedPayment(p), 0)
    );
    const receivedTotal = (DB.pagamentos || []).reduce((sum, p) => sum + receivedPayment(p), 0);
    const expectedTotal = (DB.pagamentos || []).reduce((sum, p) => sum + paymentAmount(p), 0);
    const balance = receivedTotal - expenses;

    addPanel('Evolução financeira','Receita efetivamente recebida por mês — baseada nos pagamentos registados',slot=>{
      if (!(DB.pagamentos || []).length) {
        slot.innerHTML='<div class="home-empty-state">Ainda não existem pagamentos registados para gerar a evolução financeira.</div>';
        return;
      }
      buildLineChart(slot,receivedByMonth,monthLabels,{
        suffix:' Kz',
        aria:'Evolução mensal da receita recebida',
      });
    },true);

    addPanel('Resumo financeiro','Valores contabilizados nos registos atuais',slot=>{
      slot.innerHTML=`<div class="finance-summary-grid">
        <div class="finance-summary-main">
          <span>Saldo contabilizado</span>
          <strong class="finance-big brut-num">${chartNumber(balance)} Kz</strong>
          <small>Receita recebida menos despesas registadas</small>
        </div>
        <div class="finance-mini-grid">
          <div><span>Receita recebida</span><strong class="brut-num">${chartNumber(receivedTotal)} Kz</strong></div>
          <div><span>Cobrança registada</span><strong class="brut-num">${chartNumber(expectedTotal)} Kz</strong></div>
          <div><span>Despesas</span><strong class="brut-num">${chartNumber(expenses)} Kz</strong></div>
          <div><span>Pagamentos</span><strong class="brut-num">${chartNumber(paymentTotal)}</strong></div>
        </div>
      </div>`;
    });

    addPanel('Estado dos pagamentos','Distribuição dos pagamentos dos moradores por estado',slot=>{
      buildDonutChart(slot,[
        {label:'Pago',value:paid,color:'var(--ok-fg)'},
        {label:'Pendente',value:pending,color:'var(--warn-fg)'},
        {label:'Atrasado',value:overdue,color:'var(--bad-fg)'}
      ],{centerLabel:'pagamentos'});
    });

    addPanel('Evolução das cobranças','Quantidade de pagamentos por mês e respetivo estado',slot=>{
      const groups = monthKeys.map((key,i)=>({
        label:monthLabels[i],
        parts:[
          {label:'Pagos',value:(DB.pagamentos || []).filter(p=>dashboardMonthKey(p.mes_pago)===key && p.estado==='Pago').length,color:'var(--ok-fg)'},
          {label:'Pendentes',value:(DB.pagamentos || []).filter(p=>dashboardMonthKey(p.mes_pago)===key && p.estado==='Pendente').length,color:'var(--warn-fg)'},
          {label:'Atrasados',value:(DB.pagamentos || []).filter(p=>dashboardMonthKey(p.mes_pago)===key && p.estado==='Atrasado').length,color:'var(--bad-fg)'}
        ]
      })).filter(group => group.parts.some(part => part.value > 0));

      if (!groups.length) {
        slot.innerHTML='<div class="home-empty-state">Ainda não existem pagamentos com mês de referência disponível.</div>';
        return;
      }
      buildStackedChart(slot,groups);
    },true);

    addPanel('Despesas registadas','Distribuição das despesas por registo — a entidade ainda não possui campo de categoria',slot=>{
      const expenseItems = (DB.despesas || []).map(d=>({
        label:d.nome || 'Despesa',
        value:Number(d.valor || 0),
        display:`${chartNumber(d.valor)} Kz`,
        color:'var(--accent-purple)'
      }));
      if (!expenseItems.length) {
        slot.innerHTML='<div class="home-empty-state">Ainda não existem despesas registadas.</div>';
        return;
      }
      buildBarChart(slot,expenseItems);
    });

    addPanel('Ocorrências','Estado das solicitações e manutenção',slot=>{
      buildStackedChart(slot,[{
        label:'Estado atual',
        parts:[
          {label:'Resolvidas',value:resolvedIncidents,color:'var(--ok-fg)'},
          {label:'Em resolução',value:(DB.ocorrencias||[]).filter(o=>o.estado==='Em resolução').length,color:'var(--warn-fg)'},
          {label:'Pendentes',value:(DB.ocorrencias||[]).filter(o=>o.estado==='Pendente').length,color:'var(--bad-fg)'}
        ]
      }]);
    });

    addPanel('Estrutura do condomínio','Distribuição das unidades por tipo',slot=>{
      const types=['Apartamento','Casa','Loja'].map(t=>({label:t,value:(DB.unidades||[]).filter(u=>u.tipo===t).length}));
      buildBarChart(slot,types.map((x,i)=>({...x,color:['var(--primary)','var(--ok-fg)','var(--accent-purple)'][i]})));
    });

    addPanel('Centro de atenção','Itens que merecem uma ação rápida',slot=>{
      const alerts=[];
      if(overdue) alerts.push(['Pagamento em atraso',`${overdue} pagamento(s) precisam de acompanhamento.`, 'alert','bad']);
      if(openIncidents) alerts.push(['Manutenção pendente',`${openIncidents} ocorrência(s) ainda não foram resolvidas.`, 'wrench','warn']);
      if(units && residents>units) alerts.push(['Ocupação a verificar',`${residents} moradores para ${units} unidades registadas.`, 'users','warn']);
      if(!alerts.length) alerts.push(['Operação estável','Não existem alertas prioritários neste momento.','check','ok']);
      slot.innerHTML=alerts.map(a=>`<div class="attention-item"><span class="attention-icon ${a[3]}">${icon(a[2],17)}</span><div><strong>${a[0]}</strong><p>${a[1]}</p></div><span class="attention-arrow">${icon('chevronRight',15)}</span></div>`).join('');
    });
  } else if(isMorador){
    addPanel('O meu histórico','Situação dos pagamentos e evolução recente',slot=>{
      const list=DB.meusPagamentos||[];
      const vals=[50,65,55,80,70, list.filter(p=>p.estado==='Pago').length ? 100 : 60];
      buildLineChart(slot,vals,['Mar','Abr','Mai','Jun','Jul','Ago'],{aria:'Histórico de pagamentos'});
    },true);
    addPanel('Pagamentos','Situação das minhas mensalidades',slot=>{
      buildDonutChart(slot,['Pago','Pendente','Atrasado'].map((estado,i)=>({
        label:estado,value:listCount(DB.meusPagamentos,estado),color:['var(--ok-fg)','var(--warn-fg)','var(--bad-fg)'][i]
      })),{centerLabel:'mensalidades'});
    });
    addPanel('A minha atividade','Registos por área',slot=>{
      buildBarChart(slot,entityItems.map((item)=>({
        label:ENTITIES[item.entity].label,value:(DB[item.entity]||[]).length,color:entityAccent(item.entity)
      })));
    });
    addPanel('Próximos compromissos','Reservas e atividades registadas',slot=>{
      const rs=DB.minhasReservas||[];
      if(!rs.length){slot.innerHTML='<div class="home-empty-state">Não existem reservas registadas.</div>';return;}
      slot.innerHTML=rs.slice(0,4).map(r=>`<div class="attention-item"><span class="attention-icon blue">${icon('calendar',17)}</span><div><strong>${r.data_reserva}</strong><p>${r.hora_inicio} — ${r.hora_termino}</p></div></div>`).join('');
    });
  } else if(isPorteiro){
    const visits=[...(DB.visitantes||[]),...(DB.minhasVisitas||[])];
    addPanel('Fluxo da portaria','Leitura rápida do estado das visitas',slot=>{
      buildStackedChart(slot,[{label:'Visitas registadas',parts:[
        {label:'Aguardando',value:visits.filter(v=>!v.data_entrada).length,color:'var(--text-3)'},
        {label:'Dentro',value:visits.filter(v=>v.data_entrada&&!v.data_saida).length,color:'var(--ok-fg)'},
        {label:'Saíram',value:visits.filter(v=>v.data_entrada&&v.data_saida).length,color:'var(--primary)'}
      ]}]);
    },true);
    addPanel('Atividade recente','Movimento operacional da portaria',slot=>{
      buildLineChart(slot,[3,5,4,7,6,visits.length],['Seg','Ter','Qua','Qui','Sex','Hoje'],{aria:'Movimento recente da portaria'});
    },true);
  } else {
    // ADMIN — painel executivo com hierarquia clara e dados visuais fortes.
    const taxaById = new Map((DB.taxas || []).map(t => [Number(t.id), t]));
    const received = p => p.estado === 'Pago' ? Number(taxaById.get(Number(p.id_taxa))?.valor_taxa || 0) : 0;
    const adminMonths = getDashboardMonthKeys(12);
    const adminLabels = adminMonths.map(formatDashboardMonth);
    const realRevenueByMonth = adminMonths.map(k => (DB.pagamentos || [])
      .filter(p => dashboardMonthKey(p.mes_pago) === k)
      .reduce((sum,p)=>sum+received(p),0));
    const revenueTotal = (DB.pagamentos || []).reduce((sum,p)=>sum+received(p),0);
    const pendingValue = (DB.pagamentos || []).filter(p=>p.estado!=='Pago')
      .reduce((sum,p)=>sum+Number(taxaById.get(Number(p.id_taxa))?.valor_taxa||0),0);
    const activeAds=(DB.anuncios||[]).filter(a=>a.estado==='Ativo').length;
    const totalCondominios = DB.condominios?.length || 0;
    const totalMoradores = DB.moradores?.length || 0;
    const totalSindicos = DB.sindicos?.length || 0;
    const totalFuncionarios = DB.funcionarios?.length || 0;
    const totalPagamentos = DB.pagamentos?.length || 0;
    const pagos = (DB.pagamentos||[]).filter(p=>p.estado==='Pago').length;
    const pendentes = (DB.pagamentos||[]).filter(p=>p.estado==='Pendente').length;
    const atrasados = (DB.pagamentos||[]).filter(p=>p.estado==='Atrasado').length;

    // Quando a base local ainda é pequena, mostramos uma série claramente marcada
    // como demonstração para que o administrador consiga avaliar a escala visual.
    // Assim os números reais continuam disponíveis nos KPIs e nos detalhes.
    const hasEnoughRevenueData = realRevenueByMonth.some(v => v > 0) && realRevenueByMonth.filter(v => v > 0).length >= 3;
    const demoRevenue = [1280000, 1640000, 1510000, 1980000, 2240000, 2470000, 2310000, 2860000, 3120000, 2980000, 3470000, 3820000];
    const revenueChartData = hasEnoughRevenueData ? realRevenueByMonth : demoRevenue;
    const revenueChartNote = hasEnoughRevenueData
      ? 'Receita efetivamente recebida nos pagamentos registados.'
      : 'Demonstração visual com valores de maior escala — os KPIs continuam a usar os dados reais.';

    const financeSlot = addPanel('Receita arrecadada','Visão anual da entrada financeira da plataforma',slot=>{
      slot.innerHTML=`
        <div class="admin-finance-primary admin-finance-primary-main">
          <span>Total arrecadado</span>
          <strong class="finance-big brut-num">${chartNumber(revenueTotal)} Kz</strong>
          <small>${hasEnoughRevenueData ? 'Dados reais dos pagamentos registados' : 'Base atual pequena · gráfico em modo demonstração'}</small>
        </div>`;
      const note=document.createElement('div'); note.className='admin-chart-note admin-chart-note-finance'; note.textContent=revenueChartNote; slot.appendChild(note);
      const chart=document.createElement('div'); chart.className='admin-chart-slot admin-chart-slot-xl'; slot.appendChild(chart);
      buildLineChart(chart,revenueChartData,adminLabels,{suffix:' Kz',aria:'Receita arrecadada por mês',height:430,showValues:true});
      const secondary=document.createElement('div');
      secondary.className='admin-finance-secondary admin-finance-secondary-bottom';
      secondary.innerHTML=`
        <div><span>Por receber</span><strong class="finance-secondary brut-num">${chartNumber(pendingValue)} Kz</strong><small class="finance-mini-caption">valor estimado</small></div>
        <div><span>Pagamentos</span><strong class="finance-secondary brut-num">${chartNumber(totalPagamentos)}</strong><small class="finance-mini-caption">registos na base</small></div>`;
      slot.appendChild(secondary);
    },true);
    financeSlot.closest('.home-panel')?.classList.add('admin-finance-panel');

    const financialStateSlot = addPanel('Estado financeiro','Leitura rápida da carteira de pagamentos',slot=>{
      buildDonutChart(slot,[
        {label:'Pagos',value:pagos,color:'var(--ok-fg)'},
        {label:'Pendentes',value:pendentes,color:'var(--warn-fg)'},
        {label:'Atrasados',value:atrasados,color:'var(--bad-fg)'}
      ],{centerLabel:'pagamentos'});
    });
    financialStateSlot.closest('.home-panel')?.classList.add('admin-half-panel');

    const centralitySlot = addPanel('Distribuição por centralidade','Onde a plataforma concentra mais condomínios',slot=>{
      const real=(DB.centralidades||[]).map(c=>({label:c.nome,value:(DB.condominios||[]).filter(x=>x.id_centralidade===c.id).length,color:entityAccent('c'+c.id)}));
      const demo=real.some(x=>x.value>0) ? real : [
        {label:'Talatona',value:42,color:'var(--primary)'},
        {label:'Kilamba',value:31,color:'var(--accent-purple)'},
        {label:'Maianga',value:24,color:'var(--ok-fg)'},
        {label:'Ingombota',value:18,color:'var(--warn-fg)'},
        {label:'Viana',value:13,color:'var(--bad-fg)'},
        {label:'Outras',value:9,color:'var(--text-3)'}
      ];
      buildBarChart(slot,demo,{largeValues:true});
      if(!real.some(x=>x.value>0)){ const n=document.createElement('div'); n.className='admin-chart-note'; n.textContent='Demonstração visual para avaliar a escala do gráfico.'; slot.appendChild(n); }
    });
    centralitySlot.closest('.home-panel')?.classList.add('admin-half-panel');

    addPanel('Crescimento da plataforma','Volume atual das principais entidades',slot=>{
      buildBarChart(slot,[
        {label:'Condomínios',value:totalCondominios,color:'var(--primary)'},
        {label:'Moradores',value:totalMoradores,color:'var(--accent-purple)'},
        {label:'Síndicos',value:totalSindicos,color:'var(--ok-fg)'},
        {label:'Funcionários',value:totalFuncionarios,color:'var(--warn-fg)'}
      ],{largeValues:true});
    },true);

    addPanel('Operação da plataforma','Indicadores essenciais para acompanhamento administrativo',slot=>{
      slot.innerHTML=`
        <div class="admin-overview-grid">
          <div class="admin-overview-item"><span class="admin-overview-icon blue">${icon('home',17)}</span><div><small>Condomínios</small><strong class="brut-num">${totalCondominios}</strong><em>ativos na base</em></div></div>
          <div class="admin-overview-item"><span class="admin-overview-icon purple">${icon('users',17)}</span><div><small>Moradores</small><strong class="brut-num">${totalMoradores}</strong><em>utilizadores registados</em></div></div>
          <div class="admin-overview-item"><span class="admin-overview-icon green">${icon('coins',17)}</span><div><small>Pagamentos</small><strong class="brut-num">${totalPagamentos}</strong><em>${pagos} confirmados</em></div></div>
          <div class="admin-overview-item"><span class="admin-overview-icon orange">${icon('megaphone',17)}</span><div><small>ADS ativos</small><strong class="brut-num">${activeAds}</strong><em>publicidades em circulação</em></div></div>
        </div>`;
    },true);
  }

  if(grid.children.length) body.appendChild(grid);
}

function dashboardMonthKey(value) {
  const match = String(value || '').match(/^(\\d{4})-(\\d{1,2})/);
  return match ? `${match[1]}-${String(match[2]).padStart(2,'0')}` : '';
}

function getDashboardMonthKeys(count) {
  const total = Math.max(1, Number(count) || 6);
  const now = new Date();
  const keys = [];
  for (let offset = total - 1; offset >= 0; offset--) {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
  }
  return keys;
}

function formatDashboardMonth(key) {
  const [year, month] = String(key).split('-').map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString('pt-PT', { month:'short' }).replace('.', '');
}

function listCount(list, state) {
  return (list || []).filter(x => x.estado === state).length;
}

function statCard(s) {

  const card = document.createElement('div');
  card.className = 'stat-strip-card card';
  card.style.setProperty('--accent-c', s.accent || 'var(--primary)');
  card.innerHTML = `
    <span class="stat-strip-icon">${icon(s.icon, 20)}</span>
    <span class="stat-strip-text">
      <span class="stat-strip-count brut-num">${s.value}</span>
      <span class="stat-strip-label">${s.label}</span>
    </span>
  `;
  return card;
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
   Tela "Votações" (Morador) — tela fora do padrão de CRUD. O síndico é quem
   cria as votações e as opções (ver entidade `votacoes`, editável só no
   perfil síndico); aqui o morador só escolhe uma opção — um voto por
   votação — e vê o resultado. Não há criar/editar/excluir neste ecrã.
   --------------------------------------------------------------------------- */
function parseOpcoes(opcoesRaw) {
  return String(opcoesRaw || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);
}

function votoDoMorador(idVotacao) {
  return VOTOS.find(v => v.id_votacao === idVotacao && v.id_morador === MORADOR_LOGADO_ID);
}

function renderVotacoesMoradorScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Votações</h2>';
  body.appendChild(heading);

  const p = document.createElement('p');
  p.className = 'home-intro';
  p.textContent = 'O síndico cria as votações e as opções — aqui escolhes a tua opção. Um voto por votação.';
  body.appendChild(p);

  const list = document.createElement('div');
  list.className = 'votacoes-list';
  body.appendChild(list);

  function renderList() {
    list.innerHTML = '';

    if (!DB.votacoes.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = icon('vote', 30) + '<div>Ainda não há votações abertas pelo síndico.</div>';
      list.appendChild(empty);
      return;
    }

    DB.votacoes.forEach(votacao => {
      const opcoes = parseOpcoes(votacao.opcoes);
      const meuVoto = votoDoMorador(votacao.id);
      const encerrada = votacao.estado === 'Encerrada';
      const totalVotos = VOTOS.filter(v => v.id_votacao === votacao.id).length;

      const card = document.createElement('div');
      card.className = 'table-card glass votacao-card';

      const header = document.createElement('div');
      header.className = 'table-card-header';
      header.innerHTML = `
        <h3>${votacao.titulo}</h3>
        <span class="badge ${encerrada ? 'badge-red' : 'badge-green'}">${votacao.estado}</span>
      `;
      card.appendChild(header);

      if (votacao.descricao) {
        const desc = document.createElement('p');
        desc.className = 'votacao-descricao';
        desc.textContent = votacao.descricao;
        card.appendChild(desc);
      }

      const meta = document.createElement('p');
      meta.className = 'votacao-meta';
      meta.textContent = `Prazo: ${votacao.data_limite || '—'} · ${totalVotos} voto(s) até agora`;
      card.appendChild(meta);

      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'votacao-opcoes';

      const mostrarResultado = encerrada || !!meuVoto;

      if (mostrarResultado) {
        opcoes.forEach(opcao => {
          const votosOpcao = VOTOS.filter(v => v.id_votacao === votacao.id && v.opcao === opcao).length;
          const pct = totalVotos ? Math.round((votosOpcao / totalVotos) * 100) : 0;
          const isMinha = meuVoto && meuVoto.opcao === opcao;

          const row = document.createElement('div');
          row.className = 'vote-result-row' + (isMinha ? ' vote-result-row-mine' : '');
          row.innerHTML = `
            <div class="vote-result-top">
              <span>${opcao}${isMinha ? ' <span class="vote-mine-tag">O teu voto</span>' : ''}</span>
              <span class="vote-result-pct">${pct}%</span>
            </div>
            <div class="vote-result-bar"><span style="width:${pct}%"></span></div>
          `;
          optionsWrap.appendChild(row);
        });
      } else {
        opcoes.forEach(opcao => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'vote-option-btn';
          btn.textContent = opcao;
          btn.addEventListener('click', () => {
            // ------------------------------------------------------------
            // Endpoint real: POST /morador/votacao/:id_votacao/voto  { opcao }
            // ------------------------------------------------------------
            VOTOS.push({
              id: VOTOS.length ? Math.max(...VOTOS.map(v => v.id)) + 1 : 1,
              id_votacao: votacao.id,
              id_morador: MORADOR_LOGADO_ID,
              opcao,
            });
            showToast('Voto registado com sucesso.');
            renderList();
          });
          optionsWrap.appendChild(btn);
        });
      }

      card.appendChild(optionsWrap);
      list.appendChild(card);
    });
  }

  renderList();
  body.appendChild(buildApiNote({ list: 'GET /morador/votacao', create: 'POST /morador/votacao/:id_votacao/voto' }));
}

/* ---------------------------------------------------------------------------
   Telas do PORTEIRO — conta criada pelo síndico (entidade `porteiros`).
   O porteiro nunca cria/edita registos de morador; só regista entrada/saída
   de visitas na portaria e consulta a lista de viaturas para conferência.
   --------------------------------------------------------------------------- */
function renderPorteiroVisitasScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Visitas</h2>';
  body.appendChild(heading);

  const p = document.createElement('p');
  p.className = 'home-intro';
  p.textContent = 'Todas as visitas anunciadas pelo síndico ou pelos moradores aparecem aqui. Regista a entrada quando o visitante chegar e a saída quando ele sair.';
  body.appendChild(p);

  const tableContainer = document.createElement('div');
  body.appendChild(tableContainer);

  function linhas() {
    return [
      ...DB.visitantes.map(v => ({ ref: v, origem: 'Portaria' })),
      ...DB.minhasVisitas.map(v => ({ ref: v, origem: 'Morador' })),
    ];
  }

  function render() {
    tableContainer.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'table-card glass';
    wrapper.innerHTML = `
      <div class="table-card-header">
        <h3>Lista de Visitas</h3>
        <span class="entity-card-id">${linhas().length} registo(s)</span>
      </div>
      <div class="table-toolbar">
        <input id="porteiro-visitas-search" type="search" class="table-search-input" placeholder="Pesquisar visitante, origem ou estado...">
      </div>
      <div id="porteiro-visitas-table"></div>
    `;

    const searchInput = wrapper.querySelector('#porteiro-visitas-search');
    const tableSlot = wrapper.querySelector('#porteiro-visitas-table');

    function drawTable() {
      tableSlot.innerHTML = '';
      const allRows = linhas();
      const term = (searchInput.value || '').trim().toLowerCase();

      const rows = term
        ? allRows.filter(row => {
            const v = row.ref;
            const estado = !v.data_entrada ? 'pendente entrada' : (!v.data_saida ? 'presente' : 'concluída');
            return [v.nome, row.origem, estado, v.data_entrada, v.data_saida]
              .some(value => String(value || '').toLowerCase().includes(term));
          })
        : allRows;

      if (!allRows.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = icon('walker', 30) + '<div>Ainda não há visitas anunciadas.</div>';
        tableSlot.appendChild(empty);
        return;
      }

      if (!rows.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = icon('search', 30) + '<div>Nenhuma visita encontrada.</div>';
        tableSlot.appendChild(empty);
        return;
      }

      const table = document.createElement('table');
      table.className = 'crud-table';
      table.innerHTML = `
        <thead><tr><th>Visitante</th><th>Origem</th><th>Entrada</th><th>Saída</th><th>Ação</th></tr></thead>
        <tbody>
          ${rows.map(row => {
            const v = row.ref;
            const originalIdx = allRows.indexOf(row);
            let acao;
            if (!v.data_entrada) acao = `<button type="button" class="btn btn-primary btn-small" data-checkin="${originalIdx}">Registar entrada</button>`;
            else if (!v.data_saida) acao = `<button type="button" class="btn btn-secondary btn-small" data-checkout="${originalIdx}">Registar saída</button>`;
            else acao = `<span class="badge badge-green">Concluída</span>`;
            return `<tr>
              <td>${v.nome}</td>
              <td>${row.origem}</td>
              <td>${formatCell(v.data_entrada)}</td>
              <td>${formatCell(v.data_saida)}</td>
              <td>${acao}</td>
            </tr>`;
          }).join('')}
        </tbody>
      `;
      tableSlot.appendChild(table);

      tableSlot.querySelectorAll('[data-checkin]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = allRows[Number(btn.dataset.checkin)];
          row.ref.data_entrada = new Date().toISOString().slice(0, 16);
          showToast('Entrada registada.');
          render();
        });
      });

      tableSlot.querySelectorAll('[data-checkout]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = allRows[Number(btn.dataset.checkout)];
          row.ref.data_saida = new Date().toISOString().slice(0, 16);
          showToast('Saída registada.');
          render();
        });
      });
    }

    searchInput.addEventListener('input', drawTable);
    drawTable();

    tableContainer.appendChild(wrapper);
    tableContainer.appendChild(buildApiNote({
      checkin: 'PATCH /porteiro/visita/:id { data_entrada }',
      checkout: 'PATCH /porteiro/visita/:id { data_saida }',
    }));
  }

  render();
}

function renderPorteiroVeiculosScreen() {
  const body = document.getElementById('generic-screen-body');
  body.innerHTML = '';

  const heading = document.createElement('div');
  heading.className = 'screen-heading';
  heading.innerHTML = '<h2>Veículos do Condomínio</h2><span class="readonly-tag">Somente leitura</span>';
  body.appendChild(heading);

  const p = document.createElement('p');
  p.className = 'home-intro';
  p.textContent = 'Usa esta lista para conferir se uma viatura na entrada pertence mesmo a alguém do condomínio.';
  body.appendChild(p);

  const rows = [
    ...DB.veiculos.map(v => ({ ...v, origem: 'Condomínio' })),
    ...DB.meusVeiculos.map(v => ({ ...v, origem: 'Morador' })),
  ];

  const wrapper = document.createElement('div');
  wrapper.className = 'table-card glass';
  wrapper.innerHTML = `
    <div class="table-card-header">
      <h3>Lista de Veículos</h3>
      <span class="entity-card-id">${rows.length} registo(s)</span>
    </div>
    <div class="table-toolbar">
      <input id="porteiro-veiculos-search" type="search" class="table-search-input" placeholder="Pesquisar matrícula, motorista ou origem...">
    </div>
    <div id="porteiro-veiculos-table"></div>
  `;

  const tableSlot = wrapper.querySelector('#porteiro-veiculos-table');
  const searchInput = wrapper.querySelector('#porteiro-veiculos-search');

  function drawVehicles() {
    const term = (searchInput.value || '').trim().toLowerCase();
    const filtered = term
      ? rows.filter(v => [v.placa, v.nome_motorista, v.origem]
          .some(value => String(value || '').toLowerCase().includes(term)))
      : rows;

    tableSlot.innerHTML = '';

    if (!rows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = icon('car', 30) + '<div>Ainda não há veículos registados.</div>';
      tableSlot.appendChild(empty);
      return;
    }

    if (!filtered.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = icon('search', 30) + '<div>Nenhum veículo encontrado.</div>';
      tableSlot.appendChild(empty);
      return;
    }

    const table = document.createElement('table');
    table.className = 'crud-table';
    table.innerHTML = `
      <thead><tr><th>Placa</th><th>Motorista</th><th>Origem</th></tr></thead>
      <tbody>
        ${filtered.map(v => `<tr><td>${v.placa || ''}</td><td>${v.nome_motorista || ''}</td><td>${v.origem}</td></tr>`).join('')}
      </tbody>
    `;
    tableSlot.appendChild(table);
  }

  searchInput.addEventListener('input', drawVehicles);
  drawVehicles();
  body.appendChild(wrapper);
  body.appendChild(buildApiNote({ list: 'GET /porteiro/veiculo' }));
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

  const legacyLogout = document.getElementById('btn-logout');
  if (legacyLogout) legacyLogout.addEventListener('click', logout);

  const organigramBtn = document.getElementById('btn-open-organigram');
  const organigramBox = document.getElementById('organigram-lightbox');
  const organigramClose = document.getElementById('close-organigram');
  if (organigramBtn && organigramBox) {
    organigramBtn.addEventListener('click', () => organigramBox.classList.add('open'));
    organigramClose?.addEventListener('click', () => organigramBox.classList.remove('open'));
    organigramBox.addEventListener('click', e => { if (e.target === organigramBox) organigramBox.classList.remove('open'); });
  }
  initMobileMenu();
  initTopbarProfile();
  initLandingMenu();

  showScreen('screen-landing');
});
