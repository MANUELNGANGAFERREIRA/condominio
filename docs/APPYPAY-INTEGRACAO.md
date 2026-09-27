# Pagamentos CONVIVA — AppyPay

A área de pagamentos foi reorganizada para trabalhar com três opções visíveis ao utilizador:

1. **Multicaixa Express** — AppyPay / GPO.
2. **Referência Multicaixa** — AppyPay / REF.
3. **Transferência bancária** — validação manual pelo CONVIVA.

## O que já está preparado no frontend

- Seleção explícita do método antes de confirmar o pagamento.
- Conteúdo e instruções diferentes para cada método.
- Upload de comprovativo apenas na transferência bancária.
- Histórico com método e provedor do pagamento.
- Dados demonstrativos de Entidade/Referência para o modo de apresentação.
- Separação entre AppyPay (Express/Referência) e transferência bancária manual.
- Nenhuma credencial privada da AppyPay é colocada no JavaScript do navegador.

## Integração real

O projeto atual é HTML/CSS/JavaScript puro e continua em modo demonstração. Para produção, o backend deve criar o pedido de pagamento e guardar/validar o estado através dos mecanismos da AppyPay.

A AppyPay disponibiliza integração por API para Multicaixa Express (GPO) e Pagamentos por Referência, além de um produto Checkout que permite disponibilizar os métodos de pagamento no sistema.

Documentação oficial:

- https://www.appypay.co.ao/api-info
- https://www.appypay.co.ao/checkout-info
- https://appypay.stoplight.io/docs/appypay-payment-gateway/e36aeb2e2fb52-intro

### Backend CONVIVA sugerido

- `POST /pagamentos/checkout` — recebe plano/valor/método e cria a cobrança no servidor.
- `GET /pagamentos/:id` — consulta o estado da cobrança.
- `POST /pagamentos/webhook/appyPay` — recebe a notificação do gateway, depois de confirmado o mecanismo de callback/webhook contratado.
- `POST /pagamentos/:id/comprovativo` — recebe o comprovativo de transferência manual.

**Importante:** os nomes acima são endpoints internos sugeridos para o backend CONVIVA; não são apresentados como endpoints oficiais da AppyPay. Os endpoints, headers, credenciais e payloads oficiais devem ser implementados exatamente segundo a documentação/credenciais fornecidas pela AppyPay para a conta do comerciante.

## Transferência bancária

A transferência foi mantida como método separado porque a informação pública atual da AppyPay apresenta GPO/Multicaixa Express e Pagamentos por Referência como métodos de pagamento integráveis, enquanto a transferência bancária no CONVIVA é tratada como fluxo manual de validação.
