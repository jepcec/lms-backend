export class CursoParams {
	page?: number = 1;
	limit?: number = 12;
	search?: string;
	status?: string;
	categoria_id?: string;
	categoria_ids?: string;   // IDs separados por coma para multi-selección
	sort?: string;             // popular | best_rated | recent | price_asc | price_desc
	min_rating?: number;
	softwares?: string;        // nombres separados por coma
	min_price?: number;
	max_price?: number;
	duration?: string;         // '<10' | '10-30' | '>30' (horas)
}
