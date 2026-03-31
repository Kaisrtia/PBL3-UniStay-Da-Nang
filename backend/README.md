# Base Backend API

A structured, modular backend API boilerplate built with Node.js, Express, TypeScript, and PostgreSQL.

## Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)

## Setup & Run

### 1. Environment Config
Copy the `.env.example` file to create your local `.env`.
```bash
cp .env.example .env
```

### 2. Local Development 
Install dependencies and run the server locally:
```bash
npm install
npm run dev
```

### 3. Docker Environment
To run the server and database in Docker:
```bash
docker-compose up --build
```

## Architecture
- `src/core/`: Foundation files (Database config, Express middlewares, shared Utils).
- `src/modules/`: Domain logic where each feature (like Users or Products) has its own controller, service, repository, and routes.
