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
      { key: 'data_entrada', label: 'Data de Entrada', type: 'datetime-local', required: true },
      { key: 'data_saida', label: 'Data de Saída', type: 'datetime-local', required: false },
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
      campoVisibilidade(),
    ],
    columns: ['placa', 'nome_motorista', 'visibilidade'],
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
      { key: 'data_entrada', label: 'Data de Entrada', type: 'datetime-local', required: true },
      { key: 'data_saida', label: 'Data de Saída', type: 'datetime-local', required: false },
      campoVisibilidade(),
    ],
    columns: ['nome', 'data_entrada', 'data_saida', 'visibilidade'],
    endpoints: { list: 'GET /morador/visitante', create: 'POST /morador/visitante', update: 'PUT /morador/visitante/:id', remove: 'DELETE /morador/visitante/:id' },
    mock: [
      { id: 1, nome: 'Carlos Mendes', data_entrada: '2026-08-14T10:00', data_saida: '', visibilidade: 'Ativo' },
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
      campoVisibilidade(),
    ],
    columns: ['data_reserva', 'hora_inicio', 'hora_termino', 'id_area_comum', 'visibilidade'],
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
      campoVisibilidade(),
    ],
    columns: ['titulo', 'estado', 'visibilidade'],
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
};

// Corrige referências que precisam copiar mock data de outras entidades
// (comunicados/regras/áreas comuns vistas pelo morador são somente leitura
// de dados que, no sistema real, viriam do condomínio do morador)
ENTITIES.comunicadosView.mock = ENTITIES.comunicados.mock.map(item => ({ ...item }));
ENTITIES.regrasView.mock = ENTITIES.regras.mock.map(item => ({ ...item }));
ENTITIES.areasComunsView.mock = ENTITIES.areasComuns.mock.map(item => ({ ...item }));

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

/* ============================================================================
   Menus laterais por perfil (usados para gerar a sidebar e as telas
   automaticamente a partir das entidades acima).
   ============================================================================ */
const MENUS = {
  admin: [
    { type: 'home', label: 'Início', icon: 'home' },
    { type: 'entity', label: 'Centralidades', icon: 'mapPin', entity: 'centralidades' },
    { type: 'entity', label: 'Tipos de Condomínio', icon: 'layers', entity: 'tiposCondominio' },
    { type: 'entity', label: 'Tipos de Pagamento', icon: 'creditCard', entity: 'tiposPagamento' },
    { type: 'entity', label: 'Planos', icon: 'package', entity: 'planos' },
    { type: 'entity', label: 'Administradores', icon: 'shield', entity: 'administradores' },
    { type: 'entity', label: 'Condomínios', icon: 'building', entity: 'condominios' },
    { type: 'entity', label: 'Usuários', icon: 'grid', entity: 'usuarios' },
  ],
  sindico: [
    { type: 'home', label: 'Início', icon: 'home' },
    { type: 'entity', label: 'Moradores', icon: 'users', entity: 'moradores' },
    { type: 'entity', label: 'Unidades', icon: 'door', entity: 'unidades' },
    { type: 'vincular', label: 'Vincular Morador', icon: 'link' },
    { type: 'entity', label: 'Funcionários', icon: 'wrench', entity: 'funcionarios' },
    { type: 'entity', label: 'Áreas Comuns', icon: 'waves', entity: 'areasComuns' },
    { type: 'entity', label: 'Reservas', icon: 'calendar', entity: 'reservas' },
    { type: 'entity', label: 'Comunicados', icon: 'megaphone', entity: 'comunicados' },
    { type: 'entity', label: 'Regras', icon: 'scroll', entity: 'regras' },
    { type: 'entity', label: 'Despesas', icon: 'wallet', entity: 'despesas' },
    { type: 'entity', label: 'Taxas', icon: 'receipt', entity: 'taxas' },
    { type: 'entity', label: 'Pagamentos', icon: 'coins', entity: 'pagamentos' },
    { type: 'entity', label: 'Ocorrências', icon: 'alert', entity: 'ocorrencias' },
    { type: 'entity', label: 'Veículos', icon: 'car', entity: 'veiculos' },
    { type: 'entity', label: 'Visitantes', icon: 'walker', entity: 'visitantes' },
  ],
  morador: [
    { type: 'home', label: 'Início', icon: 'home' },
    { type: 'minhaUnidade', label: 'Minha Unidade', icon: 'door' },
    { type: 'entity', label: 'Meus Veículos', icon: 'car', entity: 'meusVeiculos' },
    { type: 'entity', label: 'Minhas Visitas', icon: 'walker', entity: 'minhasVisitas' },
    { type: 'entity', label: 'Minhas Reservas', icon: 'calendar', entity: 'minhasReservas' },
    { type: 'entity', label: 'Minhas Ocorrências', icon: 'alert', entity: 'minhasOcorrencias' },
    { type: 'entity', label: 'Meus Pagamentos', icon: 'coins', entity: 'meusPagamentos' },
    { type: 'entity', label: 'Comunicados', icon: 'megaphone', entity: 'comunicadosView' },
    { type: 'entity', label: 'Regras', icon: 'scroll', entity: 'regrasView' },
    { type: 'entity', label: 'Áreas Comuns', icon: 'waves', entity: 'areasComunsView' },
  ],
};
