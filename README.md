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

## 📈 Diferenciais Técnicos

- Arquitetura desacoplada
- Persistência não bloqueante
- Cache com TTL
- Separação de responsabilidades
- Monitoramento de filas com Bull Board
- Documentação automática
