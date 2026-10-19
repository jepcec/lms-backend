// Ayudantes de SQL parametrizado (los mismos que expone Prisma.sql/join/raw); se importan del
// runtime y no del cliente generado para que Jest pueda cargar este archivo
import { sqltag as sql, join, raw } from '@prisma/client/runtime/client';
import type { PrismaService } from './prisma.service';

// Búsqueda tolerante (misma lógica que src/lib/search.ts del frontend):
// - ignora tildes y mayúsculas (extensión unaccent)
// - compara palabra por palabra, en cualquier orden y aunque haya palabras en medio
//   ("subterranea deswik" encuentra "Subterránea con Deswik")
// - acepta errores de tipeo (extensión fuzzystrmatch): 1 letra en palabras de 4–7
//   letras, 2 en las más largas; en códigos ("CD260408", palabras con números) solo 1
// - ordena por exactitud: igual > empieza igual > contiene > parecida, y lo que
//   coincide con la primera palabra (el código del curso) pesa más
// - letras sueltas ("I", "Y") se ignoran si hay más palabras
// - si se busca un código, tiene que coincidir; si no, basta la mitad de las palabras
//   (todas si son 1 o 2, o con `requireAll`, como en nombres de personas)
// Devuelve los ids que coinciden, los más parecidos primero.
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

/** Códigos de curso: palabras con números */
function isCode(word: string) {
  return /\d/.test(word);
}

function allowedTypos(word: string) {
  if (word.length <= 3) return 0;
  if (isCode(word)) return 1;
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
  let words = tokenize(search);
  if (words.length > 1) words = words.filter((w) => w.length > 1);
  if (!words.length) return [];

  // Tabla y columnas vienen del código (nunca del usuario); lo buscado va siempre como parámetro
  const doc = raw(
    `unaccent(lower(concat_ws(' ', ${columns.map((c) => `t."${c}"`).join(', ')})))`,
  );

  // Puntaje por palabra buscada: 100 igual · 80–95 empieza igual · 60 contiene ·
  // 30/20 parecida con 1/2 errores · 15 parecida al inicio · +50 si es la primera palabra (código)
  const scores = words.map((q) => {
    const typos = allowedTypos(q);
    const prefixTypo = q.length >= 5 && !isCode(q);
    return sql`(
      SELECT COALESCE(MAX(sc + CASE WHEN pos = 1 AND sc > 0 THEN 50 ELSE 0 END), 0)
      FROM (
        SELECT pos, CASE
          WHEN w = ${q} THEN 100
          WHEN w LIKE ${q + '%'} THEN 80 + round(15.0 * ${q.length} / length(w))
          WHEN ${q.length >= 3} AND strpos(w, ${q}) > 0 THEN 60
          WHEN ${typos} > 0 AND levenshtein_less_equal(${q}, w, ${typos}) <= ${typos}
            THEN 40 - 10 * levenshtein_less_equal(${q}, w, ${typos})
          -- contra el inicio de la palabra (a medio escribir), solo en palabras de 5+ letras
          -- que no sean códigos: si no, es muy permisivo ("sire" ~ "STREamlit")
          WHEN ${prefixTypo} AND length(w) > ${q.length}
            AND levenshtein_less_equal(${q}, left(w, ${q.length}), ${typos}) <= ${typos} THEN 15
          ELSE 0 END AS sc
        FROM regexp_split_to_table(${doc}, '[^a-z0-9]+') WITH ORDINALITY AS t2(w, pos)
        WHERE w <> ''
      ) z
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

  // Con código: todos los códigos buscados tienen que coincidir. Sin código: mitad / todas.
  const codeIdx = words.map((w, i) => (isCode(w) ? i : -1)).filter((i) => i >= 0);
  const required = options.requireAll || words.length <= 2 ? words.length : Math.ceil(words.length / 2);
  const condition = codeIdx.length
    ? raw(codeIdx.map((i) => `s${i} > 0`).join(' AND '))
    : sql`${found} >= ${required}`;

  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM (
      SELECT t.id, ${join(scores.map((s, i) => sql`${s} AS ${raw(`s${i}`)}`), ', ')}
      FROM ${raw(`"${table}"`)} t
    ) x
    WHERE ${condition}
    ORDER BY (${found}) * 1000 + ${total} DESC
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
