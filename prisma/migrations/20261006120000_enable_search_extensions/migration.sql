-- Extensiones para la búsqueda tolerante (src/core/database/fuzzy-search.ts):
-- unaccent: ignorar tildes ("legislacion" = "legislación"). El catálogo ya usaba
--   unaccent() pero ninguna migración la activaba, y la búsqueda fallaba con error 500.
-- fuzzystrmatch: levenshtein() para aceptar errores de tipeo ("subterraanea", "caza").
-- Ambas vienen incluidas con PostgreSQL (contrib); no requieren instalar nada.
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;
