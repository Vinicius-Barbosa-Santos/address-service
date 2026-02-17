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

---

## 🏗 Arquitetura

             ┌──────────────┐
             │    Client    │
             └──────┬───────┘
                    │
                    ▼
            GET /address/:cep
                    │
                    ▼
             ┌──────────────┐
             │    Redis     │
             └──────┬───────┘
                    │ (miss)
                    ▼
             ┌──────────────┐
             │   Database   │
             └──────┬───────┘
                    │ (miss)
                    ▼
             ┌──────────────┐
             │   ViaCEP     │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │   BullMQ     │
             │    Queue     │
             └──────┬───────┘
                    │
                    ▼
             ┌──────────────┐
             │    Worker    │
             └──────────────┘

---

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

## API Documentation

Acesse a documentação interativa da API:

http://localhost:3000/docs

---

## Queue Dashboard

Monitoramento da fila assíncrona com Bull Board:

http://localhost:3000/admin/queues

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

## Project setup

```bash
$ npm install

# development
$ npm run start

# watch mode
$ npm run start:dev
```

---

## Build containers

```bash
$ docker-compose build
```

## Start containers

```bash
$ docker-compose up
```

## Start in background

```bash
$ docker-compose up -d
```

## 🗄 Prisma Setup

````bash
# Generate Prisma Client
$ npx prisma generate

# Run migrations
$ npx prisma migrate dev


---

### 🔹 2️⃣ Prisma Studio (muito recomendado)

Para visualizar os dados no banco:

```bash
$ npx prisma studio
````

## 📈 Diferenciais Técnicos

- Arquitetura desacoplada
- Persistência não bloqueante
- Cache com TTL
- Separação de responsabilidades
- Monitoramento de filas com Bull Board
- Documentação automática
