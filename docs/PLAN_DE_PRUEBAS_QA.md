# Plan de Pruebas QA — Escuela Global LMS

> **Proyecto:** Escuela Global — Plataforma LMS de Alta Especialización  
> **Versión:** 1.0  
> **Fecha:** 2026-06-27  
> **Stack:** Next.js (Frontend) + NestJS (Backend) + PostgreSQL + Prisma  

---

## Índice

1. [Módulo de Autenticación](#1-módulo-de-autenticación)
2. [Módulo de Usuarios](#2-módulo-de-usuarios)
3. [Módulo de Cursos](#3-módulo-de-cursos)
4. [Módulo de Contenido (Módulos, Sesiones, Materiales)](#4-módulo-de-contenido)
5. [Módulo de Estudiante (Progreso y Reproductor)](#5-módulo-de-estudiante)
6. [Módulo de Reseñas](#6-módulo-de-reseñas)
7. [Módulo de Certificados](#7-módulo-de-certificados)
8. [Módulo de Matrículas](#8-módulo-de-matrículas)
9. [Módulo de Carrito de Compras](#9-módulo-de-carrito-de-compras)
10. [Módulo de Pagos](#10-módulo-de-pagos)
11. [Módulo de Marketing (Sliders, Promociones, Tipos de Evento)](#11-módulo-de-marketing)
12. [Módulo de Notificaciones](#12-módulo-de-notificaciones)
13. [Panel Administrativo (Dashboard y Auditoría)](#13-panel-administrativo)
14. [Plantillas de Certificados](#14-plantillas-de-certificados)
15. [Navegación, Layouts y Protección de Rutas](#15-navegación-layouts-y-protección-de-rutas)
16. [Pruebas de Seguridad](#16-pruebas-de-seguridad)
17. [Pruebas de Rendimiento](#17-pruebas-de-rendimiento)
18. [Pruebas de Integración End-to-End](#18-pruebas-de-integración-end-to-end)

---

## Convenciones

| Prioridad | Significado |
|-----------|-------------|
| **P1** | Crítico — bloquea el uso de la plataforma |
| **P2** | Alto — funcionalidad importante afectada |
| **P3** | Medio — funcionalidad secundaria o cosmética importante |
| **P4** | Bajo — mejora menor o cosmética |

| Columna | Descripción |
|---------|-------------|
| **ID** | Identificador único del caso |
| **Caso de prueba** | Descripción del escenario |
| **Precondición** | Estado necesario antes de ejecutar |
| **Pasos** | Acciones a realizar |
| **Resultado esperado** | Comportamiento correcto |
| **Prioridad** | P1–P4 |
| **Tipo** | Funcional / Negativo / Borde / Seguridad / Rendimiento |

---

## 1. Módulo de Autenticación

### 1.1 Registro de usuario

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| AUTH-001 | Registro exitoso con datos válidos | Ninguna | 1. Ir a `/auth/register` 2. Llenar: nombre, apellido, email válido, país, teléfono, profesión, contraseña fuerte, confirmar contraseña 3. Aceptar términos 4. Click "Crear cuenta" | Se muestra pantalla de éxito "Revisa tu correo". Se crea usuario con rol `estudiante`, `email_verified=false`. Se envía email de verificación. | P1 | Funcional |
| AUTH-002 | Registro con email duplicado | Existe usuario con email `test@test.com` | 1. Ir a `/auth/register` 2. Usar email `test@test.com` 3. Completar formulario 4. Click "Crear cuenta" | Error: "El email ya está registrado" o similar. No se crea cuenta duplicada. | P1 | Negativo |
| AUTH-003 | Registro con contraseña débil | Ninguna | 1. Ir a `/auth/register` 2. Ingresar contraseña corta (ej: "123") 3. Intentar enviar | El indicador de fortaleza muestra nivel bajo. El formulario no permite enviar si la contraseña es insuficiente. | P2 | Negativo |
| AUTH-004 | Registro con contraseñas que no coinciden | Ninguna | 1. Llenar contraseña "Password123!" 2. Confirmar con "Password456!" 3. Intentar enviar | Error de validación: "Las contraseñas no coinciden". No se envía el formulario. | P2 | Negativo |
| AUTH-005 | Registro sin aceptar términos | Ninguna | 1. Completar todos los campos correctamente 2. No marcar checkbox de términos 3. Click "Crear cuenta" | El botón está deshabilitado o muestra error de validación. | P2 | Negativo |
| AUTH-006 | Registro con campos vacíos obligatorios | Ninguna | 1. Ir a `/auth/register` 2. Dejar nombre vacío 3. Click "Crear cuenta" | Validación: campos obligatorios marcados en rojo. | P2 | Negativo |
| AUTH-007 | Registro con email formato inválido | Ninguna | 1. Ingresar email "noesunEmail" 2. Intentar enviar | Error de validación en campo email. | P3 | Negativo |

### 1.2 Verificación de email

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| AUTH-008 | Verificación exitosa de email | Usuario registrado sin verificar | 1. Abrir link de verificación recibido por email (`/auth/verify-email?token=xxx`) | Se marca `email_verified=true`. Redirección a `/dashboard`. | P1 | Funcional |
| AUTH-009 | Verificación con token inválido | Ninguna | 1. Navegar a `/auth/verify-email?token=token-falso` | Error: "Token inválido o expirado". | P2 | Negativo |
| AUTH-010 | Verificación con token ya usado | Usuario ya verificado | 1. Usar el mismo link de verificación otra vez | Error o mensaje indicando que el email ya fue verificado. | P3 | Borde |

### 1.3 Login

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| AUTH-011 | Login exitoso como estudiante | Usuario verificado con rol `estudiante` | 1. Ir a `/auth/login` 2. Ingresar email y contraseña correctos 3. Click "Iniciar sesión" | Redirección a `/dashboard`. Cookies `access_token` y `refresh_token` establecidas. Estado de Zustand actualizado con datos de usuario. | P1 | Funcional |
| AUTH-012 | Login exitoso como admin | Usuario con rol `admin` | 1. Login con credenciales de admin | Redirección a `/panel`. | P1 | Funcional |
| AUTH-013 | Login exitoso como soporte | Usuario con rol `soporte` | 1. Login con credenciales de soporte | Redirección a `/panel/soporte/cursos`. | P1 | Funcional |
| AUTH-014 | Login exitoso como marketing | Usuario con rol `marketing` | 1. Login con credenciales de marketing | Redirección a `/panel/marketing/publicaciones`. | P1 | Funcional |
| AUTH-015 | Login con credenciales incorrectas | Ninguna | 1. Ingresar email válido con contraseña incorrecta | Error: "Credenciales incorrectas". No se establecen cookies. | P1 | Negativo |
| AUTH-016 | Login con email no registrado | Ninguna | 1. Ingresar email inexistente 2. Contraseña cualquiera | Error genérico (no revelar si el email existe). | P2 | Negativo |
| AUTH-017 | Login con "Recordarme" activado | Usuario válido | 1. Marcar checkbox "Recordarme" 2. Login exitoso | La sesión dura 30 días (refresh_token extended). | P2 | Funcional |
| AUTH-018 | Login sin "Recordarme" | Usuario válido | 1. No marcar "Recordarme" 2. Login exitoso | La sesión dura 24 horas. | P2 | Funcional |
| AUTH-019 | Login con redirect parameter | Usuario no autenticado intenta acceder a `/mis-cursos` | 1. Ser redirigido a `/auth/login?redirect=/mis-cursos` 2. Login exitoso | Redirección a `/mis-cursos` (no al dashboard por defecto). | P3 | Funcional |

### 1.4 Recuperación de contraseña

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| AUTH-020 | Solicitar recuperación con email válido | Usuario registrado | 1. Ir a `/auth/forgot-password` 2. Ingresar email 3. Enviar | Mensaje de éxito. Se envía email con link de recuperación. Token con expiración de 1 hora. | P1 | Funcional |
| AUTH-021 | Solicitar recuperación con email inexistente | Ninguna | 1. Ingresar email no registrado 2. Enviar | Mismo mensaje de éxito (no revelar si el email existe — seguridad). | P2 | Seguridad |
| AUTH-022 | Reset password con token válido | Token de recuperación vigente | 1. Abrir link `/auth/reset-password?token=xxx` 2. Ingresar nueva contraseña 3. Confirmar 4. Enviar | Contraseña actualizada. Token invalidado. Redirección a login. | P1 | Funcional |
| AUTH-023 | Reset password con token expirado | Token generado hace más de 1 hora | 1. Usar link con token expirado | Error: "Token expirado". | P2 | Negativo |
| AUTH-024 | Reset password con token inválido | Ninguna | 1. Navegar con token falso | Error: "Token inválido". | P2 | Negativo |

### 1.5 Logout

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| AUTH-025 | Logout exitoso | Usuario autenticado | 1. Click en "Cerrar sesión" | Cookies eliminadas. Zustand store limpiado. Redirección a `/auth/login`. | P1 | Funcional |
| AUTH-026 | Acceso después de logout | Sesión cerrada | 1. Intentar acceder a `/dashboard` directamente | Redirección a `/auth/login`. | P1 | Funcional |

---

## 2. Módulo de Usuarios

### 2.1 Perfil de usuario

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| USR-001 | Ver perfil propio | Usuario autenticado | 1. Navegar a `/perfil` (estudiante) o `/panel/perfil` (staff) | Se muestran datos del usuario: nombre, apellido, email, teléfono, país. | P2 | Funcional |
| USR-002 | Actualizar datos del perfil | Usuario autenticado | 1. Ir a perfil 2. Cambiar nombre y teléfono 3. Guardar | Datos actualizados correctamente. Toast de éxito. | P2 | Funcional |
| USR-003 | Cambiar contraseña desde perfil | Usuario autenticado | 1. Ir a perfil 2. Sección "Cambiar contraseña" 3. Ingresar contraseña actual, nueva y confirmación 4. Guardar | Contraseña actualizada. | P2 | Funcional |
| USR-004 | Cambiar contraseña con actual incorrecta | Usuario autenticado | 1. Ingresar contraseña actual equivocada 2. Guardar | Error: "Contraseña actual incorrecta". | P2 | Negativo |

### 2.2 Gestión de usuarios (Admin)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| USR-005 | Listar usuarios con paginación | Admin autenticado | 1. Ir a `/panel/estudiantes` 2. Navegar entre páginas | Lista paginada de usuarios con nombre, email, rol, estado. | P2 | Funcional |
| USR-006 | Buscar usuario por nombre/email | Admin autenticado | 1. Escribir en barra de búsqueda "Juan" | Se filtran usuarios que coinciden en nombre o email. | P2 | Funcional |
| USR-007 | Filtrar usuarios por rol | Admin autenticado | 1. Seleccionar filtro de rol "soporte" | Solo se muestran usuarios con rol `soporte`. | P3 | Funcional |
| USR-008 | Filtrar usuarios por estado | Admin autenticado | 1. Seleccionar filtro "suspendido" | Solo se muestran usuarios suspendidos. | P3 | Funcional |
| USR-009 | Crear usuario desde admin | Admin autenticado | 1. Click "Nuevo usuario" 2. Llenar nombre, email, rol, contraseña 3. Guardar | Usuario creado con `email_verified=true`, `status=active`. Se envía email de notificación. | P1 | Funcional |
| USR-010 | Crear usuario con email duplicado | Admin autenticado, email ya existe | 1. Intentar crear usuario con email existente | Error 409: "Email ya registrado". | P2 | Negativo |
| USR-011 | Suspender usuario | Admin autenticado | 1. En lista de usuarios, click "Suspender" en un usuario activo | Estado cambia a `suspended`. | P2 | Funcional |
| USR-012 | Activar usuario suspendido | Admin autenticado | 1. Click "Activar" en usuario suspendido | Estado cambia a `active`. | P2 | Funcional |
| USR-013 | Eliminar usuario (soft delete) | Admin autenticado | 1. Click "Eliminar" en un usuario 2. Confirmar | `deleted_at` se establece. `status=deleted`. El usuario ya no aparece en listados activos. | P2 | Funcional |
| USR-014 | Ver detalle de estudiante | Admin/soporte autenticado | 1. Click en un estudiante en `/panel/estudiantes` | Se muestra: datos personales, matrículas con progreso, estado de certificados. | P2 | Funcional |
| USR-015 | Ver actividad de estudiante en curso | Admin/soporte autenticado | 1. En detalle de estudiante, click en un curso | Se muestra progreso sesión por sesión: módulo, duración, tiempo visto, porcentaje, completado. Gráfico de actividad diaria. | P3 | Funcional |

---

## 3. Módulo de Cursos

### 3.1 Catálogo público

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRS-001 | Ver catálogo de cursos | Cursos publicados existen | 1. Navegar a `/cursos` | Se muestran cursos publicados en grid. Paginación de 12 por página. | P1 | Funcional |
| CRS-002 | Buscar curso por título | Cursos publicados existen | 1. Escribir en barra de búsqueda "Derecho" 2. Click "Buscar" | Se filtran cursos que coinciden en título/tagline. URL actualizada con `?buscar=Derecho`. | P1 | Funcional |
| CRS-003 | Filtrar por categoría | Categorías y cursos existen | 1. En sidebar, marcar una categoría | Se muestran solo cursos de esa categoría. | P2 | Funcional |
| CRS-004 | Filtrar por múltiples categorías | Varias categorías con cursos | 1. Marcar 2+ categorías | Se muestran cursos de cualquiera de las categorías seleccionadas. | P2 | Funcional |
| CRS-005 | Filtrar por calificación mínima | Cursos con reseñas | 1. Seleccionar "4+ estrellas" | Solo cursos con `avg_rating >= 4`. | P3 | Funcional |
| CRS-006 | Filtrar por rango de precio | Cursos con distintos precios | 1. Mover sliders de precio mín/máx | Solo cursos dentro del rango de precio. | P3 | Funcional |
| CRS-007 | Filtrar por duración | Cursos con distintas duraciones | 1. Seleccionar "<10h" | Solo cursos con duración total menor a 10 horas. | P3 | Funcional |
| CRS-008 | Filtrar por software | Cursos con software tools | 1. Marcar un software específico | Solo cursos que incluyen ese software. | P3 | Funcional |
| CRS-009 | Ordenar cursos | Cursos publicados | 1. Cambiar orden a "Precio: menor a mayor" | Cursos reordenados por precio ascendente. | P2 | Funcional |
| CRS-010 | Paginación del catálogo | Más de 12 cursos publicados | 1. Ir a página 2 | Se muestran los siguientes 12 cursos. URL actualizada con `?pagina=2`. | P2 | Funcional |
| CRS-011 | Filtros activos como badges | Filtros aplicados | 1. Aplicar categoría + búsqueda | Badges removibles aparecen arriba del grid. Click en X del badge remueve ese filtro. | P3 | Funcional |
| CRS-012 | Limpiar todos los filtros | Filtros aplicados | 1. Click "Limpiar todo" | Todos los filtros removidos. URL limpia. | P3 | Funcional |
| CRS-013 | Catálogo sin resultados | Filtros muy restrictivos | 1. Aplicar filtros que no coincidan con ningún curso | Mensaje: "No encontramos cursos con esos filtros". | P3 | Borde |

### 3.2 Detalle de curso público

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRS-014 | Ver detalle de curso por slug | Curso publicado | 1. Navegar a `/cursos/[slug]` | Se muestra: título, tagline, descripción, resultados de aprendizaje, prerrequisitos, módulos con sesiones, instructores, reseñas. Sidebar con precio y botones de compra. | P1 | Funcional |
| CRS-015 | Agregar curso al carrito desde detalle | Curso publicado, no matriculado | 1. Click "Agregar al carrito" | Curso agregado al carrito. Botón cambia a "Ya en el carrito". | P1 | Funcional |
| CRS-016 | Ver módulos y sesiones expandibles | Curso con módulos y sesiones | 1. Click en un módulo para expandir | Se muestran las sesiones del módulo con título y duración. | P2 | Funcional |
| CRS-017 | Curso no encontrado | Slug inexistente | 1. Navegar a `/cursos/slug-inexistente` | Página 404 o mensaje de error. | P3 | Negativo |

### 3.3 CRUD de cursos (Admin/Soporte)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRS-018 | Listar cursos en panel | Admin/soporte autenticado | 1. Ir a `/panel/soporte/cursos` | Tabla paginada con: título, categoría, estado, acciones. | P1 | Funcional |
| CRS-019 | Crear curso nuevo | Admin/soporte autenticado | 1. Click "Nuevo curso" 2. Tab Básico: título, categoría, nivel, tagline, descripción 3. Tab Precio: precio, moneda, duración de acceso 4. Tab Contenido: prerrequisitos, resultados 5. Tab Instructores: agregar al menos 1 6. Guardar | Curso creado con estado `draft`. Slug auto-generado del título. | P1 | Funcional |
| CRS-020 | Crear curso con slug duplicado | Curso con slug "derecho-laboral" existe | 1. Crear curso con título "Derecho Laboral" | Error: slug duplicado, o auto-generación de slug único (ej: "derecho-laboral-2"). | P2 | Negativo |
| CRS-021 | Editar curso existente | Curso creado | 1. Click "Editar" en un curso 2. Cambiar título y precio 3. Guardar | Datos actualizados. Toast de confirmación. | P1 | Funcional |
| CRS-022 | Subir thumbnail de curso | Curso creado | 1. En edición de curso, subir imagen JPG/PNG/WEBP < 5MB | Imagen subida a Cloudinary. URL actualizada en el curso. | P2 | Funcional |
| CRS-023 | Subir thumbnail con formato inválido | Curso creado | 1. Intentar subir archivo .gif o .pdf | Error: "Solo se permiten imágenes jpg, jpeg, png, webp". | P3 | Negativo |
| CRS-024 | Subir thumbnail mayor a 5MB | Curso creado | 1. Intentar subir imagen de 10MB | Error: archivo excede el límite. | P3 | Negativo |
| CRS-025 | Publicar curso (cambiar estado) | Curso en `draft` | 1. Editar curso 2. Cambiar estado a `published` 3. Guardar | Estado actualizado. `published_at` se establece. Curso visible en catálogo público. | P1 | Funcional |
| CRS-026 | Archivar curso | Curso publicado | 1. Cambiar estado a `archived` | Curso ya no aparece en catálogo público. Estudiantes matriculados mantienen acceso. | P2 | Funcional |
| CRS-027 | Eliminar curso | Admin autenticado | 1. Click "Eliminar" en un curso 2. Confirmar | Curso eliminado (soft delete con `deleted_at`). Thumbnail eliminado de Cloudinary. | P2 | Funcional |
| CRS-028 | Agregar instructor a curso | Curso creado | 1. En tab Instructores 2. Agregar: nombre, título, descripción, foto URL | Instructor creado y asociado al curso. | P2 | Funcional |
| CRS-029 | Eliminar instructor de curso | Curso con instructores | 1. Click eliminar en un instructor | Instructor desasociado del curso. | P3 | Funcional |

### 3.4 Categorías (Admin/Soporte)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRS-030 | Crear categoría | Admin/soporte autenticado | 1. Ir a `/panel/soporte/categorias` 2. Click "Nueva categoría" 3. Llenar nombre, slug, icono, color 4. Guardar | Categoría creada. Visible en filtros del catálogo. | P2 | Funcional |
| CRS-031 | Editar categoría | Categoría existente | 1. Click "Editar" 2. Cambiar nombre 3. Guardar | Nombre actualizado en todos los cursos asociados. | P2 | Funcional |
| CRS-032 | Eliminar categoría | Categoría sin cursos asociados | 1. Click "Eliminar" 2. Confirmar | Categoría eliminada. | P3 | Funcional |
| CRS-033 | Reordenar categorías | Múltiples categorías | 1. Arrastrar categorías para reordenar | `display_order` actualizado. Nuevo orden reflejado en catálogo. | P3 | Funcional |

---

## 4. Módulo de Contenido

### 4.1 Módulos de curso

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CNT-001 | Crear módulo | Curso existente, admin/soporte | 1. Ir a `/panel/soporte/cursos/[id]/contenido` 2. Click "Nuevo módulo" 3. Ingresar título 4. Guardar | Módulo creado con `display_order` automático. | P1 | Funcional |
| CNT-002 | Editar módulo | Módulo existente | 1. Click editar en módulo 2. Cambiar título 3. Guardar | Título actualizado. | P2 | Funcional |
| CNT-003 | Eliminar módulo | Módulo existente | 1. Click eliminar 2. Confirmar | Módulo y sus sesiones/materiales eliminados en cascada. | P2 | Funcional |
| CNT-004 | Crear módulo sin título | Admin/soporte | 1. Intentar crear módulo sin título | Error de validación. | P3 | Negativo |

### 4.2 Sesiones

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CNT-005 | Crear sesión con YouTube URL | Módulo existente | 1. Click "Nueva sesión" 2. Ingresar título, URL de YouTube, duración en minutos 3. Guardar | Sesión creada. `youtube_video_id` extraído de la URL. | P1 | Funcional |
| CNT-006 | Editar sesión | Sesión existente | 1. Click editar 2. Cambiar título y duración 3. Guardar | Datos actualizados. | P2 | Funcional |
| CNT-007 | Eliminar sesión | Sesión existente | 1. Click eliminar 2. Confirmar | Sesión y materiales eliminados. Progreso de estudiantes no afectado retroactivamente. | P2 | Funcional |
| CNT-008 | Crear sesión sin URL de YouTube | Módulo existente | 1. Intentar crear sesión sin youtube_url | Error de validación. | P3 | Negativo |

### 4.3 Materiales

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CNT-009 | Crear material (link Google Drive) | Sesión existente | 1. Click "Nuevo material" 2. Nombre, URL de Drive, tipo (PDF/Excel/Word/Otro) 3. Guardar | Material creado y asociado a la sesión. | P2 | Funcional |
| CNT-010 | Eliminar material | Material existente | 1. Click eliminar 2. Confirmar | Material eliminado de la sesión. | P3 | Funcional |

---

## 5. Módulo de Estudiante

### 5.1 Dashboard del estudiante

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| STD-001 | Ver dashboard con matrículas | Estudiante con cursos matriculados | 1. Ir a `/dashboard` | KPIs: cursos en progreso, progreso promedio, completados, horas de estudio. Sección "Continuar aprendiendo" con último curso. Tabs de cursos por estado. | P1 | Funcional |
| STD-002 | Ver dashboard sin matrículas | Estudiante nuevo sin cursos | 1. Ir a `/dashboard` | KPIs en 0. Mensaje para explorar cursos. Links rápidos visibles. | P2 | Borde |
| STD-003 | Ver lista "Mis cursos" | Estudiante con cursos | 1. Ir a `/mis-cursos` | Lista con tabs: en progreso, completados, no iniciados. Cada curso muestra thumbnail, título, nivel, barra de progreso, fechas. | P1 | Funcional |
| STD-004 | Buscar en mis cursos | Estudiante con cursos | 1. Escribir en barra de búsqueda | Cursos filtrados por título. | P3 | Funcional |

### 5.2 Reproductor de curso (Course Viewer)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| STD-005 | Abrir reproductor de curso | Estudiante matriculado | 1. Click "Continuar" o "Iniciar" en un curso | Se abre `/curso/[id]` con reproductor de YouTube a la izquierda y sidebar de módulos a la derecha. | P1 | Funcional |
| STD-006 | Reproducir video de sesión | En reproductor de curso | 1. Click en una sesión del sidebar | Video de YouTube carga en el reproductor. Información de sesión visible debajo. | P1 | Funcional |
| STD-007 | Progreso automático de sesión (90%) | Video reproduciéndose | 1. Ver video hasta el 90% de la duración total | Sesión marcada como completada automáticamente (`PUT /student/progress/sessions/:id`). Indicador visual de completado en sidebar. | P1 | Funcional |
| STD-008 | Progreso parcial de sesión | Video reproduciéndose | 1. Ver 50% del video 2. Cerrar y volver después | `watched_seconds` guardados. Al volver, se puede ver cuánto falta. | P2 | Funcional |
| STD-009 | Auto-avance entre sesiones | Sesión completada | 1. Completar una sesión (video termina) | Countdown de 5 segundos. Auto-avance a la siguiente sesión. | P2 | Funcional |
| STD-010 | Navegación prev/next entre sesiones | En reproductor | 1. Click botones "Anterior"/"Siguiente" | Navega a la sesión correspondiente. | P2 | Funcional |
| STD-011 | Ver materiales descargables | Sesión con materiales | 1. En la información de sesión, ver sección de materiales | Links de descarga a Google Drive visibles con tipo de archivo. | P2 | Funcional |
| STD-012 | Progreso general del curso | Estudiante con sesiones completadas | 1. Completar varias sesiones | Barra de progreso en sidebar se actualiza: `(completadas / totales) * 100`. | P1 | Funcional |
| STD-013 | Curso 100% completado | Todas las sesiones completadas | 1. Completar la última sesión | Progreso = 100%. `completed_at` establecido. Modal de reseña aparece invitando a dejar comentario. | P1 | Funcional |
| STD-014 | Auto-matrícula al acceder contenido | Estudiante sin matrícula intenta ver curso | 1. Navegar a `/curso/[id]` de un curso no matriculado | Se crea matrícula automática (`enrollment_type: 'online'`). Se incrementa `enrolled_count`. Contenido visible. | P2 | Funcional |

### 5.3 Tracking de progreso (API)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| STD-015 | Actualizar progreso cada 30 segundos | Video reproduciéndose | 1. Dejar video correr por 2 minutos | `PUT /student/progress/sessions/:id` se llama cada ~30s con `watched_seconds` actualizado. | P1 | Funcional |
| STD-016 | Forzar completado de sesión | Sesión no completada | 1. Enviar `PUT /student/progress/sessions/:id` con `forceComplete=true` | Sesión marcada como completada independientemente del tiempo visto. | P3 | Funcional |

---

## 6. Módulo de Reseñas

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| REV-001 | Enviar reseña válida | Curso al 100%, sin reseña previa | 1. Modal de reseña aparece 2. Seleccionar 4 estrellas 3. Escribir comentario (50-500 caracteres) 4. Enviar | Reseña creada con `status: approved`. `avg_rating` y `review_count` del curso recalculados. | P1 | Funcional |
| REV-002 | Auto-generación de certificado con reseña | Curso con `certification_mode: auto` y template asignado | 1. Enviar reseña | Certificado generado automáticamente tipo `Certificado`. Vinculado a la reseña. | P1 | Funcional |
| REV-003 | Reseña con comentario muy corto | Curso al 100% | 1. Escribir comentario de 10 caracteres 2. Enviar | Error: "El comentario debe tener al menos 50 caracteres". | P2 | Negativo |
| REV-004 | Reseña con comentario muy largo | Curso al 100% | 1. Escribir comentario de 600 caracteres 2. Enviar | Error: "El comentario no puede exceder 500 caracteres". | P3 | Negativo |
| REV-005 | Intentar reseña duplicada | Reseña ya enviada para este curso | 1. Intentar enviar otra reseña para la misma matrícula | Error 409: "Ya has enviado una reseña para este curso". | P2 | Negativo |
| REV-006 | Reseña sin 100% de progreso | Curso con 80% de progreso | 1. Intentar enviar reseña | Error: "Debes completar el 100% del curso para dejar una reseña". | P1 | Negativo |

---

## 7. Módulo de Certificados

### 7.1 Certificados del estudiante

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRT-001 | Ver lista de certificados | Estudiante con certificados | 1. Ir a `/mis-certificados` | Grid de certificados con: título del curso, fecha de emisión, código de verificación. Acciones: Ver, Descargar, Compartir. | P1 | Funcional |
| CRT-002 | Ver detalle de certificado | Certificado emitido | 1. Click "Ver" en un certificado | Página `/certificado/[enrollment_id]`. PDF renderizado en iframe. Metadatos: programa, estudiante, duración, fecha, instructores, código de verificación. | P1 | Funcional |
| CRT-003 | Descargar certificado PDF | Certificado emitido | 1. Click "Descargar PDF" | Se descarga archivo PDF generado dinámicamente por el backend. | P1 | Funcional |
| CRT-004 | Lista vacía de certificados | Estudiante sin certificados | 1. Ir a `/mis-certificados` | Mensaje: "Aún no tienes certificados". Link al catálogo de cursos. | P3 | Borde |
| CRT-005 | Ver certificado de otro usuario | Estudiante A intenta ver certificado de estudiante B | 1. Navegar directamente a `/certificado/[enrollment_id_de_B]` | Error 403 o redirección. No se muestra el certificado ajeno. | P1 | Seguridad |

### 7.2 Verificación pública de certificados

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRT-006 | Verificar certificado válido | Certificado emitido | 1. Navegar a `/verificar/[uuid]` | Se muestra: vista previa del certificado (frente/reverso con template), nombre del estudiante, título del curso, duración, fecha, instructores. Botón de compartir. | P1 | Funcional |
| CRT-007 | Verificar código inexistente | Ninguna | 1. Navegar a `/verificar/uuid-falso` | Mensaje: "Certificado no encontrado" o similar. | P2 | Negativo |

### 7.3 Certificaciones manuales (Admin/Soporte)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CRT-008 | Ver certificaciones de un curso | Admin/soporte, curso con matrículas | 1. Ir a `/panel/soporte/cursos/[id]/certificaciones` | Lista de estudiantes matriculados con: nombre, notas por módulo, promedio, estado del certificado. | P1 | Funcional |
| CRT-009 | Exportar plantilla Excel de notas | Curso con matrículas | 1. Click "Exportar Excel" | Se descarga .xlsx con columnas: enrollment_id (oculto), Nombres, Apellidos, Email, [columnas de módulos], Promedio. Notas existentes precargadas. | P2 | Funcional |
| CRT-010 | Importar notas desde Excel | Excel con notas válidas (0-20) | 1. Click "Importar Excel" 2. Seleccionar archivo 3. Confirmar | Notas importadas. Promedios recalculados por matrícula. | P1 | Funcional |
| CRT-011 | Importar Excel con nota fuera de rango | Excel con nota 25 en un campo | 1. Importar Excel | Error de validación: "Nota fuera del rango 0-20". No se importa ningún dato. | P2 | Negativo |
| CRT-012 | Emitir certificado manualmente | Estudiante con notas, template asignado | 1. Click "Emitir certificado" 2. Seleccionar tipo (Certificado/Constancia) y template 3. Confirmar | Certificado creado con `verification_code` único. | P1 | Funcional |
| CRT-013 | Revocar certificado | Certificado emitido | 1. Click "Revocar" en un certificado 2. Confirmar | Certificado eliminado. Estudiante pierde acceso al PDF. | P2 | Funcional |
| CRT-014 | Certificado vs Constancia por nota | Estudiante con promedio 12 | 1. Emitir certificación | Tipo debe ser `Constancia` (nota < 14), no `Certificado`. | P2 | Funcional |

---

## 8. Módulo de Matrículas

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| MAT-001 | Crear matrícula manual | Admin/soporte autenticado | 1. Ir a `/panel/soporte/matriculas` 2. Buscar estudiante 3. Seleccionar cursos 4. Elegir método de pago offline (transferencia/efectivo/cortesía) 5. Monto (opcional) 6. Notas internas (opcional) 7. Matricular | Matrículas creadas con `enrollment_type: manual`. `enrolled_count` incrementado por cada curso. Toast con cantidad creada. | P1 | Funcional |
| MAT-002 | Matrícula manual en curso ya matriculado | Estudiante ya inscrito en el curso | 1. Seleccionar un curso donde ya está matriculado 2. Matricular | Curso se salta automáticamente. Se informa cuántos se crearon vs cuántos se saltaron. | P2 | Borde |
| MAT-003 | Matrícula manual de usuario inexistente | Admin/soporte | 1. Buscar un user_id que no existe | Error: usuario no encontrado. | P3 | Negativo |
| MAT-004 | Eliminar matrícula | Admin/soporte, matrícula existente | 1. Click "Eliminar" en una matrícula 2. Confirmar | Matrícula eliminada. Certificado y reseña asociados también eliminados. `enrolled_count` decrementado. `avg_rating` recalculado si había reseña. | P2 | Funcional |
| MAT-005 | Listar matrículas con filtros | Admin/soporte | 1. Ir a lista de matrículas 2. Buscar por nombre 3. Filtrar por curso | Resultados filtrados correctamente, paginados. | P2 | Funcional |

---

## 9. Módulo de Carrito de Compras

### 9.1 Carrito para usuarios autenticados

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CART-001 | Agregar curso al carrito | Estudiante autenticado | 1. En detalle de curso, click "Agregar al carrito" | Curso aparece en `/carrito`. API `POST /cart/add` llamada. | P1 | Funcional |
| CART-002 | Agregar curso ya en carrito | Curso ya agregado | 1. Intentar agregar el mismo curso | Mensaje: "El curso ya está en tu carrito". No se duplica. | P2 | Negativo |
| CART-003 | Agregar curso ya matriculado | Estudiante ya inscrito en el curso | 1. Intentar agregar al carrito | Error: "Ya estás matriculado en este curso". | P2 | Negativo |
| CART-004 | Eliminar curso del carrito | Curso en carrito | 1. Click "Eliminar" en el item del carrito | Curso removido. Total actualizado. | P1 | Funcional |
| CART-005 | Ver resumen del carrito | Cursos en carrito | 1. Ir a `/carrito` | Lista de cursos con precios (usa `discount_price` si existe). Total calculado. Botón "Proceder al pago". | P1 | Funcional |
| CART-006 | Vaciar carrito | Cursos en carrito | 1. Click "Vaciar carrito" | Todos los items eliminados. | P3 | Funcional |

### 9.2 Carrito para visitantes (guest)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| CART-007 | Carrito de visitante en localStorage | No autenticado | 1. Agregar curso al carrito | Curso almacenado en Zustand/localStorage con `session_token`. TTL de 7 días. | P2 | Funcional |
| CART-008 | Merge de carrito al hacer login | Guest con items en carrito | 1. Agregar 2 cursos como visitante 2. Login | Carrito del guest se fusiona con el carrito del usuario. Items duplicados eliminados. Items del guest reasignados al user_id. | P1 | Funcional |
| CART-009 | Carrito de visitante expira | Items con más de 7 días | 1. Esperar expiración (o simular) | Items expirados no se muestran. | P4 | Borde |

---

## 10. Módulo de Pagos

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| PAY-001 | Checkout con MercadoPago | Cursos en carrito, país Latam | 1. Ir a `/checkout` 2. Seleccionar MercadoPago 3. Completar pago | Payment Brick de MercadoPago carga. Al aprobar: orden marcada como `paid`, matrículas creadas automáticamente, carrito vaciado, redirección a `/checkout/success`. | P1 | Funcional |
| PAY-002 | Checkout con PayPal | Cursos en carrito | 1. Ir a `/checkout` 2. Seleccionar PayPal 3. Completar pago | PayPal Smart Buttons cargan. Si moneda es PEN, auto-conversión a USD (tasa 3.75). Al capturar: misma lógica de confirmación que MercadoPago. | P1 | Funcional |
| PAY-003 | Pago rechazado | Tarjeta inválida | 1. Intentar pagar con tarjeta rechazada | Error de pago mostrado. Orden permanece en `pending`. No se crean matrículas. | P1 | Negativo |
| PAY-004 | Detección de moneda por geolocalización | Usuario de Perú | 1. Abrir checkout desde IP peruana | Moneda detectada como PEN. Precios en soles. | P3 | Funcional |
| PAY-005 | Página de éxito post-pago | Pago exitoso | 1. Ser redirigido a `/checkout/success` | Confirmación de transacción. Recibo/factura generado (A4 imprimible). Carrito vacío. | P1 | Funcional |
| PAY-006 | Checkout con carrito vacío | Sin items | 1. Navegar directamente a `/checkout` | Redirección al carrito o mensaje "No hay productos". | P2 | Borde |

---

## 11. Módulo de Marketing

### 11.1 Sliders

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| MKT-001 | Listar sliders en panel | Admin/marketing autenticado | 1. Ir a `/panel/marketing/sliders` | Tabla con: vista previa, título, tipo (Cursos/Banner), posición, estado, acciones. | P2 | Funcional |
| MKT-002 | Crear slider tipo Banner | Admin/marketing | 1. Click "Nuevo slider" 2. Tipo: Banner, Título, Subtítulo, Posición: Top, Imagen, Link WhatsApp, Link página 3. Crear | Slider creado con `display_order` automático. | P2 | Funcional |
| MKT-003 | Crear slider tipo Cursos | Admin/marketing | 1. Tipo: Cursos 2. Seleccionar hasta 10 cursos 3. Crear | Slider creado con cursos asociados vía tabla `SliderCourse`. | P2 | Funcional |
| MKT-004 | Crear slider tipo Cursos con más de 10 | Admin/marketing | 1. Intentar seleccionar 11 cursos | Warning: "Máximo 10 cursos por slider". No permite seleccionar más. | P3 | Negativo |
| MKT-005 | Editar slider | Slider existente | 1. Click "Editar" 2. Cambiar título y posición 3. Guardar | Datos actualizados. Si se cambian cursos, los anteriores se eliminan y se recrean. | P2 | Funcional |
| MKT-006 | Subir imagen de slider | Slider existente | 1. POST imagen JPG/PNG/WEBP < 5MB | Imagen subida exitosamente. | P2 | Funcional |
| MKT-007 | Toggle estado de slider | Slider activo | 1. Click en badge "Activo" | Estado cambia a `inactive`. No se muestra en homepage. | P2 | Funcional |
| MKT-008 | Eliminar slider | Slider existente | 1. Click "Eliminar" 2. Confirmar | Slider eliminado con sus `SliderCourse` asociados (cascade). | P3 | Funcional |
| MKT-009 | Sliders activos en homepage | Sliders activos existen | 1. Ir a `/` (homepage) | HeroSlider muestra todos los sliders activos como carrusel, ordenados por `display_order`. Navegación con flechas, dots y auto-play (6s). | P1 | Funcional |
| MKT-010 | Homepage sin sliders activos | Ningún slider activo | 1. Ir a `/` | Se muestra FallbackHero estático con branding de Escuela Global. | P2 | Borde |
| MKT-011 | Crear tipo de evento inline | En modal de slider | 1. Click "Nuevo tipo" 2. Escribir nombre (ej: "Foro") 3. Click "Crear" | Tipo de evento creado. Se selecciona automáticamente en el slider. | P3 | Funcional |

### 11.2 Promociones

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| MKT-012 | Crear promoción con imagen | Admin/marketing | 1. Ir a `/panel/marketing/publicaciones` 2. Click "Nueva publicación" 3. Título, imagen (upload), URL destino, estado, fechas 4. Crear | Promoción creada con imagen subida (multipart). | P2 | Funcional |
| MKT-013 | Editar promoción | Promoción existente | 1. Click "Editar" 2. Cambiar título y fechas 3. Guardar | Datos actualizados. | P2 | Funcional |
| MKT-014 | Eliminar promoción | Promoción existente | 1. Click "Eliminar" 2. Confirmar | Promoción eliminada. | P3 | Funcional |
| MKT-015 | Reordenar promociones | Múltiples promociones | 1. Arrastrar para reordenar | `display_order` actualizado. Orden reflejado en homepage. | P3 | Funcional |
| MKT-016 | Promociones activas en homepage | Promociones activas | 1. Ir a `/` | Sección PromoBanners muestra banners activos con scroll horizontal. | P2 | Funcional |

### 11.3 Tipos de evento

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| MKT-017 | CRUD de tipos de evento | Admin/marketing | 1. Ir a `/panel/marketing/event-types` 2. Crear/Editar/Eliminar tipos | Tipos gestionados correctamente. Reflejados como opciones en sliders. | P3 | Funcional |

---

## 12. Módulo de Notificaciones

### 12.1 Notificaciones del estudiante

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| NOT-001 | Ver notificaciones | Estudiante con notificaciones | 1. Ir a `/notificaciones` | Lista de notificaciones agrupadas por tipo: nuevo_curso, completado, recordatorio, matriculacion, certificado, personalizada. | P2 | Funcional |
| NOT-002 | Badge de notificaciones no leídas | Notificaciones sin leer existen | 1. Observar sidebar/header | Badge con contador de no leídas. Se actualiza cada 60 segundos (polling). | P2 | Funcional |
| NOT-003 | Marcar notificación como leída | Notificación sin leer | 1. Click en una notificación | Modal con detalle abre. Notificación marcada como leída. Badge se actualiza. | P2 | Funcional |
| NOT-004 | Marcar todas como leídas | Múltiples no leídas | 1. Click "Marcar todas como leídas" | Todas las notificaciones marcadas como leídas. Badge desaparece. | P3 | Funcional |

### 12.2 Envío de notificaciones (Marketing)

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| NOT-005 | Enviar notificación a todos | Admin/marketing | 1. Ir a `/panel/marketing/notificaciones` 2. Audiencia: "Todos los estudiantes" 3. Título y cuerpo 4. Enviar | Notificación creada para todos los estudiantes activos. | P2 | Funcional |
| NOT-006 | Enviar notificación por curso | Admin/marketing | 1. Audiencia: "Por curso" 2. Seleccionar curso 3. Enviar | Notificación solo para matriculados en ese curso. | P2 | Funcional |
| NOT-007 | Enviar notificación a usuarios específicos | Admin/marketing | 1. Audiencia: "Usuarios específicos" 2. Buscar y seleccionar usuarios 3. Enviar | Notificación solo para los usuarios seleccionados. | P2 | Funcional |
| NOT-008 | Enviar notificación con título vacío | Admin/marketing | 1. Dejar título vacío 2. Enviar | Error de validación: título requerido. | P3 | Negativo |
| NOT-009 | Notificación con título > 255 caracteres | Admin/marketing | 1. Escribir título de 300 caracteres | Error: @MaxLength(255). | P3 | Negativo |

---

## 13. Panel Administrativo

### 13.1 Dashboard de admin

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| ADM-001 | Ver KPIs del dashboard | Admin autenticado, datos existen | 1. Ir a `/panel` | KPIs: ingresos mensuales (con tendencia vs mes anterior), estudiantes registrados, cursos activos, tasa de completación. | P1 | Funcional |
| ADM-002 | Filtrar dashboard por rango de fechas | Admin autenticado | 1. Seleccionar rango de fechas 2. Aplicar | KPIs y gráficos se actualizan al rango seleccionado. | P2 | Funcional |
| ADM-003 | Filtrar dashboard por categoría | Admin autenticado | 1. Seleccionar una categoría | Datos filtrados por la categoría seleccionada. | P2 | Funcional |
| ADM-004 | Ver gráfico de ingresos | Admin, datos de pagos existen | 1. Observar gráfico de línea | Ingresos de los últimos 12 meses. Datos correctos comparados con órdenes pagadas. | P2 | Funcional |
| ADM-005 | Ver gráfico de top cursos | Admin, cursos con matrículas | 1. Observar gráfico de barras | Top 10 cursos por número de matrículas. | P3 | Funcional |
| ADM-006 | Ver distribución por categorías | Admin | 1. Observar gráfico donut | Distribución de cursos por categoría. | P3 | Funcional |
| ADM-007 | Ver tabla de top completación | Admin | 1. Observar tabla | Top 10 cursos con mayor tasa de completación. | P3 | Funcional |
| ADM-008 | Ver top estudiantes más activos | Admin | 1. Observar tabla | Top 10 estudiantes con más actividad. | P3 | Funcional |
| ADM-009 | Dashboard sin datos | Admin, sistema vacío | 1. Ir a `/panel` | KPIs en 0. Gráficos vacíos o con mensaje apropiado. No errores JS. | P3 | Borde |

### 13.2 Matriculados por curso

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| ADM-010 | Ver matriculados de un curso | Admin, curso con matrículas | 1. Ir a `/panel/cursos/[id]/matriculados` | Lista paginada: total matriculados, progreso promedio, activos en 7 días, tasa de completación. Filtros por estado y tipo de matrícula. | P2 | Funcional |
| ADM-011 | Buscar matriculado | Admin | 1. Escribir nombre en barra de búsqueda | Resultados filtrados por nombre/email. | P3 | Funcional |

### 13.3 Auditoría

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| ADM-012 | Ver registros de auditoría | Admin autenticado | 1. Ir a `/panel/auditoria` | Tabla paginada: usuario, entidad, acción (create/update/delete), fecha. | P2 | Funcional |
| ADM-013 | Paginación de auditoría | Más de 10 registros | 1. Navegar entre páginas | Registros paginados correctamente (10 por página). | P3 | Funcional |

---

## 14. Plantillas de Certificados

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| TPL-001 | Crear plantilla de certificado | Admin autenticado | 1. Ir a `/panel/soporte/certificados/plantillas` 2. Click "Nueva plantilla" 3. Nombre, imagen de fondo (front), imagen de reverso (back, opcional) 4. Arrastrar para posicionar nombre del estudiante y QR 5. Configurar: font family, font sizes, tamaño QR 6. Guardar | Plantilla creada con posiciones en coordenadas del espacio virtual 3508×2480. | P1 | Funcional |
| TPL-002 | Editar plantilla | Plantilla existente | 1. Click "Editar" 2. Mover posición del nombre 3. Guardar | Coordenadas actualizadas. Certificados futuros usan nueva posición. | P2 | Funcional |
| TPL-003 | Activar plantilla | Plantilla inactiva | 1. Click "Activar" | Plantilla marcada como activa. Disponible para asignar a cursos. | P2 | Funcional |
| TPL-004 | Eliminar plantilla | Plantilla sin cursos asociados | 1. Click "Eliminar" 2. Confirmar | Plantilla eliminada. | P3 | Funcional |
| TPL-005 | Subir imagen mayor a 10MB | En creación de plantilla | 1. Subir imagen de 15MB | Error: excede límite de 10MB. | P3 | Negativo |
| TPL-006 | Subir formato no soportado | En creación de plantilla | 1. Subir archivo .bmp | Error: solo jpg, jpeg, png, webp. | P3 | Negativo |
| TPL-007 | Asignar plantilla a curso | Curso existente, plantilla activa | 1. En edición de curso, seleccionar plantilla de certificado y constancia | Plantilla asignada. Certificados emitidos usan esta plantilla. | P2 | Funcional |

---

## 15. Navegación, Layouts y Protección de Rutas

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| NAV-001 | Protección de ruta estudiante sin auth | No autenticado | 1. Navegar a `/dashboard` | Redirección a `/auth/login?redirect=/dashboard`. | P1 | Seguridad |
| NAV-002 | Protección de ruta admin sin auth | No autenticado | 1. Navegar a `/panel` | Redirección a `/auth/login?redirect=/panel`. | P1 | Seguridad |
| NAV-003 | Estudiante intenta acceder a panel admin | Estudiante autenticado | 1. Navegar a `/panel` | Redirección a `/sin-acceso` (página 403). | P1 | Seguridad |
| NAV-004 | Marketing intenta acceder a soporte | Marketing autenticado | 1. Navegar a `/panel/soporte/cursos` | Redirección a `/sin-acceso`. | P1 | Seguridad |
| NAV-005 | Soporte intenta acceder a marketing | Soporte autenticado | 1. Navegar a `/panel/marketing/publicaciones` | Redirección a `/sin-acceso`. | P1 | Seguridad |
| NAV-006 | Admin accede a todas las secciones | Admin autenticado | 1. Navegar a soporte, marketing, admin | Todas las rutas accesibles. Admin hereda permisos de soporte + marketing. | P1 | Seguridad |
| NAV-007 | JWT expirado renueva automáticamente | Access token expirado, refresh válido | 1. Realizar acción con access token expirado | AuthGuard renueva access_token automáticamente. Operación procede sin error. | P1 | Funcional |
| NAV-008 | JWT expirado sin refresh token | Ambos tokens expirados | 1. Realizar acción | Cookie eliminada. Redirección a `/auth/login`. | P1 | Funcional |
| NAV-009 | Sidebar de estudiante | Estudiante autenticado | 1. Observar sidebar | Links: Dashboard, Mis cursos, Mis certificados, Carrito, Notificaciones, Mi perfil. Badge de notificaciones no leídas. | P2 | Funcional |
| NAV-010 | Sidebar de panel admin | Admin autenticado | 1. Observar sidebar | Secciones organizadas por rol: Dashboard, Estudiantes, Contenido, Marketing, Sistema. Solo ítems del rol visible. | P2 | Funcional |
| NAV-011 | Sidebar responsive (mobile) | Pantalla < 768px | 1. Abrir la app en mobile | Sidebar colapsa. Menú hamburguesa visible. Click abre sidebar overlay. | P3 | Funcional |
| NAV-012 | Página 403 | Acceso denegado | 1. Ser redirigido a `/sin-acceso` | Página estática con mensaje de acceso denegado. | P3 | Funcional |

---

## 16. Pruebas de Seguridad

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| SEC-001 | Endpoint `/users/profile/:id` sin autenticación | Ninguna | 1. `PATCH /users/profile/:id` sin token con body `{ "first_name": "Hacked" }` | **DEFECTO CONOCIDO**: Este endpoint está marcado como `@Public()`. Verificar si permite modificación sin auth. Reportar como vulnerabilidad. | P1 | Seguridad |
| SEC-002 | Módulos/Sesiones/Materiales CUD sin rol admin | Estudiante autenticado | 1. `POST /courses/:id/modules` con token de estudiante | **DEFECTO CONOCIDO**: No tiene `@Roles` explícito. Verificar si un estudiante puede crear módulos. Reportar como vulnerabilidad. | P1 | Seguridad |
| SEC-003 | Sliders/Promociones CUD sin rol marketing | Estudiante autenticado | 1. `POST /sliders` con token de estudiante | **DEFECTO CONOCIDO**: No tiene `@Roles` (excepto image upload). Verificar acceso no autorizado. | P1 | Seguridad |
| SEC-004 | SQL Injection en búsqueda | Ninguna | 1. En búsqueda de cursos: `'; DROP TABLE courses; --` | Prisma parameteriza queries. No debe haber error SQL ni ejecución maliciosa. | P1 | Seguridad |
| SEC-005 | XSS en campos de texto | Autenticado | 1. En título de curso: `<script>alert('XSS')</script>` 2. Ver en catálogo | Script NO se ejecuta. Texto renderizado como texto plano (React escapa por defecto). | P1 | Seguridad |
| SEC-006 | IDOR en certificados de estudiante | Estudiante A y B existen | 1. Estudiante A intenta `GET /student/certificates/:enrollmentId_de_B` | Error 403. Verificación de userId en el backend. | P1 | Seguridad |
| SEC-007 | Validación de DTOs sin class-validator | Ninguna | 1. `POST /auth/register` con body vacío `{}` | **DEFECTO CONOCIDO**: La mayoría de DTOs no tienen decoradores de validación. Verificar comportamiento con datos faltantes/malformados. | P2 | Seguridad |
| SEC-008 | Rate limiting en login | Ninguna | 1. Enviar 10 requests de login con contraseña incorrecta rápidamente | Debería haber rate limiting o lockout. Verificar si existe (documentación menciona lockout tras 5 intentos por 15 min). | P2 | Seguridad |
| SEC-009 | Acceso a archivos del servidor | Ninguna | 1. `GET /uploads/../../etc/passwd` (path traversal) | Acceso denegado. ServeStaticModule no permite traversal. | P1 | Seguridad |
| SEC-010 | Token JWT manipulado | Ninguna | 1. Modificar payload del JWT (cambiar rol a admin) 2. Enviar request | JWT inválido por firma incorrecta. Error 401. | P1 | Seguridad |
| SEC-011 | Cookies HttpOnly | Login exitoso | 1. En DevTools > Application > Cookies 2. Verificar access_token y refresh_token | Ambas cookies deben ser HttpOnly (no accesibles via JS). | P1 | Seguridad |
| SEC-012 | Console.log en producción | Build de producción | 1. Revisar código backend para `console.log` con datos sensibles | **DEFECTO CONOCIDO**: Existen console.log de tokens y datos sensibles. Limpiar antes de producción. | P2 | Seguridad |
| SEC-013 | Demo code en pagos | Flujo de pago | 1. Verificar si el fallback DEMO en pagos está activo en producción | **DEFECTO CONOCIDO**: Existe lógica de demo que bypass ordenes. Debe desactivarse en prod. | P1 | Seguridad |

---

## 17. Pruebas de Rendimiento

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| PERF-001 | Carga del catálogo con muchos cursos | 100+ cursos publicados | 1. Navegar a `/cursos` 2. Medir tiempo de carga | Página carga en < 3 segundos. Paginación evita cargar todos de una vez. | P2 | Rendimiento |
| PERF-002 | Tracking de video cada 30s | Video reproduciéndose | 1. Monitorear network tab durante 5 min | `PUT /student/progress/sessions/:id` cada ~30s. Sin requests duplicados ni acumulados. | P2 | Rendimiento |
| PERF-003 | Dashboard admin con muchos datos | Miles de órdenes, matrículas y usuarios | 1. Cargar `/panel` 2. Medir tiempo | Gráficos y KPIs cargan en < 5 segundos. Queries optimizadas. | P2 | Rendimiento |
| PERF-004 | Listado con paginación eficiente | Tabla con 1000+ registros | 1. Navegar paginación rápidamente | Sin lag. Cada página carga en < 1 segundo. | P3 | Rendimiento |
| PERF-005 | Subida de imagen grande (cerca del límite) | Archivo de 4.9MB | 1. Subir como thumbnail de curso | Upload completa sin timeout. Feedback visual durante upload. | P3 | Rendimiento |
| PERF-006 | Generación de PDF de certificado | Certificado con template complejo | 1. Click "Descargar PDF" | PDF generado y descargado en < 10 segundos. | P2 | Rendimiento |
| PERF-007 | Polling de notificaciones | Estudiante con sesión activa | 1. Mantener app abierta por 10 min 2. Monitorear network | Polling cada 60s sin degradar rendimiento ni acumular requests. | P3 | Rendimiento |

---

## 18. Pruebas de Integración End-to-End

### 18.1 Flujo completo: Registro → Compra → Estudio → Certificado

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| E2E-001 | Flujo completo del estudiante | Curso publicado con template de certificado, modo auto | 1. Registrar usuario nuevo 2. Verificar email 3. Login 4. Explorar catálogo 5. Agregar curso al carrito 6. Checkout y pagar 7. Ver dashboard con curso matriculado 8. Abrir reproductor 9. Ver todas las sesiones (completar 90% de cada una) 10. Progreso llega a 100% 11. Enviar reseña (5 estrellas, comentario 50+ chars) 12. Certificado auto-generado 13. Descargar PDF 14. Verificar certificado públicamente | Todas las etapas se completan sin errores. Datos consistentes en cada paso. | P1 | Integración |

### 18.2 Flujo completo: Matrícula manual → Notas → Certificado manual

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| E2E-002 | Flujo manual de certificación | Curso con módulos, template asignado, modo manual | 1. Admin crea usuario (estudiante) 2. Soporte crea matrícula manual (método: cortesía) 3. Estudiante accede al curso y estudia 4. Soporte exporta Excel de notas 5. Soporte llena notas en Excel (promedio > 14) 6. Soporte importa Excel 7. Soporte emite certificado tipo "Certificado" 8. Estudiante descarga PDF | Flujo completo sin errores. Notas correctas. Certificado válido y verificable. | P1 | Integración |

### 18.3 Flujo: Carrito guest → Login → Merge → Compra

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| E2E-003 | Merge de carrito guest a usuario | Cursos publicados | 1. Como visitante, agregar 2 cursos al carrito (localStorage) 2. Login como estudiante existente (que ya tiene 1 curso en carrito DB) 3. Verificar merge | Carrito unificado con 3 cursos (sin duplicados). Items del guest migrados a la DB. localStorage limpiado. | P1 | Integración |

### 18.4 Flujo: Marketing crea slider → Visible en homepage

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| E2E-004 | Slider visible en homepage | Ninguna | 1. Marketing crea slider tipo Banner con imagen 2. Activa el slider 3. Visitante abre homepage | Slider aparece en el HeroSlider con imagen, título, subtítulo y botones. | P2 | Integración |

### 18.5 Flujo: Eliminación de matrícula con efectos cascada

| ID | Caso de prueba | Precondición | Pasos | Resultado esperado | Prioridad | Tipo |
|----|---------------|--------------|-------|-------------------|-----------|------|
| E2E-005 | Cascada al eliminar matrícula | Matrícula con progreso, reseña y certificado | 1. Soporte elimina una matrícula 2. Verificar estado del sistema | Matrícula, certificado y reseña eliminados. `enrolled_count` decrementado. `avg_rating` del curso recalculado. Estudiante ya no ve el curso en su dashboard. | P2 | Integración |

---

## Apéndice A: Defectos Conocidos

| ID | Severidad | Descripción | Ubicación |
|----|-----------|-------------|-----------|
| BUG-001 | **Crítica** | `PATCH /users/profile/:id` marcado como `@Public()` — permite actualización de perfil sin autenticación | `users.controller.ts` |
| BUG-002 | **Crítica** | Módulos, Sesiones y Materiales CUD no tienen `@Roles()` — cualquier usuario autenticado (incluso estudiante) puede crear/editar/eliminar contenido | `modules.controller.ts`, `sessions.controller.ts`, `materials.controller.ts` |
| BUG-003 | **Alta** | Sliders y Promociones CUD no tienen `@Roles()` (excepto upload de imagen de slider) — cualquier usuario autenticado puede gestionar marketing | `sliders.controller.ts`, `promotions.controller.ts` |
| BUG-004 | **Alta** | Código DEMO en módulo de pagos que bypasea validación de órdenes | `payments.controller.ts`, `paypal.controller.ts` |
| BUG-005 | **Media** | La mayoría de DTOs no tienen decoradores de class-validator — no hay validación de entrada en el backend | Múltiples DTOs |
| BUG-006 | **Media** | `console.log` con datos potencialmente sensibles en producción | Múltiples archivos |
| BUG-007 | **Media** | Conflicto de merge sin resolver en `student.service.ts` (marcadores `<<<<<<< HEAD`) | `Escuela_global_frontend/src/lib/services/student/student.service.ts` |
| BUG-008 | **Baja** | `position_on_page` en sliders se almacena pero no tiene efecto visual en el frontend | `HeroSlider.tsx` |
| BUG-009 | **Baja** | Tipos de pago en frontend (`PaymentMethod: stripe | niubiz`) no coinciden con implementación real (MercadoPago + PayPal) | `types/index.ts` |
| BUG-010 | **Baja** | Posible conflicto de rutas: dos controllers manejan `POST /payments/paypal/capture/:paypalOrderId` | `payments.controller.ts`, `paypal.controller.ts` |

---

## Apéndice B: Matriz de Roles vs Funcionalidades

| Funcionalidad | Visitante | Estudiante | Soporte | Marketing | Admin |
|---------------|:---------:|:----------:|:-------:|:---------:|:-----:|
| Ver catálogo público | ✅ | ✅ | ✅ | ✅ | ✅ |
| Registrarse / Login | ✅ | — | — | — | — |
| Carrito (localStorage) | ✅ | — | — | — | — |
| Carrito (DB) | — | ✅ | — | — | — |
| Comprar cursos | — | ✅ | — | — | — |
| Ver mis cursos / progreso | — | ✅ | — | — | — |
| Reproductor de video | — | ✅ | — | — | — |
| Enviar reseña | — | ✅ | — | — | — |
| Ver/descargar certificados | — | ✅ | — | — | — |
| Verificar certificado | ✅ | ✅ | ✅ | ✅ | ✅ |
| CRUD cursos | — | — | ✅ | — | ✅ |
| CRUD contenido (módulos/sesiones) | — | — | ✅ | — | ✅ |
| CRUD categorías | — | — | ✅ | — | ✅ |
| Matrículas manuales | — | — | ✅ | — | ✅ |
| Certificaciones manuales | — | — | ✅ | — | ✅ |
| CRUD sliders/promociones | — | — | — | ✅ | ✅ |
| CRUD tipos de evento | — | — | — | ✅ | ✅ |
| Enviar notificaciones | — | — | — | ✅ | ✅ |
| Dashboard admin (KPIs) | — | — | — | — | ✅ |
| Gestión de usuarios | — | — | — | — | ✅ |
| Auditoría | — | — | — | — | ✅ |
| Plantillas de certificados | — | — | ✅ | — | ✅ |
