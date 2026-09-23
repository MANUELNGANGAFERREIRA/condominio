/* ============================================================================
   data.js
   ----------------------------------------------------------------------------
   Configuração central de todas as "entidades" do sistema (uma por módulo/tela
   de CRUD). Cada entidade descreve:
     - key: chave interna (usada para guardar os dados em memória e nas rotas)
     - label / labelSingular: nomes exibidos na interface
     - fields: campos do formulário (usados para gerar o form automaticamente)
     - columns: quais campos aparecem como colunas na tabela
     - readonly: se true, a tela só mostra tabela (sem criar/editar/excluir)
     - endpoints: endpoints reais que um dev vai precisar plugar depois
     - mock: 2-3 registros de exemplo para a tabela já nascer preenchida

   Isto é o "banco de dados" falso do mockup: tudo fica em memória (window.DB).
   Ao salvar um formulário, o novo objeto é apenas colocado dentro do array
   correspondente em window.DB e a tabela é re-renderizada. Nada disto faz
   qualquer chamada de rede real.
   ============================================================================ */

// Campo reutilizável de "visibilidade" (ativo/inativo) usado em várias entidades
function campoVisibilidade() {
  return { key: 'visibilidade', label: 'Visibilidade', type: 'select', options: ['Ativo', 'Inativo'], required: true };
}

// Variante do campo acima para os módulos de autoatendimento do morador
// (ex.: "Meus Veículos"): o próprio morador nunca deve ver nem definir este
// estado — fica sempre "Ativo" por trás dos panos, controlado pelo sistema.
function campoVisibilidadeOculta() {
  return { key: 'visibilidade', label: 'Visibilidade', type: 'select', options: ['Ativo', 'Inativo'], required: true, hidden: true };
}

const ENTITIES = {

  /* ==========================================================================
     ÁREA ADMIN
     ========================================================================== */

  centralidades: {
    key: 'centralidades',
    label: 'Centralidades',
    labelSingular: 'Centralidade',
    role: 'admin',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'endereco', label: 'Endereço', type: 'text', required: true },
    ],
    columns: ['nome', 'endereco'],
    endpoints: { list: 'GET /centralidades', create: 'POST /centralidades', update: 'PUT /centralidades/:id', remove: 'DELETE /centralidades/:id' },
    mock: [
      { id: 1, nome: 'Centralidade do Kilamba', endereco: 'Kilamba, Luanda' },
      { id: 2, nome: 'Centralidade do Zango', endereco: 'Zango, Luanda' },
    ],
  },

  tiposCondominio: {
    key: 'tiposCondominio',
    label: 'Tipos de Condomínio',
    labelSingular: 'Tipo de Condomínio',
    role: 'admin',
    fields: [
      { key: 'tipo_condominio', label: 'Tipo de Condomínio', type: 'text', required: true },
    ],
    columns: ['tipo_condominio'],
    endpoints: { list: 'GET /tipos-condominio', create: 'POST /tipos-condominio', update: 'PUT /tipos-condominio/:id', remove: 'DELETE /tipos-condominio/:id' },
    mock: [
      { id: 1, tipo_condominio: 'Residencial Fechado' },
      { id: 2, tipo_condominio: 'Bloco de Apartamentos' },
    ],
  },

  tiposPagamento: {
    key: 'tiposPagamento',
    label: 'Tipos de Pagamento',
    labelSingular: 'Tipo de Pagamento',
    role: 'admin',
    fields: [
      { key: 'tipo_pagamento', label: 'Tipo de Pagamento', type: 'select', options: ['Cash', 'Referência', 'Transferência'], required: true },
    ],
    columns: ['tipo_pagamento'],
    endpoints: { list: 'GET /tipos-pagamento', create: 'POST /tipos-pagamento', update: 'PUT /tipos-pagamento/:id', remove: 'DELETE /tipos-pagamento/:id' },
    mock: [
      { id: 1, tipo_pagamento: 'Referência' },
      { id: 2, tipo_pagamento: 'Transferência' },
    ],
  },

  planos: {
    key: 'planos',
    label: 'Planos',
    labelSingular: 'Plano',
    role: 'admin',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', required: false },
      { key: 'preco', label: 'Preço (Kz)', type: 'number', required: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'preco', 'visibilidade'],
    endpoints: { list: 'GET /planos', create: 'POST /planos', update: 'PUT /planos/:id', remove: 'DELETE /planos/:id' },
    mock: [
      { id: 1, nome: 'Plano Básico', descricao: 'Até 50 unidades', preco: 15000, visibilidade: 'Ativo' },
      { id: 2, nome: 'Plano Pro', descricao: 'Unidades ilimitadas + suporte prioritário', preco: 45000, visibilidade: 'Ativo' },
    ],
  },

  administradores: {
    key: 'administradores',
    label: 'Administradores',
    labelSingular: 'Administrador',
    role: 'admin',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'foto', label: 'Foto (URL)', type: 'url', required: false },
      { key: 'senha', label: 'Senha', type: 'password', required: true, onlyCreate: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'email', 'telefone', 'visibilidade'],
    endpoints: { list: 'GET /administradores', create: 'POST /administradores', update: 'PUT /administradores/:id', remove: 'DELETE /administradores/:id' },
    mock: [
      { id: 1, nome: 'Carla Fonseca', email: 'carla@plataforma.com', telefone: '923 111 222', foto: '', visibilidade: 'Ativo' },
    ],
  },

  condominios: {
    key: 'condominios',
    label: 'Condomínios',
    labelSingular: 'Condomínio',
    role: 'admin',
    hasTabsVisibilidade: true,
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'endereco', label: 'Endereço', type: 'text', required: true },
      { key: 'email', label: 'Email (login do síndico)', type: 'email', required: true },
      { key: 'foto', label: 'Foto (URL)', type: 'url', required: false },
      { key: 'id_tipo_condominio', label: 'Tipo de Condomínio', type: 'ref', ref: { entity: 'tiposCondominio', display: 'tipo_condominio' }, required: true },
      { key: 'id_centralidade', label: 'Centralidade', type: 'ref', ref: { entity: 'centralidades', display: 'nome' }, required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Condomínio', 'Bloco'], required: true },
      { key: 'senha_virtual', label: 'Senha Virtual', type: 'password', required: true, onlyCreate: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'endereco', 'tipo', 'visibilidade'],
    endpoints: { list: 'GET /condominios', create: 'POST /condominios', update: 'PUT /condominios/:id', remove: 'DELETE /condominios/:id' },
    mock: [
      { id: 1, nome: 'Condomínio Jardins do Kilamba', endereco: 'Rua 5, Kilamba', email: 'sindico@jardinskilamba.co.ao', foto: '', id_tipo_condominio: 1, id_centralidade: 1, tipo: 'Condomínio', visibilidade: 'Ativo' },
      { id: 2, nome: 'Bloco Girassol', endereco: 'Av. Talatona', email: 'sindico@girassol.co.ao', foto: '', id_tipo_condominio: 2, id_centralidade: 2, tipo: 'Bloco', visibilidade: 'Inativo' },
    ],
  },

  usuarios: {
    key: 'usuarios',
    label: 'Usuários',
    labelSingular: 'Usuário',
    role: 'admin',
    readonly: true,
    fields: [],
    columns: ['id_usuario', 'id_principal', 'email', 'tipo_usuario', 'estado'],
    endpoints: { list: 'GET /usuarios' },
    mock: [
      { id: 1, id_usuario: 101, id_principal: 1, email: 'sindico@jardinskilamba.co.ao', tipo_usuario: 'Síndico', estado: 'Ativo' },
      { id: 2, id_usuario: 102, id_principal: 4, email: 'joao.morador@gmail.com', tipo_usuario: 'Morador', estado: 'Ativo' },
      { id: 3, id_usuario: 103, id_principal: 2, email: 'carla@plataforma.com', tipo_usuario: 'Admin', estado: 'Ativo' },
    ],
  },

  /* ==========================================================================
     ÁREA SÍNDICO
     ========================================================================== */

  moradores: {
    key: 'moradores',
    label: 'Moradores',
    labelSingular: 'Morador',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'foto', label: 'Foto (URL)', type: 'url', required: false },
      { key: 'senha_virtual', label: 'Senha Virtual', type: 'password', required: true, onlyCreate: true },
    ],
    columns: ['nome', 'email', 'telefone'],
    endpoints: { list: 'GET /morador', create: 'POST /morador', update: 'PUT /morador/:id', remove: 'DELETE /morador/:id' },
    mock: [
      { id: 1, nome: 'João Neto', email: 'joao.morador@gmail.com', telefone: '912 345 678', foto: '', senha_virtual: '' },
      { id: 2, nome: 'Ana Paula', email: 'ana.paula@gmail.com', telefone: '923 456 789', foto: '', senha_virtual: '' },
    ],
  },

  unidades: {
    key: 'unidades',
    label: 'Unidades',
    labelSingular: 'Unidade',
    role: 'sindico',
    fields: [
      { key: 'numero', label: 'Número', type: 'text', required: true },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Apartamento', 'Casa', 'Loja'], required: true },
      campoVisibilidade(),
    ],
    columns: ['numero', 'tipo', 'visibilidade'],
    endpoints: { list: 'GET /unidade', create: 'POST /unidade', update: 'PUT /unidade/:id', remove: 'DELETE /unidade/:id' },
    mock: [
      { id: 1, numero: 'A-101', tipo: 'Apartamento', visibilidade: 'Ativo' },
      { id: 2, numero: 'B-202', tipo: 'Apartamento', visibilidade: 'Ativo' },
      { id: 3, numero: 'Loja 03', tipo: 'Loja', visibilidade: 'Ativo' },
    ],
  },

  funcionarios: {
    key: 'funcionarios',
    label: 'Funcionários',
    labelSingular: 'Funcionário',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'funcao', label: 'Função', type: 'text', required: true },
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'num_identificacao', label: 'Nº de Identificação', type: 'text', required: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'funcao', 'telefone', 'visibilidade'],
    endpoints: { list: 'GET /funcionario', create: 'POST /funcionario', update: 'PUT /funcionario/:id', remove: 'DELETE /funcionario/:id' },
    mock: [
      { id: 1, nome: 'Manuel Sousa', funcao: 'Segurança', telefone: '934 111 000', num_identificacao: '00312345LA045', visibilidade: 'Ativo' },
      { id: 2, nome: 'Isabel Chissano', funcao: 'Limpeza', telefone: '934 222 111', num_identificacao: '00398765LA032', visibilidade: 'Ativo' },
    ],
  },

  porteiros: {
    key: 'porteiros',
    label: 'Porteiros',
    labelSingular: 'Porteiro',
    role: 'sindico',
    // O síndico cria a conta de acesso do porteiro (email + senha); essa
    // conta entra depois pela aba "Porteiro" na tela de login (ver
    // screen-login-porteiro em index.html).
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'email', label: 'Email (login do porteiro)', type: 'email', required: true },
      { key: 'telefone', label: 'Telefone', type: 'tel', required: true },
      { key: 'id_porta', label: 'Porta', type: 'ref', ref: { entity: 'portas', display: 'nome' }, required: false },
      { key: 'senha', label: 'Senha', type: 'password', required: true, onlyCreate: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'email', 'telefone', 'id_porta', 'visibilidade'],
    endpoints: { list: 'GET /porteiro', create: 'POST /porteiro', update: 'PUT /porteiro/:id', remove: 'DELETE /porteiro/:id' },
    mock: [
      { id: 1, nome: 'Rui Bastos', email: 'rui.porteiro@jardinskilamba.co.ao', telefone: '921 555 000', id_porta: 1, senha: '', visibilidade: 'Ativo' },
    ],
  },

  portas: {
    key: 'portas',
    label: 'Portas',
    labelSingular: 'Porta',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Portão Principal' },
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['Veicular', 'Pedonal'], required: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'tipo', 'visibilidade'],
    endpoints: { list: 'GET /porta', create: 'POST /porta', update: 'PUT /porta/:id', remove: 'DELETE /porta/:id' },
    mock: [
      { id: 1, nome: 'Portão Principal', tipo: 'Veicular', visibilidade: 'Ativo' },
      { id: 2, nome: 'Entrada Pedonal', tipo: 'Pedonal', visibilidade: 'Ativo' },
    ],
  },

  areasComuns: {
    key: 'areasComuns',
    label: 'Áreas Comuns',
    labelSingular: 'Área Comum',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'capacidade', label: 'Capacidade', type: 'number', required: true },
      { key: 'horario_abertura', label: 'Horário de Abertura', type: 'text', placeholder: '08:00', required: true },
      { key: 'horario_encerramento', label: 'Horário de Encerramento', type: 'text', placeholder: '22:00', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Disponível', 'Indisponível'], required: true },
      campoVisibilidade(),
    ],
    columns: ['nome', 'capacidade', 'estado', 'visibilidade'],
    endpoints: { list: 'GET /area-comum', create: 'POST /area-comum', update: 'PUT /area-comum/:id', remove: 'DELETE /area-comum/:id' },
    mock: [
      { id: 1, nome: 'Salão de Festas', capacidade: 80, horario_abertura: '08:00', horario_encerramento: '22:00', estado: 'Disponível', visibilidade: 'Ativo' },
      { id: 2, nome: 'Piscina', capacidade: 30, horario_abertura: '09:00', horario_encerramento: '19:00', estado: 'Disponível', visibilidade: 'Ativo' },
    ],
  },

  reservas: {
    key: 'reservas',
    label: 'Reservas',
    labelSingular: 'Reserva',
    role: 'sindico',
    fields: [
      { key: 'data_reserva', label: 'Data da Reserva', type: 'date', required: true },
      { key: 'hora_inicio', label: 'Hora de Início', type: 'text', placeholder: '10:00', required: true },
      { key: 'hora_termino', label: 'Hora de Término', type: 'text', placeholder: '14:00', required: true },
      { key: 'id_area_comum', label: 'Área Comum', type: 'ref', ref: { entity: 'areasComuns', display: 'nome' }, required: true },
      campoVisibilidade(),
    ],
    columns: ['data_reserva', 'hora_inicio', 'hora_termino', 'id_area_comum', 'visibilidade'],
    endpoints: { list: 'GET /reserva', create: 'POST /reserva', update: 'PUT /reserva/:id', remove: 'DELETE /reserva/:id' },
    mock: [
      { id: 1, data_reserva: '2026-08-20', hora_inicio: '18:00', hora_termino: '22:00', id_area_comum: 1, visibilidade: 'Ativo' },
    ],
  },

  comunicados: {
    key: 'comunicados',
    label: 'Comunicados',
    labelSingular: 'Comunicado',
    role: 'sindico',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { key: 'mensagem', label: 'Mensagem', type: 'textarea', required: true },
    ],
    columns: ['titulo', 'mensagem'],
    endpoints: { list: 'GET /comunicado', create: 'POST /comunicado', update: 'PUT /comunicado/:id', remove: 'DELETE /comunicado/:id' },
    mock: [
      { id: 1, titulo: 'Corte de água programado', mensagem: 'No dia 18/08, das 08h às 12h, haverá corte de água para manutenção da cisterna.' },
      { id: 2, titulo: 'Assembleia geral', mensagem: 'Assembleia geral marcada para o dia 30/08 às 18h no salão de festas.' },
    ],
  },

  votacoes: {
    key: 'votacoes',
    label: 'Votações',
    labelSingular: 'Votação',
    role: 'sindico',
    // Só o síndico cria a votação e define as opções; o morador só vota
    // (ver tela "Votações" do morador, montada à parte em app.js).
    fields: [
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', required: false },
      { key: 'opcoes', label: 'Opções (uma por linha)', type: 'textarea', required: true, placeholder: 'Ex.: Aprovar\nRejeitar' },
      { key: 'data_limite', label: 'Data Limite', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Aberta', 'Encerrada'], required: true },
    ],
    columns: ['titulo', 'data_limite', 'estado'],
    endpoints: { list: 'GET /votacao', create: 'POST /votacao', update: 'PUT /votacao/:id', remove: 'DELETE /votacao/:id' },
    mock: [
      { id: 1, titulo: 'Pintura da fachada', descricao: 'Escolha da cor da fachada principal do condomínio.', opcoes: 'Branco\nCinza claro\nBege', data_limite: '2026-09-15', estado: 'Aberta' },
      { id: 2, titulo: 'Horário da piscina', descricao: 'Ajuste do horário de funcionamento da piscina nos fins de semana.', opcoes: 'Manter atual\nAlargar até às 21h', data_limite: '2026-08-10', estado: 'Encerrada' },
    ],
  },

  regras: {
    key: 'regras',
    label: 'Regras',
    labelSingular: 'Regra',
    role: 'sindico',
    fields: [
      { key: 'lista_regras', label: 'Lista de Regras', type: 'textarea', required: true },
    ],
    columns: ['lista_regras'],
    endpoints: { list: 'GET /regra', create: 'POST /regra', update: 'PUT /regra/:id', remove: 'DELETE /regra/:id' },
    mock: [
      { id: 1, lista_regras: 'Silêncio após as 22h. Animais de estimação devem estar sempre presos. Uso da piscina até às 19h.' },
    ],
  },

  despesas: {
    key: 'despesas',
    label: 'Despesas',
    labelSingular: 'Despesa',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      { key: 'valor', label: 'Valor (Kz)', type: 'number', required: true },
    ],
    columns: ['nome', 'valor'],
    endpoints: { list: 'GET /despesa', create: 'POST /despesa', update: 'PUT /despesa/:id', remove: 'DELETE /despesa/:id' },
    mock: [
      { id: 1, nome: 'Manutenção do elevador', valor: 85000 },
      { id: 2, nome: 'Jardinagem', valor: 32000 },
    ],
  },

  taxas: {
    key: 'taxas',
    label: 'Taxas',
    labelSingular: 'Taxa',
    role: 'sindico',
    fields: [
      { key: 'valor_taxa', label: 'Valor da Taxa (Kz)', type: 'number', required: true },
      { key: 'valor_multa', label: 'Valor da Multa (Kz)', type: 'number', required: true },
      { key: 'data_limite', label: 'Data Limite', type: 'date', required: true },
      { key: 'iban', label: 'IBAN', type: 'text', required: true },
    ],
    columns: ['valor_taxa', 'valor_multa', 'data_limite', 'iban'],
    endpoints: { list: 'GET /taxa', create: 'POST /taxa', update: 'PUT /taxa/:id', remove: 'DELETE /taxa/:id' },
    mock: [
      { id: 1, valor_taxa: 12000, valor_multa: 2000, data_limite: '2026-08-10', iban: 'AO06 0000 0000 0000 0000 0001 2' },
    ],
  },

  pagamentos: {
    key: 'pagamentos',
    label: 'Pagamentos',
    labelSingular: 'Pagamento',
    role: 'sindico',
    fields: [
      { key: 'mes_pago', label: 'Mês Pago', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Pago', 'Pendente', 'Atrasado'], required: true },
      { key: 'data_pagamento', label: 'Data do Pagamento', type: 'date', required: false },
      { key: 'id_taxa', label: 'Taxa', type: 'ref', ref: { entity: 'taxas', display: r => `Kz ${Number(r.valor_taxa).toLocaleString('pt-PT')} · venc. ${r.data_limite}` }, required: true },
    ],
    columns: ['mes_pago', 'estado', 'data_pagamento', 'id_taxa'],
    endpoints: { list: 'GET /pagamento', create: 'POST /pagamento', update: 'PUT /pagamento/:id', remove: 'DELETE /pagamento/:id' },
    mock: [
      { id: 1, mes_pago: '2026-07-01', estado: 'Pago', data_pagamento: '2026-07-05', id_taxa: 1 },
      { id: 2, mes_pago: '2026-08-01', estado: 'Pendente', data_pagamento: '', id_taxa: 1 },
      { id: 3, mes_pago: '2026-06-01', estado: 'Atrasado', data_pagamento: '', id_taxa: 1 },
    ],
  },

  ocorrencias: {
    key: 'ocorrencias',
    label: 'Ocorrências',
    labelSingular: 'Ocorrência',
    role: 'sindico',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Pendente', 'Em resolução', 'Resolvido'], required: true },
      campoVisibilidade(),
    ],
    columns: ['titulo', 'estado', 'visibilidade'],
    endpoints: { list: 'GET /ocorrencia', create: 'POST /ocorrencia', update: 'PUT /ocorrencia/:id', remove: 'DELETE /ocorrencia/:id' },
    mock: [
      { id: 1, titulo: 'Lâmpada queimada no corredor', descricao: 'Corredor do bloco B, 2º andar.', estado: 'Pendente', visibilidade: 'Ativo' },
      { id: 2, titulo: 'Portão da garagem a fazer ruído', descricao: 'Rangido ao abrir/fechar.', estado: 'Em resolução', visibilidade: 'Ativo' },
      { id: 3, titulo: 'Torneira a pingar na área comum', descricao: 'Casa de banho junto à piscina.', estado: 'Resolvido', visibilidade: 'Ativo' },
    ],
  },

  veiculos: {
    key: 'veiculos',
    label: 'Veículos',
    labelSingular: 'Veículo',
    role: 'sindico',
    fields: [
      { key: 'placa', label: 'Placa', type: 'text', required: true },
      { key: 'nome_motorista', label: 'Nome do Motorista', type: 'text', required: true },
      campoVisibilidade(),
    ],
    columns: ['placa', 'nome_motorista', 'visibilidade'],
    endpoints: { list: 'GET /veiculo', create: 'POST /veiculo', update: 'PUT /veiculo/:id', remove: 'DELETE /veiculo/:id' },
    mock: [
      { id: 1, placa: 'LD-45-67-AO', nome_motorista: 'João Neto', visibilidade: 'Ativo' },
    ],
  },

  visitantes: {
    key: 'visitantes',
    label: 'Visitantes',
    labelSingular: 'Visitante',
    role: 'sindico',
    fields: [
      { key: 'nome', label: 'Nome', type: 'text', required: true },
      // A entrada/saída da visita é registada pelo porteiro na portaria, não
      // aqui — ver a tela "Visitas" do perfil Porteiro em app.js.
      { key: 'data_entrada', label: 'Data de Entrada', type: 'datetime-local', required: true, hidden: true, hiddenDefault: '' },
      { key: 'data_saida', label: 'Data de Saída', type: 'datetime-local', required: false, hidden: true, hiddenDefault: '' },
      campoVisibilidade(),
    ],
    columns: ['nome', 'data_entrada', 'data_saida', 'visibilidade'],
    endpoints: { list: 'GET /visitante', create: 'POST /visitante', update: 'PUT /visitante/:id', remove: 'DELETE /visitante/:id' },
    mock: [
      { id: 1, nome: 'Pedro Almeida', data_entrada: '2026-08-13T18:00', data_saida: '', visibilidade: 'Ativo' },
    ],
  },

  /* ==========================================================================
     ÁREA MORADOR
     (reaproveitam a estrutura de veículos/visitantes/reservas/ocorrências/
     pagamentos acima, mas com dados filtrados/isolados para o morador logado)
     ========================================================================== */

  meusVeiculos: {
    key: 'meusVeiculos',
    label: 'Meus Veículos',
    labelSingular: 'Veículo',
    role: 'morador',
    fields: [
      { key: 'placa', label: 'Placa', type: 'text', required: true },
      { key: 'nome_motorista', label: 'Nome do Motorista', type: 'text', required: true },
      campoVisibilidadeOculta(),
    ],
    columns: ['placa', 'nome_motorista'],
    endpoints: { list: 'GET /morador/veiculo', create: 'POST /morador/veiculo', update: 'PUT /morador/veiculo/:id', remove: 'DELETE /morador/veiculo/:id' },
    mock: [
      { id: 1, placa: 'LD-12-34-BO', nome_motorista: 'João Neto', visibilidade: 'Ativo' },
    ],
  },

  minhasVisitas: {
    key: 'minhasVisitas',
    label: 'Minhas Visitas',
    labelSingular: 'Visita',
    role: 'morador',
    fields: [
      { key: 'nome', label: 'Nome do Visitante', type: 'text', required: true },
      // O porteiro é quem regista a entrada/saída real na portaria — o
      // morador só pré-anuncia o nome do visitante esperado.
      { key: 'data_entrada', label: 'Data de Entrada', type: 'datetime-local', required: true, hidden: true, hiddenDefault: '' },
      { key: 'data_saida', label: 'Data de Saída', type: 'datetime-local', required: false, hidden: true, hiddenDefault: '' },
      campoVisibilidadeOculta(),
    ],
    columns: ['nome', 'data_entrada', 'data_saida'],
    endpoints: { list: 'GET /morador/visitante', create: 'POST /morador/visitante', update: 'PUT /morador/visitante/:id', remove: 'DELETE /morador/visitante/:id' },
    mock: [
      { id: 1, nome: 'Carlos Mendes', data_entrada: '', data_saida: '', visibilidade: 'Ativo' },
    ],
  },

  minhasReservas: {
    key: 'minhasReservas',
    label: 'Minhas Reservas',
    labelSingular: 'Reserva',
    role: 'morador',
    fields: [
      { key: 'data_reserva', label: 'Data da Reserva', type: 'date', required: true },
      { key: 'hora_inicio', label: 'Hora de Início', type: 'text', placeholder: '10:00', required: true },
      { key: 'hora_termino', label: 'Hora de Término', type: 'text', placeholder: '14:00', required: true },
      { key: 'id_area_comum', label: 'Área Comum', type: 'ref', ref: { entity: 'areasComuns', display: 'nome' }, required: true },
      campoVisibilidadeOculta(),
    ],
    columns: ['data_reserva', 'hora_inicio', 'hora_termino', 'id_area_comum'],
    endpoints: { list: 'GET /morador/reserva', create: 'POST /morador/reserva', update: 'PUT /morador/reserva/:id', remove: 'DELETE /morador/reserva/:id' },
    mock: [
      { id: 1, data_reserva: '2026-08-22', hora_inicio: '15:00', hora_termino: '18:00', id_area_comum: 2, visibilidade: 'Ativo' },
    ],
  },

  minhasOcorrencias: {
    key: 'minhasOcorrencias',
    label: 'Minhas Ocorrências',
    labelSingular: 'Ocorrência',
    role: 'morador',
    fields: [
      { key: 'titulo', label: 'Título', type: 'text', required: true },
      { key: 'descricao', label: 'Descrição', type: 'textarea', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Pendente', 'Em resolução', 'Resolvido'], required: true },
      campoVisibilidadeOculta(),
    ],
    columns: ['titulo', 'estado'],
    endpoints: { list: 'GET /morador/ocorrencia', create: 'POST /morador/ocorrencia', update: 'PUT /morador/ocorrencia/:id', remove: 'DELETE /morador/ocorrencia/:id' },
    mock: [
      { id: 1, titulo: 'Vazamento na cozinha', descricao: 'Vazamento pequeno sob a pia.', estado: 'Em resolução', visibilidade: 'Ativo' },
    ],
  },

  meusPagamentos: {
    key: 'meusPagamentos',
    label: 'Meus Pagamentos',
    labelSingular: 'Pagamento',
    role: 'morador',
    readonly: true,
    fields: [],
    columns: ['mes_pago', 'estado', 'data_pagamento', 'id_taxa'],
    endpoints: { list: 'GET /morador/pagamento' },
    mock: [
      { id: 1, mes_pago: '2026-07-01', estado: 'Pago', data_pagamento: '2026-07-05', id_taxa: 1 },
      { id: 2, mes_pago: '2026-08-01', estado: 'Pendente', data_pagamento: '', id_taxa: 1 },
    ],
  },

  comunicadosView: {
    key: 'comunicadosView',
    label: 'Comunicados',
    labelSingular: 'Comunicado',
    role: 'morador',
    readonly: true,
    fields: [],
    columns: ['titulo', 'mensagem'],
    endpoints: { list: 'GET /morador/comunicado' },
    mock: [], // preenchido logo abaixo, a partir dos comunicados do síndico
  },

  regrasView: {
    key: 'regrasView',
    label: 'Regras',
    labelSingular: 'Regra',
    role: 'morador',
    readonly: true,
    fields: [],
    columns: ['lista_regras'],
    endpoints: { list: 'GET /morador/regra' },
    mock: [],
  },

  areasComunsView: {
    key: 'areasComunsView',
    label: 'Áreas Comuns',
    labelSingular: 'Área Comum',
    role: 'morador',
    readonly: true,
    fields: [],
    columns: ['nome', 'capacidade', 'horario_abertura', 'horario_encerramento', 'estado'],
    endpoints: { list: 'GET /morador/area-comum' },
    mock: [],
  },


  sindicos: {
    key:'sindicos',label:'Síndicos',labelSingular:'Síndico',role:'admin',
    fields:[{key:'nome',label:'Nome',type:'text',required:true},{key:'email',label:'Email',type:'email',required:true},{key:'telefone',label:'Telefone',type:'tel',required:true},{key:'condominio',label:'Condomínio',type:'text',required:true},{key:'estado',label:'Estado',type:'select',options:['Ativo','Inativo'],required:true}],
    columns:['nome','email','telefone','condominio','estado'],endpoints:{list:'GET /sindicos',create:'POST /sindicos',update:'PUT /sindicos/:id',remove:'DELETE /sindicos/:id'},
    mock:[{id:1,nome:'João Manuel',email:'joao@condominio.ao',telefone:'923 111 222',condominio:'Jardins do Kilamba',estado:'Ativo'},{id:2,nome:'Ana Paula',email:'ana@condominio.ao',telefone:'924 333 444',condominio:'Residencial Nova Vida',estado:'Ativo'}]
  },

  anuncios: {
    key: 'anuncios', label: 'Publicidade / ADS', labelSingular: 'Publicidade', role: 'admin',
    fields: [
      { key: 'titulo', label: 'Título da publicidade', type: 'text', required: true },
      { key: 'anunciante', label: 'Anunciante / Marca', type: 'text', required: true },
      { key: 'categoria', label: 'Categoria', type: 'select', options: ['Serviços','Casa e Condomínio','Tecnologia','Comércio','Educação','Finanças','Outros'], required: true },
      { key: 'descricao', label: 'Texto da publicidade', type: 'textarea', required: true },
      { key: 'imagem', label: 'Imagem / Banner (URL)', type: 'url', required: false },
      { key: 'cta', label: 'Texto do botão', type: 'text', required: false },
      { key: 'link', label: 'Link de destino', type: 'url', required: false },
      { key: 'publico', label: 'Público', type: 'select', options: ['Todos','Síndicos','Moradores','Porteiros'], required: true },
      { key: 'data_inicio', label: 'Data inicial', type: 'date', required: true },
      { key: 'data_fim', label: 'Data final', type: 'date', required: true },
      { key: 'estado', label: 'Estado', type: 'select', options: ['Ativo','Inativo','Agendado'], required: true },
      { key: 'prioridade', label: 'Destaque', type: 'select', options: ['Normal','Alta'], required: true }
    ],
    columns: ['titulo','anunciante','categoria','publico','data_inicio','data_fim','estado','prioridade'],
    endpoints: { list:'GET /anuncios', create:'POST /anuncios', update:'PUT /anuncios/:id', remove:'DELETE /anuncios/:id' },
    mock: [
      { id:1, titulo:'Internet Fibra para a sua casa', anunciante:'Publicidade CONVIVA', categoria:'Tecnologia', descricao:'Tenha uma ligação rápida e estável para trabalhar, estudar e aproveitar o seu entretenimento em casa.', imagem:'assets/img/ads/ad-fibra.svg', cta:'Conhecer oferta', link:'#', publico:'Todos', data_inicio:'2026-09-20', data_fim:'2026-12-31', estado:'Ativo', prioridade:'Alta' },
      { id:2, titulo:'Proteja a sua casa', anunciante:'Publicidade CONVIVA', categoria:'Casa e Condomínio', descricao:'Soluções modernas de segurança e monitorização para deixar a sua família mais tranquila.', imagem:'assets/img/ads/ad-seguranca.svg', cta:'Ver solução', link:'#', publico:'Moradores', data_inicio:'2026-09-22', data_fim:'2026-12-31', estado:'Ativo', prioridade:'Normal' },
      { id:3, titulo:'Energia solar para o seu lar', anunciante:'Publicidade CONVIVA', categoria:'Serviços', descricao:'Descubra alternativas de energia solar para reduzir custos e aumentar a autonomia da sua residência.', imagem:'assets/img/ads/ad-solar.svg', cta:'Saber mais', link:'#', publico:'Todos', data_inicio:'2026-09-23', data_fim:'2026-12-31', estado:'Ativo', prioridade:'Alta' },
      { id:4, titulo:'Serviços para o seu condomínio', anunciante:'Publicidade CONVIVA', categoria:'Serviços', descricao:'Encontre soluções de limpeza, manutenção e assistência para facilitar a gestão do dia a dia.', imagem:'assets/img/ads/ad-servicos.svg', cta:'Ver serviços', link:'#', publico:'Síndicos', data_inicio:'2026-09-23', data_fim:'2026-12-31', estado:'Ativo', prioridade:'Normal' }
    ]
  },

  manutencoes: {
    key:'manutencoes', label:'Manutenções', labelSingular:'Manutenção', role:'sindico',
    fields:[
      {key:'titulo',label:'Título',type:'text',required:true},{key:'local',label:'Local',type:'text',required:true},
      {key:'descricao',label:'Descrição',type:'textarea',required:true},{key:'fornecedor',label:'Fornecedor',type:'text',required:false},
      {key:'data_abertura',label:'Data de abertura',type:'date',required:true},{key:'data_prevista',label:'Data prevista',type:'date',required:false},
      {key:'custo',label:'Custo (Kz)',type:'number',required:false},{key:'prioridade',label:'Prioridade',type:'select',options:['Baixa','Normal','Alta','Urgente'],required:true},
      {key:'estado',label:'Estado',type:'select',options:['Pendente','Agendada','Em andamento','Concluída','Cancelada'],required:true}
    ],
    columns:['titulo','local','fornecedor','data_prevista','custo','prioridade','estado'],
    endpoints:{list:'GET /manutencoes',create:'POST /manutencoes',update:'PUT /manutencoes/:id',remove:'DELETE /manutencoes/:id'},
    mock:[
      {id:1,titulo:'Revisão do elevador',local:'Bloco A',descricao:'Inspeção preventiva.',fornecedor:'Lift Angola',data_abertura:'2026-09-05',data_prevista:'2026-09-28',custo:85000,prioridade:'Alta',estado:'Agendada'},
      {id:2,titulo:'Jardinagem',local:'Área exterior',descricao:'Poda e manutenção.',fornecedor:'Verde Mais',data_abertura:'2026-09-10',data_prevista:'2026-09-25',custo:32000,prioridade:'Normal',estado:'Em andamento'}
    ]
  },

  documentos: {
    key:'documentos',label:'Documentos',labelSingular:'Documento',role:'sindico',
    fields:[{key:'nome',label:'Nome',type:'text',required:true},{key:'categoria',label:'Categoria',type:'select',options:['Ata','Regulamento','Contrato','Financeiro','Administrativo','Outro'],required:true},{key:'descricao',label:'Descrição',type:'textarea',required:false},{key:'data',label:'Data',type:'date',required:true},{key:'ficheiro',label:'Ficheiro (URL)',type:'url',required:false}],
    columns:['nome','categoria','data','descricao'], endpoints:{list:'GET /documentos',create:'POST /documentos',update:'PUT /documentos/:id',remove:'DELETE /documentos/:id'},
    mock:[{id:1,nome:'Regulamento interno',categoria:'Regulamento',descricao:'Normas de convivência.',data:'2026-01-12',ficheiro:''},{id:2,nome:'Ata da assembleia',categoria:'Ata',descricao:'Ata da assembleia anual.',data:'2026-03-18',ficheiro:''}]
  },

  funcionariosCasa: {
    key:'funcionariosCasa',label:'Funcionários da Minha Casa',labelSingular:'Funcionário',role:'morador',
    fields:[{key:'nome',label:'Nome',type:'text',required:true},{key:'funcao',label:'Função',type:'select',options:['Empregada doméstica','Jardineiro','Motorista','Cuidador','Outro'],required:true},{key:'documento',label:'Documento',type:'text',required:true},{key:'telefone',label:'Telefone',type:'tel',required:true},{key:'data_entrada',label:'Data de entrada',type:'date',required:true},{key:'estado',label:'Estado',type:'select',options:['Ativo','Inativo'],required:true}],
    columns:['nome','funcao','documento','telefone','data_entrada','estado'],endpoints:{list:'GET /morador/funcionarios-casa',create:'POST /morador/funcionarios-casa',update:'PUT /morador/funcionarios-casa/:id',remove:'DELETE /morador/funcionarios-casa/:id'},
    mock:[{id:1,nome:'Maria José',funcao:'Empregada doméstica',documento:'009876543LA042',telefone:'923 400 120',data_entrada:'2026-02-01',estado:'Ativo'},{id:2,nome:'Carlos Pedro',funcao:'Jardineiro',documento:'004321987LA042',telefone:'925 555 100',data_entrada:'2026-04-12',estado:'Ativo'}]
  },

  /* ==========================================================================
     ÁREA PORTEIRO
     Conta criada pelo síndico (ver entidade `porteiros`). O porteiro não cria
     nem edita nada aqui — só consulta a lista de portas do condomínio e usa a
     tela dedicada "Visitas" (ver renderPorteiroVisitasScreen em app.js) para
     registar entradas/saídas e conferir viaturas.
     ========================================================================== */
  portasView: {
    key: 'portasView',
    label: 'Portas',
    labelSingular: 'Porta',
    role: 'porteiro',
    readonly: true,
    fields: [],
    columns: ['nome', 'tipo', 'visibilidade'],
    endpoints: { list: 'GET /porteiro/porta' },
    mock: [],
  },
};

// Corrige referências que precisam copiar mock data de outras entidades
// (comunicados/regras/áreas comuns vistas pelo morador são somente leitura
// de dados que, no sistema real, viriam do condomínio do morador)
ENTITIES.comunicadosView.mock = ENTITIES.comunicados.mock.map(item => ({ ...item }));
ENTITIES.regrasView.mock = ENTITIES.regras.mock.map(item => ({ ...item }));
ENTITIES.areasComunsView.mock = ENTITIES.areasComuns.mock.map(item => ({ ...item }));
ENTITIES.portasView.mock = ENTITIES.portas.mock.map(item => ({ ...item }));

/* ============================================================================
   "Banco de dados" em memória. Cada chave de ENTITIES recebe uma cópia do seu
   mock inicial. window.DB é o que os formulários leem/escrevem.
   ============================================================================ */
const DB = {};
Object.keys(ENTITIES).forEach(key => {
  DB[key] = ENTITIES[key].mock.map(item => ({ ...item }));
});

// Registro extra: dados fixos de exemplo para a tela "Minha Unidade" do morador
const MINHA_UNIDADE_EXEMPLO = {
  numero: 'A-101',
  tipo: 'Apartamento',
  visibilidade: 'Ativo',
  condominio: 'Condomínio Jardins do Kilamba',
};

// Registro extra: lista de vínculos morador <-> unidade (tela "Vincular morador")
const VINCULOS = [
  { id: 1, id_unidade: 1, id_morador: 1 },
];

// Registro extra: votos já dados (tela "Votações" do morador). Cada morador
// só pode votar uma vez por votação — ver renderVotacoesMoradorScreen em app.js.
// MORADOR_LOGADO_ID simula o morador da sessão atual (mockup sem auth real).
const MORADOR_LOGADO_ID = 1;
const VOTOS = [
  { id: 1, id_votacao: 2, id_morador: 1, opcao: 'Manter atual' },
];

/* ============================================================================
   Menus laterais por perfil (usados para gerar a sidebar e as telas
   automaticamente a partir das entidades acima).
   Cada perfil é uma lista de "secções": itens soltos (sem grupo, ex.:
   "Início") ficam sempre visíveis; itens dentro de um `group` ficam debaixo
   de um cabeçalho clicável que expande/recolhe a sublista — like the
   reference screenshot ("GERENCIAMENTO DE RESERVAS", etc.).
   ============================================================================ */
const MENUS = {
  admin: [
    { type: 'home', label: 'Início', icon: 'home' },
    {
      group: 'Plataforma', icon: 'layers',
      items: [
        { type: 'entity', label: 'Centralidades', icon: 'mapPin', entity: 'centralidades' },
        { type: 'entity', label: 'Tipos de Condomínio', icon: 'layers', entity: 'tiposCondominio' },
        { type: 'entity', label: 'Tipos de Pagamento', icon: 'creditCard', entity: 'tiposPagamento' },
        { type: 'entity', label: 'Planos', icon: 'package', entity: 'planos' },
        { type: 'entity', label: 'Publicidade / ADS', icon: 'megaphone', entity: 'anuncios' },
      ],
    },
    {
      group: 'Contas', icon: 'shield',
      items: [
        { type: 'entity', label: 'Administradores', icon: 'shield', entity: 'administradores' },
        { type: 'entity', label: 'Condomínios', icon: 'building', entity: 'condominios' },
        { type: 'entity', label: 'Usuários', icon: 'grid', entity: 'usuarios' },
        { type: 'entity', label: 'Síndicos', icon: 'shield', entity: 'sindicos' },
        { type: 'entity', label: 'Moradores', icon: 'users', entity: 'moradores' },
        { type: 'entity', label: 'Funcionários', icon: 'wrench', entity: 'funcionarios' },
        { type: 'entity', label: 'Porteiros', icon: 'shield', entity: 'porteiros' },
      ],
    },
    { group: 'Financeiro', icon: 'wallet', items: [
        { type: 'entity', label: 'Pagamentos', icon: 'coins', entity: 'pagamentos' },
        { type: 'entity', label: 'Taxas', icon: 'receipt', entity: 'taxas' },
        { type: 'entity', label: 'Despesas', icon: 'wallet', entity: 'despesas' },
      ] },
  ],
  sindico: [
    { type: 'home', label: 'Início', icon: 'home' },
    {
      group: 'Gestão de Moradores', icon: 'users',
      items: [
        { type: 'entity', label: 'Moradores', icon: 'users', entity: 'moradores' },
        { type: 'entity', label: 'Unidades', icon: 'door', entity: 'unidades' },
        { type: 'vincular', label: 'Vincular Morador', icon: 'link' },
      ],
    },
    {
      group: 'Equipa e Portaria', icon: 'wrench',
      items: [
        { type: 'entity', label: 'Funcionários', icon: 'wrench', entity: 'funcionarios' },
        { type: 'entity', label: 'Porteiros', icon: 'shield', entity: 'porteiros' },
        { type: 'entity', label: 'Portas', icon: 'door', entity: 'portas' },
        { type: 'entity', label: 'Manutenções', icon: 'wrench', entity: 'manutencoes' },
        { type: 'entity', label: 'Documentos', icon: 'fileText', entity: 'documentos' },
      ],
    },
    {
      group: 'Espaços e Reservas', icon: 'waves',
      items: [
        { type: 'entity', label: 'Áreas Comuns', icon: 'waves', entity: 'areasComuns' },
        { type: 'entity', label: 'Reservas', icon: 'calendar', entity: 'reservas' },
      ],
    },
    {
      group: 'Comunicação', icon: 'megaphone',
      items: [
        { type: 'entity', label: 'Comunicados', icon: 'megaphone', entity: 'comunicados' },
        { type: 'custom', label: 'Chat do Condomínio', icon: 'message', screen: 'chat' },
        { type: 'entity', label: 'Votações', icon: 'vote', entity: 'votacoes' },
        { type: 'entity', label: 'Regras', icon: 'scroll', entity: 'regras' },
      ],
    },
    {
      group: 'Financeiro', icon: 'wallet',
      items: [
        { type: 'entity', label: 'Despesas', icon: 'wallet', entity: 'despesas' },
        { type: 'entity', label: 'Taxas', icon: 'receipt', entity: 'taxas' },
        { type: 'entity', label: 'Pagamentos', icon: 'coins', entity: 'pagamentos' },
      ],
    },
    {
      group: 'Segurança e Ocorrências', icon: 'alert',
      items: [
        { type: 'entity', label: 'Ocorrências', icon: 'alert', entity: 'ocorrencias' },
        { type: 'entity', label: 'Veículos', icon: 'car', entity: 'veiculos' },
        { type: 'entity', label: 'Visitantes', icon: 'walker', entity: 'visitantes' },
      ],
    },
  ],
  morador: [
    { type: 'home', label: 'Início', icon: 'home' },
    { type: 'minhaUnidade', label: 'Minha Unidade', icon: 'door' },
    {
      group: 'Os Meus Dados', icon: 'car',
      items: [
        { type: 'entity', label: 'Meus Veículos', icon: 'car', entity: 'meusVeiculos' },
        { type: 'entity', label: 'Minhas Visitas', icon: 'walker', entity: 'minhasVisitas' },
        { type: 'entity', label: 'Minhas Reservas', icon: 'calendar', entity: 'minhasReservas' },
        { type: 'entity', label: 'Minhas Ocorrências', icon: 'alert', entity: 'minhasOcorrencias' },
        { type: 'custom', label: 'Minha Mensalidade', icon: 'receipt', screen: 'mensalidade' },
        { type: 'custom', label: 'Pagar Mensalidade', icon: 'creditCard', screen: 'pagar' },
        { type: 'entity', label: 'Meus Pagamentos', icon: 'coins', entity: 'meusPagamentos' },
        { type: 'entity', label: 'Funcionários da Minha Casa', icon: 'users', entity: 'funcionariosCasa' },
      ],
    },
    {
      group: 'O Condomínio', icon: 'megaphone',
      items: [
        { type: 'custom', label: 'Chat do Condomínio', icon: 'message', screen: 'chat' },
        { type: 'entity', label: 'Comunicados', icon: 'megaphone', entity: 'comunicadosView' },
        { type: 'custom', label: 'Manutenções', icon: 'wrench', screen: 'manutencoesMorador' },
        { type: 'votar', label: 'Votações', icon: 'vote' },
        { type: 'entity', label: 'Regras', icon: 'scroll', entity: 'regrasView' },
        { type: 'entity', label: 'Áreas Comuns', icon: 'waves', entity: 'areasComunsView' },
      ],
    },
  ],
  porteiro: [
    { type: 'home', label: 'Início', icon: 'home' },
    {
      group: 'Portaria', icon: 'shield',
      items: [
        { type: 'visitasPorteiro', label: 'Visitas', icon: 'walker' },
        { type: 'veiculosPorteiro', label: 'Veículos do Condomínio', icon: 'car' },
        { type: 'entity', label: 'Portas', icon: 'door', entity: 'portasView' },
        
      ],
    },
  ],
};
