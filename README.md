<p align="center">
  <a href="http://nestjs.com/" target="blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" />
  </a>
</p>

<p align="center">
  API de consulta de CEP com cache, fila assíncrona e persistência em banco de dados.
</p>

---

## Description

Projeto desenvolvido com NestJS para consulta inteligente de CEP utilizando cache, fila assíncrona e persistência em banco de dados.

---

# 📦 Address API

API para consulta de CEP com:

✅ Cache em Redis  
✅ Persistência assíncrona com BullMQ  
✅ Banco de dados via Prisma  
✅ Documentação Swagger  
✅ Monitoramento de filas com Bull Board

---

# 🚀 Tecnologias Utilizadas

- NestJS
- Prisma ORM
- PostgreSQL (ou outro banco configurado no Prisma)
- Redis
- BullMQ
- Swagger
- Axios
- Bull Board

---

# 📌 Funcionalidades

✔ Cache com Redis  
✔ Persistência assíncrona com BullMQ  
✔ Banco de dados via Prisma  
✔ Integração com API externa (ViaCEP)  
✔ Documentação automática com Swagger  
✔ Dashboard de filas com Bull Board

## 🔎 Consulta de CEP

- Busca primeiro no Redis
- Se não encontrar:
  - Busca no banco de dados
- Se ainda não existir:
  - Consulta a API ViaCEP
  - Retorna o resultado imediatamente
  - Envia job para fila para salvar no banco

# 📌 Endpoint

## GET /address/:cep

Exemplo:

GET /address/01001000

Resposta:

```json
{
  "cep": "01001000",
  "logradouro": "Praça da Sé",
  "localidade": "São Paulo",
  "uf": "SP"
}
```

---

## ▶️ Como rodar o projeto

- Pré‑requisitos:
  - Node.js 18+ (recomendado)
  - Redis rodando em localhost:6379
  - Banco configurado no Prisma (ex.: PostgreSQL) e variável `DATABASE_URL` no `.env`
- Via npm:
  - `npm install`
  - `npx prisma generate`
  - `npx prisma migrate dev`
  - Desenvolvimento: `npm run start:dev`
  - Produção: `npm run build && npm run start:prod`
- Via Docker Compose:
  - `docker-compose up -d` (sobe serviços definidos no compose)
- Acessos padrão:
  - API: `http://localhost:${PORT-3000}`
  - Swagger: `http://localhost:3000/docs`
  - Bull Board: `http://localhost:3000/admin/queues`

---

## 🔧 Variáveis de ambiente

- `PORT` — porta da API (default 3000)
- `DATABASE_URL` — URL do banco para o Prisma
- `REDIS_HOST`/`REDIS_PORT` — caso deseje customizar; por padrão `localhost:6379`

---

## 📚 Como acessar o Swagger

- Documentação interativa em: `http://localhost:3000/docs`
- Geração configurada no `main.ts` via `SwaggerModule` + `DocumentBuilder`

---

## 🧭 Fluxo de lazy load (consulta de CEP)

- Ordem de resolução:
  - 1. Redis (cache)
  - 2. Banco (Prisma)
  - 3. ViaCEP (requisição externa)
- Quando vem do ViaCEP:
  - Retorna imediatamente ao cliente
  - Enfileira um job para salvar no banco de forma assíncrona (persistência preguiçosa)

---

## 🧠 Estratégia de cache

- Chave: `CEP` (ex.: `01001000`)
- TTL: 1 hora ao salvar resultados vindos do banco
- Miss no cache:
  - Consulta banco; se encontrar, grava em cache
  - Senão, consulta ViaCEP e retorna o payload (sem cache imediato), enfileirando o salvamento
- Invalidação:
  - Por padrão, renovação por TTL. Estratégias de invalidação específicas podem ser adicionadas conforme necessidade

---

## 🧵 Funcionamento da fila

- Fila: `address-queue` (BullMQ)
- Producer (no `AddressService`):
  - Job: `save-address`
  - `jobId = CEP` para deduplicar
  - Dados: `{ cep, street, city, state }` mapeados a partir do ViaCEP
- Consumer (`AddressProcessor`):
  - Implementado com `WorkerHost.process`
  - Verifica existência pelo CEP; se não existir, cria

---

## ⚙️ Concorrência e idempotência

- Deduplicação de jobs:
  - `jobId` = CEP reduz a chance de jobs duplicados simultâneos
- Verificação de existência:
  - `findUnique({ where: { cep } })` antes de criar
- Camada de banco:
  - CEP tratado como único (consulta via `findUnique`) — reforça idempotência
- Escala:
  - Concurrency default do worker; escalável aumentando instâncias/replicas

---

## 🧩 Decisões técnicas e trade‑offs

- Persistência assíncrona (lazy) após ViaCEP:
  - Trade‑off: resposta rápida vs possibilidade de dado não imediatamente persistido
- Cache com TTL de 1h:
  - Trade‑off: evita consultas repetidas vs potencial desatualização temporária
- Bull Board integrado no mesmo processo (em `/admin/queues`):
  - Simplicidade de operação vs acoplamento à aplicação principal
- Tipagem e segurança:
  - Resposta do ViaCEP e JSON do Redis tipados para reduzir `any` e evitar “unsafe”
- Axios para HTTP:
  - API madura e simples vs dependência adicional
- Injeção da fila com `getQueueToken`:
  - Resolução consistente do provider da fila e testes mais simples

---

## 🧱 Arquitetura Hexagonal (Ports & Adapters)

- Core (regras de negócio):
  - Ports: `core/ports`
    - `CachePort`, `AddressRepositoryPort`, `CepProviderPort`, `QueuePort`
  - Models: `core/models`
    - `ViaCepResponse`
  - Caso de uso: `core/use-cases`
    - `FindAddressByCepUseCase` (orquestra cache → banco → ViaCEP e enfileira salvamento)
  - Tokens: `core/tokens`
    - Identificadores para inversão de dependência
- Adapters (infraestrutura):
  - Prisma: `infrastructure/adapters/prisma/prisma-address.repository.adapter.ts`
  - Redis: `infrastructure/adapters/redis/redis.cache.adapter.ts`
  - ViaCEP: `infrastructure/adapters/viacep/viacep.provider.adapter.ts`
  - BullMQ: `infrastructure/adapters/bull/bull.queue.adapter.ts`
- Orquestração no módulo:
  - Bind dos adapters aos tokens no `AddressModule`
  - Factory do `FindAddressByCepUseCase` injetando ports
- Serviço de aplicação:
  - `AddressService` delega a leitura ao caso de uso e cria via `AddressRepositoryPort`
  - Lógica de cache preservada (Redis → DB → ViaCEP) com TTL e enfileiramento

---

## 🗂️ Estrutura de Pastas (resumo)

- `src/core`
  - `ports/` — contratos do domínio (CachePort, AddressRepositoryPort, CepProviderPort, QueuePort)
  - `models/` — modelos de domínio (ViaCepResponse)
  - `use-cases/` — casos de uso (FindAddressByCepUseCase)
  - `tokens.ts` — identificadores de injeção
- `src/infrastructure/adapters`
  - `prisma/` — repositório Prisma
  - `redis/` — cache Redis (ioredis)
  - `viacep/` — provedor HTTP da ViaCEP (axios)
  - `bull/` — fila BullMQ
- `src/address` — controller, service e módulo (wiring)
- `src/queue` — worker/processor
- `src/prisma` — PrismaService

---

## 🔌 Como estender/trocar adapters

- Novo cache:
  - Implementar `CachePort`
  - Trocar o bind de `TOKENS.CACHE` no `AddressModule`
- Novo provedor de CEP:
  - Implementar `CepProviderPort`
  - Trocar o bind de `TOKENS.CEP_PROVIDER`
- Outro banco:
  - Implementar `AddressRepositoryPort`
  - Trocar `TOKENS.REPOSITORY`
- Outra fila:
  - Implementar `QueuePort`
  - Trocar `TOKENS.QUEUE`

Sem alterar o caso de uso; apenas troca de adapter e o bind no módulo.

---

## ✅ O que foi implementado

- Integração do Bull Board no bootstrap:
  - ExpressAdapter + BullMQAdapter
  - Rota: `/admin/queues` na própria aplicação
- Fila e injeção:
  - Export do `BullModule` no `QueueModule` para liberar o token da fila
  - Uso de `getQueueToken('address-queue')` para obter a fila com tipagem
- AddressService:
  - Tipagem da resposta ViaCEP e do JSON.parse do cache
  - Enfileiramento com `void` para evitar promessas pendentes
  - TTL de 1h no cache Redis ao salvar resultados do banco
- AddressProcessor:
  - Implementação com `WorkerHost.process`
  - Persistência condicional (não duplica CEP já existente)
- BullMQ:
  - Registro da fila `address-queue`
- Swagger:
  - Documentação em `/docs`
- Insomnia:
  - Arquivo `Insomnia_2026-02-17.yaml` com coleção de requisições
- Testes (Jest):
  - Service: retorna do Redis, retorna do DB e faz cache, chama ViaCEP, enfileira job
  - Processor: não cria se já existe, cria quando não existe
  - Controller/App: instância e resposta base

---

## Insomnia (coleção de requests)

O repositório inclui um export do Insomnia para facilitar os testes dos endpoints:

- Arquivo: Insomnia_2026-02-17.yaml (na raiz do projeto)
- Como importar no Insomnia:
  - Abra o Insomnia.
  - Vá em Application (ou File) → Import/Export → Import Data → From File.
  - Selecione o arquivo Insomnia_2026-02-17.yaml.
  - Alternativamente, arraste o arquivo para a janela do Insomnia.
- Após importar, ajuste a variável do host se necessário (ex.: http://localhost:3000).

---

## 🧪 Testes

- Framework: Jest + @nestjs/testing
- Como executar:
  - Todos os testes: `npm run test`
  - Modo watch: `npm run test:watch`
- Cobertura principal:
  - AddressService:
    - Retorna do Redis quando há cache.
    - Retorna do banco e grava no cache quando presente no Prisma.
    - Chama a ViaCEP quando não encontra em cache/banco e retorna `cep`, `logradouro`, `localidade`, `uf`.
    - Enfileira o job `save-address` com payload correto para a BullMQ.
  - AddressProcessor:
    - Não cria um endereço quando o CEP já existe.
    - Cria um endereço quando não existe (campos `cep`, `street`, `city`, `state`).
  - AddressController:
    - Controller instanciado corretamente com o service mockado.
  - AppController:
    - Retorna “Hello World!” no teste base.
- Estratégias de mock:
  - Fila: `getQueueToken('address-queue')` para registrar mock da fila.
  - Redis: desconexão da instância real criada no serviço e injeção de mock (`get`/`set`) para evitar “open handles”.
  - PrismaService: mock de `address.findUnique`/`address.create`.
  - ViaCEP: `jest.mock('axios')` e `mockResolvedValue` para simular o retorno externo.
- Arquivos relevantes:
  - Service: `src/address/address.service.spec.ts`
  - Controller: `src/address/address.controller.spec.ts`
  - Processor: `src/queue/address.processor/address.processor.spec.ts`
  - App: `src/app.controller.spec.ts`

---

### 🔹 2️⃣ Prisma Studio (muito recomendado)

Para visualizar os dados no banco:

```bash
$ npx prisma studio
```
