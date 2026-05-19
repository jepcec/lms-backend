import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class DeleteCategoriaUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(id: string) {
		const existing = await this.prisma.category.findUnique({
			where: { id },
		});

		if (!existing) {
			throw new NotFoundException("Categoría no encontrada");
		}

		await this.prisma.category.delete({
			where: { id },
		});

		return { success: true, message: "Categoría eliminada" };
	}
}
