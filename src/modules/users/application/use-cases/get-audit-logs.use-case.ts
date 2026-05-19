import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../core/database/prisma.service";
import { AuditLogsQueryDto } from "../dtos/audit-logs-query.dto";

@Injectable()
export class GetAuditLogsUseCase {
	constructor(private readonly prisma: PrismaService) {}

	async execute(params: AuditLogsQueryDto) {
		const page = Number(params.page) || 1;
		const limit = Number(params.limit) || 10;
		const skip = (page - 1) * limit;

		const [data, total] = await Promise.all([
			this.prisma.auditLog.findMany({
				skip,
				take: limit,
				include: {
					user: {
						select: { first_name: true, last_name: true, email: true },
					},
				},
				orderBy: { created_at: "desc" },
			}),
			this.prisma.auditLog.count(),
		]);

		return {
			data: data.map((log) => ({
				id: log.id,
				user_id: log.user_id,
				user: log.user,
				entity_type: log.entity_type,
				entity_id: log.entity_id,
				action: log.action,
				changes: log.changes as Record<string, unknown>,
				created_at: log.created_at.toISOString(),
			})),
			total,
		};
	}
}
