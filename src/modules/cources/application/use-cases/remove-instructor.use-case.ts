import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class RemoveInstructorUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(courseId: string, instructorId: string) {
		const instructor = await this.prisma.instructor.findFirst({
			where: { id: instructorId, course_id: courseId },
		});

		if (!instructor) {
			throw new NotFoundException("Instructor no encontrado en este curso");
		}

		await this.prisma.instructor.delete({
			where: { id: instructorId },
		});

		return { success: true, message: "Instructor eliminado" };
	}
}
