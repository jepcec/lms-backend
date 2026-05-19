export class CreateCategoriaDto {
	name: string;
	slug: string;
	icon: string;
	color: string;
	description?: string;
	display_order?: number;
}
