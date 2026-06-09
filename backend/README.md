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

### 4. Local Data
After migrations have run, initialize shared local accounts and listings:
```bash
npm run seed:local
```

Accounts:
- `student.test@unistay.local` / `Test@123456`
- `host.test@unistay.local` / `Test@123456`
- `admin.test@unistay.local` / `Test@123456`

The initializer creates wards, universities, amenities, 500 load-test users, 1,000 seeded listings, comments, reports, favourites, accommodation requests, and image URLs so the local application starts with realistic content.

For local database benchmarking, run PostgreSQL from Docker and point Prisma to the local DB:
```powershell
docker compose up -d db redis
$env:DATABASE_URL="postgresql://postgres:1@localhost:3005/uni-stay-dn-db"
npx prisma migrate deploy
npm run seed:local
npm run db:load-test
```

## Architecture
- `src/core/`: Foundation files (Database config, Express middlewares, shared Utils).
- `src/modules/`: Domain logic where each feature (like Users or Products) has its own controller, service, repository, and routes.
