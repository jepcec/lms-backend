# API Endpoints — Escuela Global LMS

> **Base URL:** `{NEXT_PUBLIC_API_URL}/api`  
> **Autenticación:** JWT Bearer token en header `Authorization: Bearer <token>`  
> **Todos los IDs son UUID.**

---

## Convenciones

| Símbolo | Significado |
|---------|-------------|
| 🔓 | Público — sin autenticación |
| 🔐 | Requiere JWT válido |
| 👤 | Solo el propio usuario (estudiante) |
| 🛡️ | Soporte o Admin |
| 📣 | Marketing o Admin |
| 👑 | Solo Admin |

---

## 1. AUTH

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login` | 🔓 | Iniciar sesión |
| POST | `/auth/register` | 🔓 | Registrar nuevo usuario |
| POST | `/auth/forgot-password` | 🔓 | Solicitar recuperación de contraseña |
| POST | `/auth/reset-password` | 🔓 | Restablecer contraseña con token |
| GET | `/auth/verify-email` | 🔓 | Verificar email con token |
| POST | `/auth/logout` | 🔐 | Cerrar sesión |

### POST `/auth/login`
**Body:**
```json
{
  "email": "string",
  "password": "string"
}
```
**Response `200`:**
```json
{
  "access_token": "string (JWT)",
  "user": {
    "id": "uuid",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "role": "estudiante | soporte | marketing | admin",
    "status": "active | suspended | deleted",
    "phone": "string",
    "country": "string",
    "email_verified": true,
    "profile_photo_url": "string | null",
    "created_at": "ISO8601",
    "updated_at": "ISO8601"
  }
}
```
**Errores:** `401` credenciales incorrectas · `423` cuenta bloqueada (5 intentos, 15 min)

---

### POST `/auth/register`
**Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "password": "string",
  "phone": "string",
  "country": "string (opcional)"
}
```
**Response `201`:** `{ "message": "string" }`  
**Errores:** `409` email ya registrado

---

### POST `/auth/forgot-password`
**Body:** `{ "email": "string" }`  
**Response `200`:** `{ "message": "string" }` _(siempre 200, no revela si el email existe)_

---

### POST `/auth/reset-password`
**Body:** `{ "token": "string", "password": "string" }`  
**Response `200`:** `{ "message": "string" }`  
**Errores:** `400` token inválido o expirado

---

### GET `/auth/verify-email?token=<token>`
**Response `200`:** `{ "message": "string" }`  
**Errores:** `400` token inválido

---

### POST `/auth/logout`
**Response `200`:** `{ "message": "string" }`

---

## 2. CURSOS

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/courses` | 🔓 | Listado con filtros (panel admin) |
| GET | `/courses/catalog` | 🔓 | Catálogo público paginado |
| GET | `/courses/featured` | 🔓 | Cursos destacados |
| GET | `/courses/softwares` | 🔓 | Lista de herramientas disponibles |
| GET | `/courses/:id` | 🔓 | Detalle por ID |
| GET | `/courses/slug/:slug` | 🔓 | Detalle por slug |
| POST | `/courses` | 🛡️ | Crear curso |
| PATCH | `/courses/:id` | 🛡️ | Actualizar curso |
| DELETE | `/courses/:id` | 🛡️ | Eliminar curso (soft delete) |
| POST | `/courses/:id/thumbnail` | 🛡️ | Subir imagen miniatura |
| POST | `/courses/:id/instructors` | 🛡️ | Agregar instructor |
| DELETE | `/courses/:id/instructors/:instructorId` | 🛡️ | Eliminar instructor |
| GET | `/courses/:id/matriculados` | 🛡️ | Estudiantes matriculados en el curso |

### GET `/courses` — Query params

| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | Página (default 1) |
| `limit` | number | Resultados por página (default 12) |
| `search` | string | Buscar en título y tagline |
| `status` | `draft\|published\|archived` | Filtrar por estado |
| `categoria_ids` | string | IDs separados por coma |
| `sort` | `popular\|best_rated\|price_asc\|price_desc` | Ordenamiento |
| `min_rating` | number | Rating mínimo |
| `min_price` | number | Precio mínimo |
| `max_price` | number | Precio máximo |
| `softwares` | string | Herramientas separadas por coma |

**Response `200`:** `PaginatedResponse<Course>`

---

### GET `/courses/catalog` — Query params
Igual que `/courses` pero solo devuelve `published`. Orientado al catálogo público.

---

### GET `/courses/featured?limit=<n>`
**Response `200`:** `{ "data": Course[] }`

---

### GET `/courses/softwares`
**Response `200`:** `string[]`

---

### GET `/courses/:id` y GET `/courses/slug/:slug`
**Response `200`:** `Course`

```json
{
  "id": "uuid",
  "category_id": "uuid",
  "category": { "id": "uuid", "name": "string", "slug": "string", "icon": "string", "color": "string" },
  "title": "string",
  "slug": "string",
  "tagline": "string",
  "description": "string",
  "thumbnail_url": "string",
  "level": "principiante | intermedio | avanzado",
  "software_tools": ["string"],
  "price": 299.00,
  "discount_price": 199.00,
  "currency": "USD | PEN",
  "access_duration": "1_year | lifetime",
  "prerequisites": ["string"],
  "outcomes": ["string"],
  "status": "draft | published | archived",
  "published_at": "ISO8601 | null",
  "avg_rating": 4.7,
  "review_count": 18,
  "enrolled_count": 42,
  "total_duration_minutes": 720,
  "instructors": [
    {
      "id": "uuid",
      "course_id": "uuid",
      "first_name": "string",
      "last_name": "string",
      "title": "string",
      "description": "string",
      "photo_url": "string",
      "display_order": 1
    }
  ],
  "created_by": "uuid",
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

---

### POST `/courses`
**Body (`CreateCursoDto`):**
```json
{
  "title": "string",
  "slug": "string (opcional, auto-generado si se omite)",
  "tagline": "string",
  "description": "string",
  "category_id": "uuid",
  "level": "principiante | intermedio | avanzado",
  "price": 299.00,
  "discount_price": 199.00,
  "currency": "USD | PEN",
  "access_duration": "1_year | lifetime",
  "status": "draft | published | archived",
  "thumbnail_url": "string (opcional)",
  "software_tools": ["string"],
  "instructors": [
    {
      "first_name": "string",
      "last_name": "string",
      "title": "string",
      "description": "string (opcional)",
      "photo_url": "string (opcional)",
      "display_order": 1
    }
  ],
  "prerequisites": ["string"],
  "outcomes": ["string"]
}
```
**Response `201`:**
```json
{
  "success": true,
  "course": { "id": "uuid", "title": "string", "slug": "string", "status": "string", "created_at": "ISO8601" }
}
```

---

### POST `/courses/:id/thumbnail`
**Content-Type:** `multipart/form-data`  
**Campo:** `thumbnail` (archivo de imagen)  
**Response `200`:** `{ "success": true, "thumbnail_url": "string" }`

> ⚠️ El frontend **no sube archivos a S3 directamente**. El backend debe manejar el upload y devolver la URL pública.

---

### POST `/courses/:id/instructors`
**Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "title": "string",
  "description": "string (opcional)",
  "photo_url": "string (opcional)",
  "display_order": 1
}
```
**Response `201`:** `Instructor`

---

### GET `/courses/:id/matriculados`
**Query:** `page`, `limit`, `search`  
**Response `200`:** `PaginatedResponse<Enrollment>`

---

## 3. MÓDULOS

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/courses/:courseId/modules` | 🛡️ | Listar módulos del curso |
| POST | `/courses/:courseId/modules` | 🛡️ | Crear módulo |
| PATCH | `/modules/:moduleId` | 🛡️ | Actualizar módulo |
| DELETE | `/modules/:moduleId` | 🛡️ | Eliminar módulo |

### GET `/courses/:courseId/modules`
**Response `200`:**
```json
[
  {
    "id": "uuid",
    "course_id": "uuid",
    "title": "string",
    "description": "string",
    "display_order": 1,
    "sessions_count": 3,
    "total_duration": 125,
    "created_at": "ISO8601"
  }
]
```

### POST `/courses/:courseId/modules` y PATCH `/modules/:moduleId`
**Body:**
```json
{ "title": "string", "description": "string (opcional)" }
```
**Response:** `{ "success": true, "module": Module }`

---

## 4. SESIONES

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/modules/:moduleId/sessions` | 🛡️ | Listar sesiones del módulo |
| POST | `/modules/:moduleId/sessions` | 🛡️ | Crear sesión |
| PATCH | `/sessions/:sessionId` | 🛡️ | Actualizar sesión |
| DELETE | `/sessions/:sessionId` | 🛡️ | Eliminar sesión |

### GET `/modules/:moduleId/sessions`
**Response `200`:**
```json
[
  {
    "id": "uuid",
    "module_id": "uuid",
    "title": "string",
    "description": "string",
    "youtube_url": "string",
    "youtube_video_id": "string",
    "duration_minutes": 45,
    "display_order": 1,
    "materials_count": 2,
    "created_at": "ISO8601"
  }
]
```

### POST/PATCH Sesión — Body:
```json
{
  "title": "string",
  "description": "string (opcional)",
  "youtube_url": "string (URL completa de YouTube)",
  "duration_minutes": 45
}
```
**Response:** `{ "success": true, "session": Session }`

> El backend debe extraer `youtube_video_id` del `youtube_url` automáticamente.

---

## 5. MATERIALES

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/sessions/:sessionId/materials` | 🛡️ | Listar materiales de la sesión |
| POST | `/sessions/:sessionId/materials` | 🛡️ | Agregar material |
| DELETE | `/materials/:materialId` | 🛡️ | Eliminar material |

### POST `/sessions/:sessionId/materials`
**Body:**
```json
{
  "name": "string",
  "drive_url": "string (URL de Google Drive)",
  "type": "PDF | Excel | Word | Otro"
}
```
**Response `201`:** `{ "success": true, "material": Material }`

> Los materiales son **links de Google Drive** — el frontend no sube archivos, solo guarda la URL.

---

## 6. CATEGORÍAS

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/categories` | 🔓 | Listar todas las categorías |
| GET | `/categories/:id` | 🔓 | Detalle de categoría |
| POST | `/categories` | 🛡️ | Crear categoría |
| PATCH | `/categories/:id` | 🛡️ | Actualizar categoría |
| DELETE | `/categories/:id` | 🛡️ | Eliminar categoría |
| PATCH | `/categories/reorder` | 🛡️ | Reordenar categorías |

### GET `/categories`
**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "slug": "string",
    "icon": "string (emoji)",
    "color": "string (hex)",
    "description": "string",
    "display_order": 1,
    "created_at": "ISO8601"
  }
]
```

### POST/PATCH Categoría — Body:
```json
{
  "name": "string",
  "slug": "string",
  "icon": "string (emoji)",
  "color": "string (hex)",
  "description": "string (opcional)",
  "display_order": 1
}
```

### PATCH `/categories/reorder`
**Body:** `{ "ids": ["uuid", "uuid", "uuid"] }` _(orden nuevo)_  
**Response:** `{ "message": "string", "ids": ["uuid"] }`

---

## 7. CARRITO

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/cart` | 🔓/🔐 | Ver carrito |
| POST | `/cart` | 🔓/🔐 | Agregar curso al carrito |
| DELETE | `/cart/:itemId` | 🔐 | Quitar item del carrito |
| DELETE | `/cart` | 🔐 | Vaciar carrito |
| POST | `/cart/merge` | 🔐 | Fusionar carrito de invitado al iniciar sesión |

### GET `/cart?session_token=<token>`
- Autenticado → usa JWT para identificar al usuario
- Invitado → usa `session_token` (query param)

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "course": {
        "id": "uuid",
        "title": "string",
        "slug": "string",
        "thumbnail_url": "string",
        "price": 299.00,
        "discount_price": 199.00,
        "currency": "USD"
      }
    }
  ],
  "subtotal": 199.00,
  "item_count": 1
}
```

### POST `/cart`
**Body:**
```json
{
  "course_id": "uuid",
  "session_token": "string (solo invitados, opcional)"
}
```
**Response `200`:** `{ "success": true, "cart_item": { "id": "uuid", "course_id": "uuid" }, "item_count": 1 }`  
**Errores:** `404` curso no existe · `409` curso ya en carrito

### POST `/cart/merge`
Se llama al hacer login para fusionar el carrito del invitado con el del usuario autenticado.  
**Body:** `{ "session_token": "string" }`  
**Response:** `{ "success": true, "item_count": 2 }`

---

## 8. MATRÍCULAS (Admin/Soporte)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/enrollments` | 🛡️ | Listar matriculaciones |
| POST | `/enrollments` | 🛡️ | Matriculación manual |
| GET | `/users/buscar` | 🛡️ | Buscar usuario para matricular |

### GET `/enrollments` — Query params
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `search` | string | Busca por nombre o email |
| `curso_id` | uuid | Filtrar por curso |

**Response `200`:** `PaginatedResponse<Enrollment>`

### POST `/enrollments` — Matriculación manual
**Body:**
```json
{
  "user_id": "uuid",
  "course_ids": ["uuid", "uuid"],
  "offline_payment_method": "transferencia | efectivo | cortesia | otro",
  "offline_amount": 299.00,
  "internal_notes": "string (opcional)"
}
```
**Response `201`:** `Enrollment[]`

### GET `/users/buscar?q=<texto>&role=estudiante`
Usado para el buscador de estudiantes en el panel de matrículas.  
**Response `200`:** `{ "id": "uuid", "first_name": "string", "last_name": "string", "email": "string" }[]`

---

## 9. ESTUDIANTE (rutas propias del alumno)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/student/enrollments` | 👤 | Mis cursos matriculados |
| GET | `/student/courses/:courseId/content` | 👤 | Contenido del curso (módulos + sesiones) |
| GET | `/student/progress/courses/:courseId` | 👤 | Mi progreso en un curso |
| PUT | `/student/progress/sessions/:sessionId` | 👤 | Actualizar progreso de sesión |
| GET | `/student/certificates` | 👤 | Mis certificados |
| GET | `/student/certificates/:enrollmentId` | 👤 | Detalle de certificado |

### GET `/student/enrollments`
**Response `200`:** `Enrollment[]` (incluye `course` embebido con datos básicos)

---

### GET `/student/courses/:courseId/content`
**Response `200`:**
```json
{
  "id": "uuid",
  "title": "string",
  "modules": [
    {
      "id": "uuid",
      "title": "string",
      "display_order": 1,
      "sessions": [
        {
          "id": "uuid",
          "module_id": "uuid",
          "title": "string",
          "description": "string",
          "youtube_video_id": "string",
          "duration_minutes": 45,
          "display_order": 1,
          "materials": [
            { "id": "uuid", "name": "string", "drive_url": "string", "type": "PDF" }
          ]
        }
      ]
    }
  ]
}
```

---

### GET `/student/progress/courses/:courseId`
**Response `200`:**
```json
{
  "enrollment": {
    "id": "uuid",
    "progress_percent": 65,
    "completed_at": "ISO8601 | null"
  },
  "lesson_progress": [
    {
      "id": "uuid",
      "enrollment_id": "uuid",
      "session_id": "uuid",
      "watched_seconds": 2700,
      "completed": true,
      "completed_at": "ISO8601 | null",
      "last_watched_at": "ISO8601"
    }
  ],
  "has_review": false
}
```

---

### PUT `/student/progress/sessions/:sessionId`
Se llama cada 30 segundos mientras el estudiante ve un video.

**Body:**
```json
{ "watched_seconds": 2700 }
```
**Response `200`:**
```json
{ "completed": true, "progress_percent": 80 }
```

> **Regla de negocio:** `completed = true` cuando `watched_seconds >= duration_minutes * 60 * 0.9` (90% del video)

---

### GET `/student/certificates`
**Response `200`:** `{ "data": CertificateSummary[] }`

```json
{
  "data": [
    {
      "id": "uuid",
      "enrollment_id": "uuid",
      "course_title": "string",
      "verification_code": "string",
      "pdf_url": "string (S3)",
      "issued_at": "ISO8601"
    }
  ]
}
```

### GET `/student/certificates/:enrollmentId`
**Response `200`:**
```json
{
  "id": "uuid",
  "verification_code": "string",
  "pdf_url": "string (S3)",
  "course_title": "string",
  "student_name": "string",
  "issued_at": "ISO8601",
  "total_hours": 12,
  "instructors": ["string"]
}
```

---

## 10. RESEÑAS

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/reviews` | 👤 | Enviar reseña del curso |

### POST `/reviews`
> ⚠️ **Regla crítica:** El estudiante DEBE enviar una reseña antes de poder descargar el certificado. El backend debe validar esto.

**Body:**
```json
{
  "enrollment_id": "uuid",
  "course_id": "uuid",
  "rating": 5,
  "comment": "string (50–500 caracteres)"
}
```
**Response `201`:**
```json
{
  "id": "uuid",
  "enrollment_id": "uuid",
  "rating": 5,
  "comment": "string",
  "status": "approved",
  "created_at": "ISO8601",
  "certificate_available": true
}
```

---

## 11. PERFIL DE USUARIO

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/usuarios/me` | 🔐 | Obtener perfil propio |
| PATCH | `/usuarios/me` | 🔐 | Actualizar datos del perfil |
| PATCH | `/usuarios/me/password` | 🔐 | Cambiar contraseña |

### GET `/usuarios/me`
**Response `200`:** `User`

### PATCH `/usuarios/me`
**Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "phone": "string (opcional)",
  "country": "string (opcional)"
}
```
**Response `200`:** `User` actualizado

### PATCH `/usuarios/me/password`
**Body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```
**Response `200`:** `{ "message": "string" }`  
**Errores:** `400` contraseña actual incorrecta

---

## 12. GESTIÓN DE USUARIOS (Admin)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/admin/usuarios` | 👑 | Listar todos los usuarios |
| GET | `/users/:id` | 👑 | Detalle de usuario |
| POST | `/users` | 👑 | Crear usuario |
| PATCH | `/users/:id` | 👑 | Actualizar usuario |
| PATCH | `/users/:id/suspender` | 👑 | Suspender usuario |
| PATCH | `/users/:id/activar` | 👑 | Activar usuario |
| DELETE | `/users/:id` | 👑 | Eliminar usuario (soft delete) |

### GET `/admin/usuarios` — Query params
| Param | Tipo | Descripción |
|-------|------|-------------|
| `page` | number | |
| `limit` | number | |
| `search` | string | Nombre o email |
| `role` | `estudiante\|soporte\|marketing\|admin` | |
| `status` | `active\|suspended` | |

**Response `200`:** `PaginatedResponse<User>`

### POST `/users`
**Body:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "phone": "string",
  "country": "string (opcional)",
  "role": "estudiante | soporte | marketing | admin",
  "password": "string"
}
```
**Response `201`:** `User`

---

## 13. DASHBOARD ADMIN

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/admin/stats` | 👑 | KPIs principales |
| GET | `/admin/charts/ingresos` | 👑 | Gráfico de ingresos mensual |
| GET | `/admin/charts/top-cursos` | 👑 | Top cursos por ingresos |
| GET | `/admin/charts/categorias` | 👑 | Distribución por categorías |
| GET | `/admin/charts/estudiantes` | 👑 | Estudiantes activos/inactivos |
| GET | `/admin/top-finalizacion` | 👑 | Cursos con mayor tasa de finalización |
| GET | `/admin/top-estudiantes` | 👑 | Estudiantes más activos |
| GET | `/admin/cursos/:cursoId/matriculados` | 👑 | Matriculados en un curso con stats |
| GET | `/admin/estudiantes/:userId/cursos/:courseId/actividad` | 👑 | Actividad detallada de un estudiante en un curso |
| GET | `/admin/auditoria` | 👑 | Log de auditoría |

### Filtros comunes (query params de `/admin/*`)
| Param | Tipo | Descripción |
|-------|------|-------------|
| `desde` | ISO8601 date | Inicio del rango |
| `hasta` | ISO8601 date | Fin del rango |
| `categoria_id` | uuid | Filtrar por categoría |

### GET `/admin/stats`
**Response `200`:**
```json
{
  "ingresos": {
    "total_mes": 18450.00,
    "total_mes_anterior": 16400.00,
    "cambio_porcentual": 12.5,
    "online": 14200.00,
    "manual": 4250.00
  },
  "estudiantes": { "total": 342, "nuevos_mes": 28 },
  "cursos": { "total_activos": 12, "nuevos_mes": 2 },
  "tasa_finalizacion": 68
}
```

### GET `/admin/charts/ingresos`
**Response `200`:**
```json
[{ "mes": "Ene", "total": 12000, "online": 9500, "manual": 2500 }]
```

### GET `/admin/charts/top-cursos`
**Response `200`:**
```json
[{ "id": "uuid", "title": "string", "enrolled_count": 95, "revenue": 18905 }]
```

### GET `/admin/charts/categorias`
**Response `200`:**
```json
[{ "name": "string", "count": 5 }]
```

### GET `/admin/charts/estudiantes`
**Response `200`:**
```json
[{ "mes": "Ene", "activos": 180, "inactivos": 40 }]
```

### GET `/admin/top-finalizacion`
**Response `200`:**
```json
[{ "id": "uuid", "title": "string", "enrolled_count": 95, "completion_rate": 82 }]
```

### GET `/admin/top-estudiantes`
**Response `200`:**
```json
[
  {
    "id": "uuid",
    "first_name": "string",
    "last_name": "string",
    "email": "string",
    "courses_count": 3,
    "completed_count": 1,
    "total_watched_hours": 47.2
  }
]
```

### GET `/admin/cursos/:cursoId/matriculados`
**Query:** `page`, `limit`, `search`, `status` (`activo|completado|inactivo`), `enrollment_type` (`online|manual`)

**Response `200`:**
```json
{
  "data": [
    {
      "enrollment_id": "uuid",
      "user": { "id": "uuid", "first_name": "string", "last_name": "string", "email": "string" },
      "enrolled_at": "ISO8601",
      "progress_percent": 65,
      "last_accessed_at": "ISO8601",
      "status": "activo | completado | inactivo",
      "enrollment_type": "online | manual",
      "offline_payment_method": "string | null"
    }
  ],
  "total": 42,
  "total_pages": 5,
  "stats": {
    "total": 42,
    "avg_progress": 58.3,
    "activos_7_dias": 18,
    "tasa_finalizacion": 24
  }
}
```

### GET `/admin/estudiantes/:userId/cursos/:courseId/actividad`
**Response `200`:**
```json
{
  "enrollment": {
    "enrolled_at": "ISO8601",
    "progress_percent": 65,
    "last_accessed_at": "ISO8601",
    "completed_at": "ISO8601 | null",
    "total_watched_seconds": 5800
  },
  "user": { "id": "uuid", "first_name": "string", "last_name": "string", "email": "string" },
  "course": { "id": "uuid", "title": "string" },
  "sessions": [
    {
      "module_title": "string",
      "session_title": "string",
      "duration_minutes": 45,
      "watched_seconds": 2700,
      "percent_watched": 100,
      "completed": true,
      "last_watched_at": "ISO8601"
    }
  ],
  "activity_by_day": [
    { "date": "YYYY-MM-DD", "hours": 0.75 }
  ]
}
```

### GET `/admin/auditoria`
**Query:** `page`, `limit`

**Response `200`:**
```json
{
  "data": [
    {
      "id": "uuid",
      "created_at": "ISO8601",
      "user": { "first_name": "string", "last_name": "string", "email": "string" },
      "action": "create | update | delete",
      "entity_type": "Course | Category | User | Enrollment",
      "entity_id": "uuid",
      "changes": {
        "field_name": { "before": "valor anterior", "after": "valor nuevo" }
      }
    }
  ],
  "total": 150
}
```

---

## 14. MARKETING

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/promociones` | 📣 | Listar promociones/banners |
| POST | `/promociones` | 📣 | Crear promoción |
| PATCH | `/promociones/:id` | 📣 | Actualizar promoción |
| DELETE | `/promociones/:id` | 📣 | Eliminar promoción |
| GET | `/sliders` | 🔓 | Listar sliders del hero |
| POST | `/sliders` | 📣 | Crear slider |
| PATCH | `/sliders/:id` | 📣 | Actualizar slider |
| DELETE | `/sliders/:id` | 📣 | Eliminar slider |

### Modelo `Promotion`
```json
{
  "id": "uuid",
  "title": "string",
  "image_url": "string",
  "destination_url": "string | null",
  "destination_course_id": "uuid | null",
  "display_order": 1,
  "status": "active | inactive",
  "starts_at": "ISO8601 | null",
  "ends_at": "ISO8601 | null",
  "created_at": "ISO8601"
}
```

### POST/PATCH `/promociones` — Body:
```json
{
  "title": "string",
  "image_url": "string",
  "destination_url": "string (opcional)",
  "destination_course_id": "uuid (opcional)",
  "display_order": 1,
  "status": "active | inactive",
  "starts_at": "ISO8601 (opcional)",
  "ends_at": "ISO8601 (opcional)"
}
```

---

### GET `/sliders`
El hero principal del sitio consume este endpoint (público).  
**Response `200`:** `Slider[]`

### Modelo `Slider`
```json
{
  "id": "uuid",
  "title": "string",
  "subtitle": "string | null",
  "type": "banner",
  "image_url": "string | null",
  "destination_url": "string | null",
  "contact_url": "string | null (URL de WhatsApp del asesor comercial)",
  "position_on_page": "top | middle | bottom",
  "display_order": 1,
  "status": "active | inactive",
  "courses": [],
  "created_at": "ISO8601"
}
```

### POST/PATCH `/sliders` — Body:
```json
{
  "title": "string",
  "subtitle": "string (opcional)",
  "type": "banner",
  "image_url": "string (opcional, URL de imagen de fondo)",
  "destination_url": "string (opcional, URL de la página del curso)",
  "contact_url": "string (opcional, URL de WhatsApp del asesor comercial)",
  "position_on_page": "top | middle | bottom",
  "display_order": 1,
  "status": "active | inactive"
}
```

> **Nota sobre `image_url`:** El frontend espera que el backend devuelva la URL final de la imagen ya almacenada. El panel de marketing tiene un campo para ingresar la URL de la imagen. Si se implementa upload directo de imágenes para sliders, el endpoint adicional sería `POST /sliders/:id/image` con `multipart/form-data`.

---

## Tipos comunes

### `PaginatedResponse<T>`
```json
{
  "data": [],
  "total": 100,
  "page": 1,
  "limit": 12,
  "total_pages": 9
}
```

### Respuesta de error estándar
```json
{
  "message": "string",
  "statusCode": 400,
  "errors": {
    "field": ["mensaje de validación"]
  }
}
```

---

## Reglas de negocio críticas

| Regla | Endpoint afectado |
|-------|------------------|
| El certificado solo se puede descargar si el estudiante envió una reseña (`has_review: true`) | `POST /reviews` → habilita `GET /student/certificates/:enrollmentId` |
| El progreso de sesión se actualiza cada 30 segundos mientras se ve el video | `PUT /student/progress/sessions/:sessionId` |
| Auto-completar sesión al ver el 90% (`watched_seconds >= duration_minutes * 60 * 0.9`) | `PUT /student/progress/sessions/:sessionId` |
| Login bloqueado 15 min tras 5 intentos fallidos | `POST /auth/login` |
| "Recordarme" activo → token 30 días; inactivo → 24 horas | `POST /auth/login` |
| El carrito de invitado se fusiona al iniciar sesión | `POST /cart/merge` |
| Soft delete en cursos y usuarios (`deleted_at`) — estudiantes mantienen acceso a cursos eliminados | `DELETE /courses/:id`, `DELETE /users/:id` |
| El `AuditLog` registra before/after de cambios en cursos | `PATCH /courses/:id` |
