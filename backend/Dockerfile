# Stage 1: Base
FROM node:18-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Stage 2: Development
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Stage 3: Builder
FROM base AS builder
RUN npm install
COPY . .
RUN npm run build

# Stage 4: Production
FROM base AS production
ENV NODE_ENV=production
RUN npm install --only=production
COPY --from=builder /usr/src/app/dist ./dist
CMD ["npm", "start"]
