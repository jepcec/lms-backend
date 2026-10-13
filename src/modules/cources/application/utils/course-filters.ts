import type { PrismaService } from '../../../../core/database/prisma.service';
import { fuzzySearchIds } from '../../../../core/database/fuzzy-search';
import type { CursoParams } from '../dtos/curso-params.dto';

/**
 * Filtros del listado de cursos del panel. Los comparten el listado paginado
 * y las exportaciones (Excel/JSON) para que lo exportado coincida exactamente
 * con lo que el usuario ve filtrado en pantalla.
 */
export async function buildCourseFilterWhere(
  prisma: PrismaService,
  params: CursoParams,
): Promise<Record<string, unknown>> {
  const where: Record<string, unknown> = { deleted_at: null };

  // Búsqueda por texto: tolerante (sin tildes, palabra por palabra, errores de
  // tipeo) en título y tagline; en la descripción, coincidencia literal.
  if (params.search) {
    const ids = await fuzzySearchIds(prisma, 'courses', ['title', 'tagline'], params.search);
    where.OR = [
      { id: { in: ids } },
      { description: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  if (params.status) {
    where.status = params.status;
  }

  // Una o varias categorías (separadas por coma)
  if (params.categoria_ids) {
    const ids = params.categoria_ids
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length > 0) where.category_id = { in: ids };
  } else if (params.categoria_id) {
    where.category_id = params.categoria_id;
  }

  if (params.min_rating) {
    where.avg_rating = { gte: Number(params.min_rating) };
  }

  if (params.min_price || params.max_price) {
    const priceFilter: Record<string, number> = {};
    if (params.min_price) priceFilter.gte = Number(params.min_price);
    if (params.max_price) priceFilter.lte = Number(params.max_price);
    where.price_pen = priceFilter;
  }

  // Duración en horas → minutos
  if (params.duration) {
    if (params.duration === '<10') {
      where.total_duration_minutes = { lt: 600 };
    } else if (params.duration === '10-30') {
      where.total_duration_minutes = { gte: 600, lte: 1800 };
    } else if (params.duration === '>30') {
      where.total_duration_minutes = { gt: 1800 };
    }
  }

  // Softwares: al menos uno coincide
  if (params.softwares) {
    const softwareList = params.softwares
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (softwareList.length > 0) {
      where.software_tools = { hasSome: softwareList };
    }
  }

  return where;
}

const ASC = 'asc' as const;
const DESC = 'desc' as const;

export function buildCourseOrderBy(
  sort?: string,
): Record<string, typeof ASC | typeof DESC> {
  switch (sort) {
    case 'popular':
      return { enrolled_count: DESC };
    case 'best_rated':
      return { avg_rating: DESC };
    case 'price_asc':
      return { price_pen: ASC };
    case 'price_desc':
      return { price_pen: DESC };
    case 'recent':
    default:
      return { created_at: DESC };
  }
}
