# =============================================================
# LMS Backend - NestJS Production Dockerfile
# =============================================================

# -----------------------------
# Stage 1: Dependencies
# -----------------------------
FROM node:22-alpine AS deps

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm ci


# -----------------------------
# Stage 2: Build
# -----------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules

COPY package*.json ./
COPY prisma ./prisma
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# Generar cliente Prisma
RUN npx prisma generate

# Compilar NestJS
RUN npm run build


# -----------------------------
# Stage 3: Production
# -----------------------------
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl wget

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./

# Instala solamente dependencias necesarias
RUN npm ci --omit=dev


# Copiar aplicación compilada
COPY --from=builder /app/dist ./dist

# Copiar Prisma
COPY --from=builder /app/prisma ./prisma


EXPOSE 4000


# Healthcheck para Coolify
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider \
  http://localhost:4000/api || exit 1


CMD ["node", "dist/main.js"]
