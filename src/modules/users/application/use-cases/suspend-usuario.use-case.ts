import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";

@Injectable()
export class SuspendUsuarioUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(id: string) {
		const user = await this.prisma.user.findUnique({ where: { id } });

		if (!user) {
			throw new NotFoundException("Usuario no encontrado");
		}

		await this.prisma.user.update({
			where: { id },
			data: { status: "suspended" },
		});

		return { message: "Usuario suspendido exitosamente" };
	}
}
