# Exenzia Finance Bot

Assistente financeiro em NestJS para integração com Conta Azul. Monitora clientes, vendas e financeiro via polling e dispara stubs de mensageria.

## Requisitos
- Node.js 18+
- Docker e Docker Compose
- PostgreSQL

## Variáveis de ambiente
Copie `.env.example` para `.env` e ajuste:
- `CONTA_AZUL_BASE_URL`: host da API Conta Azul
- `CONTA_AZUL_TOKEN_URL`: endpoint de OAuth2
- `CONTA_AZUL_CLIENT_ID` / `CONTA_AZUL_CLIENT_SECRET`
- `CONTA_AZUL_SCOPE`: já configurado para `openid profile aws.cognito.signin.user.admin`
- `DATABASE_URL`: string de conexão do PostgreSQL

## Rodando com Docker
```bash
docker-compose up --build
```
O serviço aplica migrações Prisma e inicia em `http://localhost:3000`.

## Desenvolvimento local
```bash
npm install
npm run prisma:generate
npm run build
npm run start:dev
```
Para popular dados de demonstração:
```bash
npm run seed
```

## Banco de Dados
- Prisma ORM com PostgreSQL
- Migrations em `prisma/migrations`
- Seed em `prisma/seed.ts`

## Fluxo Conta Azul
1. **Autenticação OAuth2**: tokens armazenados e renovados automaticamente pelo `TokenService`.
2. **Polling**: job cron a cada 60 segundos busca registros alterados desde o último poll (`PollState`).
3. **Clientes**: sincroniza id, id_legado, nome, documento, tipo_pessoa.
4. **Vendas**: consome `/v1/venda/busca` filtrando por `data_alteracao_de`/`ate`, grava status e financeiro.
5. **Financeiro**: parcelas mapeadas em `PaymentInstallment` com identificação de vencidas/abertas.
6. **Mensageria**: `MessageService` possui stubs `sendSaleCreated`, `sendSaleInvoiced`, `sendPaymentReminder` para futura integração com WhatsApp/API externa.

## Observabilidade
- Logs claros com `Logger` do NestJS.
- Tratamento de erros e backoff exponencial para respostas 429.
