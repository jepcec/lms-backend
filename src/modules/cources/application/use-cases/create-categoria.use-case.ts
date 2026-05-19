import { Injectable, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateCategoriaDto } from "../dtos/create-categoria.dto";

@Injectable()
export class CreateCategoriaUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(dto: CreateCategoriaDto) {
		const existing = await this.prisma.category.findUnique({
			where: { slug: dto.slug },
		});

		if (existing) {
			throw new ConflictException("Ya existe una categoría con ese slug");
		}

		const maxOrder = await this.prisma.category.aggregate({
			_max: { display_order: true },
		});

		return this.prisma.category.create({
			data: {
				name: dto.name,
				slug: dto.slug,
				icon: dto.icon,
				color: dto.color,
				description: dto.description,
				display_order: dto.display_order ?? (maxOrder._max.display_order ?? 0) + 1,
			},
		});
	}
}
