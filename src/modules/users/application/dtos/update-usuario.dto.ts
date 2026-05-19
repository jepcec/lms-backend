export type UserRole = "estudiante" | "soporte" | "marketing" | "admin";

export class UpdateUsuarioDto {
	first_name?: string;
	last_name?: string;
	email?: string;
	phone?: string;
	country?: string;
	role?: UserRole;
	password?: string;
}
