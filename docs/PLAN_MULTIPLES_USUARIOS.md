# Plan de implementación: soporte de múltiples usuarios concurrentes

## 1. Objetivo y alcance

Mejorar la capacidad del backend para atender **múltiples usuarios concurrentes en una sola instancia**, sin degradar tiempos de respuesta ni agotar recursos (pool de conexiones, event loop) bajo carga.

**Fuera de alcance de este plan** (temas relacionados pero distintos, a evaluar más adelante si el cuello de botella deja de ser "carga en una instancia"):
- Multi-tenancy (aislamiento de datos por institución/organización).
- Clustering multi-instancia / balanceador de carga (requeriría además migrar el storage local de archivos a Cloudinary/S3 de forma obligatoria).

## 2. Diagnóstico actual

| Área | Estado actual | Gap |
|---|---|---|
| Conexión a DB | Prisma + `@prisma/adapter-pg`, pool `max` configurable vía `DATABASE_POOL_MAX` (default 10), singleton `@Global()` en `src/core/database/prisma.service.ts` | Sin tunear contra `max_connections` real de Postgres ni contra queries lentas |
| Auth | JWT stateless (`@nestjs/jwt`) + cookies httpOnly, sin sesiones en servidor | Ninguno (ya es favorable para concurrencia) |
| Rate limiting | `@nestjs/throttler` global (100 req/60s), storage en memoria (`src/modules/auth/auth.module.ts`) | No distribuido, se resetea en cada reinicio del proceso |
| Caché | No existe | Cada lectura repetida golpea Postgres |
| Trabajos en background | No hay colas; async se resuelve con `@nestjs/event-emitter` (in-process, no persistente) en notificaciones, pagos, órdenes y matrículas | Trabajo pesado (notificaciones, webhooks de pago) bloquea el ciclo del request |
| Pasarelas de pago | Integraciones con MercadoPago, Culqi, PayPal, Stripe en `payments`/`payments-v2` | Sin timeouts explícitos confirmados: una pasarela lenta puede degradar a todos los usuarios |
| Despliegue | Un contenedor Docker (`docker-compose.yaml`) vía Coolify | N/A para este plan (alcance de una sola instancia) |
| Storage de archivos | Disco local (fallback) + Cloudinary vía `STORAGE_DRIVER` | N/A para este plan |

## 3. Fases de implementación

### Fase 0 — Provisionar Redis en la VPS

**Qué se hace:** agregar un servicio `redis` propio al `docker-compose.yaml` (mismo patrón que `postgres`), no un add-on gestionado de Coolify.

- Imagen y versión fijadas explícitamente (ej. `redis:7-alpine`), sin `latest`.
- Volumen para persistencia con AOF habilitado (`appendonly yes`), para no perder datos de colas/caché ante reinicios del contenedor.
- Password configurado (`--requirepass`), expuesto solo en la red interna `lms-net` — igual que hoy Postgres/backend no son alcanzables desde fuera del stack.
- Nuevas variables en `.env` / `.env.sample`: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (o un único `REDIS_URL`).

**Archivos afectados:** `docker-compose.yaml`, `.env.sample`.

**Prerrequisito de:** Fase 2, Fase 3, Fase 5.

**Criterio de aceptación:** `docker compose up` levanta `redis` sano, el backend puede conectarse desde dentro de `lms-net`, y un reinicio del contenedor no pierde las claves con AOF activo.

---

### Fase 1 — Pool de conexiones e índices de base de datos

**Qué se hace:**
1. Calcular el `DATABASE_POOL_MAX` adecuado en función del `max_connections` de la instancia de Postgres y de que solo hay una instancia del backend (evitar sobre-aprovisionar).
2. Identificar las queries más frecuentes (listado de cursos, matrículas, órdenes) y correr `EXPLAIN ANALYZE` sobre ellas.
3. Agregar índices faltantes (`@@index` en `prisma/schema.prisma`) para las columnas usadas en `WHERE`/`ORDER BY`/joins de esas queries, y generar la migración correspondiente.

**Archivos afectados:** `.env` / `.env.sample` (`DATABASE_POOL_MAX`), `prisma/schema.prisma`, nueva migración en `prisma/migrations/`.

**Criterio de aceptación:** las queries auditadas usan índice (no seq scan) en `EXPLAIN ANALYZE`; no hay errores de "too many connections" bajo la prueba de carga de la Fase 7.

---

### Fase 2 — Rate limiting distribuido

**Qué se hace:** reemplazar el storage en memoria de `@nestjs/throttler` por Redis, usando `nestjs-throttler-storage-redis` con su **propia conexión** a Redis (independiente de caché y colas, según se definió).

**Archivos afectados:** `src/modules/auth/auth.module.ts` (configuración de `ThrottlerModule.forRoot`), `package.json`.

**Criterio de aceptación:** los contadores de rate limit sobreviven a un reinicio del proceso backend (se verifica consultando Redis directamente).

---

### Fase 3 — Caché de lecturas calientes

**Qué se hace:** agregar `@nestjs/cache-manager` + `cache-manager-redis-store` (conexión propia a Redis) y cachear los endpoints de lectura de alta frecuencia y baja mutación:
- Catálogo/listado de cursos.
- Contenido de marketing.

Con TTL corto (a definir, ej. 60–300s) e invalidación explícita al crear/editar/eliminar el recurso cacheado (no depender solo del TTL).

**Archivos afectados:** módulo `cources` y `marketing` (interceptor/decorador de caché en los controllers de lectura), nuevo `CacheModule` de configuración, `package.json`.

**Criterio de aceptación:** en la prueba de carga de la Fase 7, las peticiones repetidas al catálogo bajan su tiempo de respuesta y la carga a Postgres se reduce medible.

---

### Fase 4 — Timeouts en pasarelas de pago

**Qué se hace:** agregar timeout explícito a las llamadas HTTP salientes hacia MercadoPago, Culqi, PayPal y Stripe en `payments` y `payments-v2`, de modo que una pasarela lenta no mantenga ocupados recursos indefinidamente.

**Archivos afectados:** clientes HTTP dentro de `src/modules/payments/` y `src/modules/payments-v2/`.

**Criterio de aceptación:** una llamada simulada a una pasarela que no responde falla con timeout controlado (no cuelga el request) y no bloquea otras peticiones concurrentes.

---

### Fase 5 — Colas en background (BullMQ)

**Qué se hace:** instalar `@nestjs/bullmq` (conexión propia a Redis) y mover a jobs en cola, con reintentos configurados:
- Envío de notificaciones (hoy vía `@nestjs/event-emitter` síncrono).
- Procesamiento de webhooks de pago.

**Archivos afectados:** módulo `notifications`, módulos `payments`/`payments-v2`/`orders` donde se disparan estos eventos, `package.json`.

**Criterio de aceptación:** una notificación o webhook se procesa de forma asíncrona (el endpoint que lo dispara responde sin esperar el trabajo completo) y se reintenta automáticamente ante un fallo simulado.

---

### Fase 6 — Auditoría de código bloqueante

**Qué se hace:** revisar `payments`, `payments-v2` y `storage` en busca de operaciones síncronas pesadas (crypto síncrono, procesamiento de archivos, loops grandes) que bloqueen el event loop de Node y afecten a todos los usuarios concurrentes, no solo al request que las originó. Convertir a sus equivalentes async donde aplique.

**Archivos afectados:** a determinar durante la auditoría (principalmente `src/modules/payments*/` y `src/modules/storage/`).

**Criterio de aceptación:** no quedan llamadas síncronas bloqueantes conocidas en rutas calientes; se documenta cada hallazgo y su corrección.

---

### Fase 7 — Pruebas de carga

**Qué se hace:** crear scripts de carga (k6 o autocannon) contra los flujos críticos concurrentes:
- Login.
- Listado de cursos.
- Checkout.

Ejecutar una medición **baseline** antes de aplicar cualquier fase, y repetir la medición después de cada fase relevante (especialmente 1, 3 y 5) para comparar objetivamente el efecto.

**Archivos afectados:** nuevo directorio de scripts de carga (ej. `load-tests/` o similar, fuera de `src/`).

**Criterio de aceptación:** se cuenta con métricas comparables (latencia p95/p99, tasa de error, throughput) antes/después de cada fase relevante.

---

### Fase 8 — Observabilidad

**Qué se hace:** exponer métricas de saturación del pool de Prisma, latencia de requests y tasa de error (Prometheus + Grafana, o una alternativa más ligera si no se justifica el stack completo).

**Archivos afectados:** nuevo módulo de métricas/middleware en `src/core/` o similar, configuración de infraestructura si aplica (ej. servicio adicional en `docker-compose.yaml`).

**Criterio de aceptación:** existe un endpoint/dashboard donde se puede observar en tiempo real la saturación del pool de conexiones y la latencia bajo carga, sin depender de correr pruebas de carga manuales para saberlo.

## 4. Orden recomendado de ejecución

```
Fase 0 (Redis)
   │
   ├──> Fase 1 (Pool + índices)      ─┐
   ├──> Fase 4 (Timeouts pagos)      ─┼─ no dependen de Redis, se pueden hacer primero
   ├──> Fase 6 (Auditoría bloqueante)─┘
   │
Fase 7 (Prueba de carga baseline)
   │
   ├──> Fase 2 (Rate limiting distribuido)
   ├──> Fase 3 (Caché)
   ├──> Fase 5 (Colas)
   │
Fase 7 (Prueba de carga de comparación)
   │
Fase 8 (Observabilidad)
```

Las fases 1, 4 y 6 no dependen de Redis y pueden ejecutarse primero para obtener valor sin agregar infraestructura nueva.

## 5. Checklist de aceptación

| Fase | Descripción | Hecho | Métrica que debe mejorar |
|---|---|---|---|
| 0 | Redis provisionado en la VPS | ☐ | — (habilitador) |
| 1 | Pool + índices de DB | ☐ | Menos errores de conexión, menor latencia en queries auditadas |
| 2 | Rate limiting distribuido | ☐ | Contadores persistentes entre reinicios |
| 3 | Caché de lecturas calientes | ☐ | Menor latencia p95/p99 en catálogo, menor carga a Postgres |
| 4 | Timeouts en pasarelas de pago | ☐ | Sin requests colgados ante pasarela lenta |
| 5 | Colas en background | ☐ | Menor latencia de respuesta en endpoints que disparan notificaciones/webhooks |
| 6 | Auditoría de código bloqueante | ☐ | Menor variabilidad de latencia bajo carga (menos bloqueos del event loop) |
| 7 | Pruebas de carga (baseline y comparación) | ☐ | Datos objetivos de antes/después |
| 8 | Observabilidad | ☐ | Visibilidad continua sin necesidad de pruebas manuales |

## 6. Decisiones de infraestructura y código

- **Redis se despliega como servicio propio en `docker-compose.yaml`**, con el mismo patrón que `postgres` hoy (imagen/versión fijas, volumen propio, solo accesible por la red interna `lms-net`). No se usa el add-on gestionado de Coolify, para mantener control de versión/configuración y consistencia con el setup actual del proyecto.
- **Cada caso de uso de Redis (caché, rate limiting, colas) usa su propia librería con su propia conexión** — `cache-manager-redis-store`, `nestjs-throttler-storage-redis`, `@nestjs/bullmq` — en lugar de compartir un único cliente `ioredis`. Se prioriza velocidad y simplicidad de integración sobre optimizar el número de conexiones abiertas a Redis.
