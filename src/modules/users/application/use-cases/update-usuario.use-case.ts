import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { UpdateUsuarioDto } from "../dtos/update-usuario.dto";
import { I_PASSWORD_SERVICE, type IPasswordService } from "../../domain/services/auth.service";

@Injectable()
export class UpdateUsuarioUseCase {
	constructor(
		private readonly prisma: PrismaService,
		@Inject(I_PASSWORD_SERVICE)
		private readonly passwordService: IPasswordService,
	) {}

	async execute(id: string, dto: UpdateUsuarioDto) {
		const existing = await this.prisma.user.findUnique({
			where: { id },
		});

		if (!existing) {
			throw new NotFoundException("Usuario no encontrado");
		}

		const data: Record<string, unknown> = {};

		if (dto.first_name !== undefined) data.first_name = dto.first_name;
		if (dto.last_name !== undefined) data.last_name = dto.last_name;
		if (dto.email !== undefined) data.email = dto.email;
		if (dto.phone !== undefined) data.phone = dto.phone;
		if (dto.country !== undefined) data.country = dto.country;
		if (dto.role !== undefined) data.role = dto.role;
		if (dto.password !== undefined) {
			data.password_hash = await this.passwordService.hash(dto.password);
		}

		const user = await this.prisma.user.update({
			where: { id },
			data,
		});

		return {
			id: user.id,
			first_name: user.first_name,
			last_name: user.last_name,
			email: user.email,
			phone: user.phone,
			country: user.country ?? undefined,
			role: user.role,
			profile_photo_url: user.profile_photo_url ?? undefined,
			email_verified: user.email_verified,
			status: user.status,
			created_by: user.created_by ?? undefined,
			created_at: user.created_at.toISOString(),
			updated_at: user.updated_at.toISOString(),
		};
	}
}
