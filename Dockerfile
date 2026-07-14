
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
COPY prisma ./prisma 

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

RUN npx prisma generate
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

# Instala dependencias de producción (Asegúrate de que 'prisma' esté en 'dependencies' y no en 'devDependencies')
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api || exit 1

# Todo en una sola instrucción CMD:
# 1. Valida DATABASE_URL
# 2. Ejecuta migraciones
# 3. Arranca Node usando exec para el Graceful Shutdown
CMD ["sh", "-c", "if [ -z \"$DATABASE_URL\" ]; then echo 'FATAL: DATABASE_URL no definida'; exit 1; fi && echo 'Aplicando migraciones...' && npx prisma migrate deploy && echo 'Iniciando NestJS...' && exec node dist/main.js"]

