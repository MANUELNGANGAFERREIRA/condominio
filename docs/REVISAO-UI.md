# Revisão de interface — CONVIVA

## Base escolhida
A versão utilizada como base foi a segunda entrega (`index.html`, `css/style.css`, `js/app.js`), porque contém a evolução mais completa do fluxo de pagamentos, incluindo Multicaixa Express, Referência Multicaixa, transferência bancária e comprovativo.

## Correções aplicadas
- Adicionados estilos completos para o chat do condomínio.
- Adicionado filtro de membros no chat e validação de mensagem vazia.
- Adicionados estilos para comunicados e detalhe de comunicado.
- Adicionados estilos para manutenção do condomínio.
- Adicionados estilos para fundador e organigrama da landing page.
- Adicionado layout responsivo para organigrama, chat e manutenção.
- Adicionado suporte visual para tabelas responsivas.
- Completados estilos dos blocos de instruções e detalhes de pagamento.
- Adicionados estilos para fallback do dashboard e pequenos componentes dinâmicos.
- Mantida a lógica de pagamentos da versão mais trabalhada.

## Validação
- `node --check` executado em `app.js` sem erros de sintaxe.
- Os restantes ficheiros JavaScript da base também foram verificados antes da consolidação.


## Ajuste solicitado — organização vertical
- Formulários de gestão ficam acima dos respetivos conteúdos/listas.
- As áreas de moradores e demais módulos de gestão usam uma única coluna.
- Nenhuma lógica de pagamentos, dados ou regras de negócio foi alterada.

- Ajuste final: no desktop (>900px), os CRUDs passam a usar uma única coluna: formulário em cima e lista/tabela em baixo. No mobile, o comportamento de uma coluna foi preservado.
