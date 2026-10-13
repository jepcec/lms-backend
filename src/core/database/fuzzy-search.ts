// Ayudantes de SQL parametrizado (los mismos que expone Prisma.sql/join/raw); se importan del
// runtime y no del cliente generado para que Jest pueda cargar este archivo
import { sqltag as sql, join, raw } from '@prisma/client/runtime/client';
import type { PrismaService } from './prisma.service';

// Búsqueda tolerante (misma lógica que src/lib/search.ts del frontend):
// - ignora tildes y mayúsculas (extensión unaccent)
// - compara palabra por palabra, en cualquier orden y aunque haya palabras en medio
//   ("subterranea diwski" encuentra "Subterránea con Diwski")
// - acepta errores de tipeo (extensión fuzzystrmatch: "subterraanea" ~ "subterránea",
//   "caza" ~ "casa"): 1 letra en palabras de 4–7 letras, 2 en las más largas
// - aparece si coincide al menos la mitad de las palabras buscadas (todas si son 1 o 2,
//   o si se pide `requireAll`, como en nombres de personas)
// Devuelve los ids que coinciden, los más parecidos primero, para filtrar con
// `where.id = { in: ids }` sin cambiar el orden/paginación de cada listado.
// Requiere la migración `enable_search_extensions` (CREATE EXTENSION unaccent, fuzzystrmatch).

type SearchTable = 'courses' | 'users';

const MAX_WORDS = 6;
const MAX_RESULTS = 2000;

function normalize(str: string) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function tokenize(str: string) {
  return normalize(str)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .slice(0, MAX_WORDS);
}

function allowedTypos(word: string) {
  if (word.length <= 3) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

export async function fuzzySearchIds(
  prisma: PrismaService,
  table: SearchTable,
  columns: string[],
  search: string,
  /** Exigir que coincidan todas las palabras (nombres de personas: "juan perez" no debe traer a cualquier Juan) */
  options: { requireAll?: boolean } = {},
): Promise<string[]> {
  const words = tokenize(search);
  if (!words.length) return [];

  // Tabla y columnas vienen del código (nunca del usuario); lo buscado va siempre como parámetro
  const doc = raw(
    `unaccent(lower(concat_ws(' ', ${columns.map((c) => `t."${c}"`).join(', ')})))`,
  );

  // Puntaje por palabra buscada: 3 = igual · 2 = empieza con ella / la contiene · 1 = parecida · 0 = no
  const scores = words.map((q) => {
    const typos = allowedTypos(q);
    return sql`(
      SELECT COALESCE(MAX(CASE
        WHEN w = ${q} THEN 3
        WHEN w LIKE ${q + '%'} OR (${q.length >= 3} AND strpos(w, ${q}) > 0) THEN 2
        WHEN ${typos} > 0 AND (
          levenshtein_less_equal(${q}, w, ${typos}) <= ${typos}
          -- contra el inicio de la palabra (palabras a medio escribir), solo desde 5 letras:
          -- con menos es muy permisivo ("sire" ~ "STREamlit")
          OR (${q.length >= 5} AND levenshtein_less_equal(${q}, left(w, ${q.length}), ${typos}) <= ${typos})
        ) THEN 1
        ELSE 0 END), 0)
      FROM regexp_split_to_table(${doc}, '[^a-z0-9]+') AS w
      WHERE w <> ''
    )`;
  });

  const found = join(
    scores.map((_, i) => raw(`(s${i} > 0)::int`)),
    ' + ',
  );
  const total = join(
    scores.map((_, i) => raw(`s${i}`)),
    ' + ',
  );
  const required = options.requireAll || words.length <= 2 ? words.length : Math.ceil(words.length / 2);

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT t.id, ${join(scores.map((s, i) => sql`${s} AS ${raw(`s${i}`)}`), ', ')}
      FROM ${raw(`"${table}"`)} t
    ) x
    WHERE ${found} >= ${required}
    ORDER BY (${found}) * 10 + ${total} DESC
    LIMIT ${MAX_RESULTS}
  `;
  return rows.map((r) => r.id);
}

/**
 * Condición de Prisma para buscar personas: nombre/apellido/email tolerante + el
 * email literal (pegar un correo exacto sigue funcionando como antes).
 */
export async function userSearchWhere(prisma: PrismaService, search: string) {
  const ids = await fuzzySearchIds(prisma, 'users', ['first_name', 'last_name', 'email'], search, {
    requireAll: true,
  });
  return {
    ids,
    OR: [
      { id: { in: ids } },
      { email: { contains: search.trim(), mode: 'insensitive' as const } },
    ],
  };
}
