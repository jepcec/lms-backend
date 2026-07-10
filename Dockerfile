# =============================================================
# lms-backend — Dockerfile (multi-stage)
# Base: node:22-alpine
# =============================================================

# -------------------------------------------------------------
# Stage 1: deps
# Instala TODAS las dependencias (incluye devDependencies
# necesarias para compilar y para `prisma generate`).
# Genera el cliente Prisma en src/generated/prisma/.
# -------------------------------------------------------------
FROM node:22-alpine AS deps
RUN apk add --no-cache python3 make g++ openssl
WORKDIR /app

# package files primero (mejor cache de capas)
COPY package.json package-lock.json ./
# prisma schema es necesario para `prisma generate`
COPY prisma ./prisma/
# tsconfig es necesario para que `prisma generate` produzca imports
# consistentes con el target de TypeScript del proyecto.
COPY tsconfig.json tsconfig.build.json ./

RUN npm ci
RUN npx prisma generate

# -------------------------------------------------------------
# Stage 2: builder
# Compila TypeScript con `nest build` -> dist/.
# -------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++ openssl
WORKDIR /app

# 1) Copia primero el codigo fuente. .dockerignore excluye
#    node_modules y src/generated, asi que no interfiere.
COPY . .

# 2) Trae node_modules y el cliente Prisma desde deps AL FINAL,
#    para que esta sea la ultima escritura sobre esos paths y
#    los binarios (.bin/nest, etc.) queden intactos en entornos
#    de build remotos (Coolify).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/src/generated ./src/generated

RUN npm run build

# -------------------------------------------------------------
# Stage 3: production-deps
# Instala SOLO las dependencias de runtime y agrega la CLI de
# prisma + tsx (necesarias para `prisma migrate deploy` y
# `prisma db seed` desde dentro del contenedor, sin guardar
# cambios en package.json).
# -------------------------------------------------------------
FROM node:22-alpine AS production-deps
RUN apk add --no-cache openssl
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev
RUN npm install --no-save prisma tsx

# -------------------------------------------------------------
# Stage 4: runner
# Imagen final minima. Ejecuta como usuario no-root.
# -------------------------------------------------------------
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl wget
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Usuario no-root (UID 1001)
RUN addgroup -g 1001 -S nodejs \
  && adduser -S nestjs -u 1001

# Dependencias de produccion + CLIs de prisma/tsx
COPY --from=production-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# Codigo compilado
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Schema y migraciones de Prisma (necesarios para migrate deploy)
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Cliente Prisma generado (por si el `nest build` no lo compilo completo)
COPY --from=builder --chown=nestjs:nodejs /app/src/generated ./src/generated

# package.json (util para tooling interno)
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
# prisma.config.ts (necesario para `prisma migrate deploy` y `prisma db seed`)
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.* ./

# Crea el directorio de uploads (lo usa ServeStaticModule)
# Queda vacio si STORAGE_DRIVER=cloudinary
RUN mkdir -p /app/uploads \
  && chown -R nestjs:nodejs /app/uploads

USER nestjs

EXPOSE 4000

# Healthcheck: hace un GET al prefijo global /api. Acepta cualquier
# status code < 500 (200/401/etc) porque la app puede tener un guard
# global que devuelve 401 incluso para rutas inexistentes — lo que
# nos importa es que el server este vivo y respondiendo.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/src/main.js"]
