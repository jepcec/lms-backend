import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class GetCategoriaUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(id: string) {
		const category = await this.prisma.category.findUnique({
			where: { id },
		});

		if (!category) {
			throw new NotFoundException("Categoría no encontrada");
		}

		return category;
	}
}
