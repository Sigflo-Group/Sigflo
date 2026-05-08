# Backend Dockerfile - Development and Production
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci

# Development stage
FROM deps AS dev
COPY . .
EXPOSE 3999
CMD ["npm", "run", "dev"]

# Build stage
FROM deps AS builder
COPY . .
RUN npm run build

# Production stage
FROM base AS prod
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3999
CMD ["npm", "start"]
