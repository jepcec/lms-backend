import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/core/database/prisma.service";

@Injectable()
export class GetSoftwaresUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(): Promise<string[]> {
		const courses = await this.prisma.course.findMany({
			where: {
				deleted_at: null,
				status: "published",
			},
			select: {
				software_tools: true,
			},
		});

		const all = courses.flatMap((c) => c.software_tools);
		return [...new Set(all)].sort((a, b) => a.localeCompare(b));
	}
}
