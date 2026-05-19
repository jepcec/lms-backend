import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class UploadThumbnailUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(courseId: string, imagePath: string) {
		const course = await this.prisma.course.findUnique({
			where: { id: courseId },
		});

		if (!course) {
			throw new NotFoundException("Curso no encontrado");
		}

		await this.prisma.course.update({
			where: { id: courseId },
			data: { thumbnail_url: imagePath },
		});

		return {
			success: true,
			thumbnail_url: imagePath,
		};
	}
}
