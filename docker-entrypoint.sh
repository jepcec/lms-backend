#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "FATAL: DATABASE_URL no definida" >&2
  exit 1
fi

# prisma.config.ts carga esta URL desde .env durante el arranque.
printf 'DATABASE_URL="%s"\n' "$DATABASE_URL" > .env

echo "Aplicando migraciones de Prisma..."
if ! npx prisma migrate deploy; then
  echo "FATAL: falló prisma migrate deploy; no se ejecutará el seed ni la aplicación." >&2
  echo "Inspecciona la migración fallida. Si confirmas que su DDL se revirtió por completo, ejecuta:" >&2
  echo "  npx prisma migrate resolve --rolled-back <nombre_de_migracion>" >&2
  echo "No la marques como aplicada a menos que hayas verificado el esquema de la base." >&2
  exit 1
fi

echo "Ejecutando seed del administrador..."
node prisma/seed.admin.js

echo "Iniciando NestJS..."
exec node dist/src/main.js
