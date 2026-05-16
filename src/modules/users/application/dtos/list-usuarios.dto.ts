export class ListUsuariosDto {
	page?: number = 1;
	limit?: number = 10;
	search?: string;
	role?: string;
	status?: string;
}
