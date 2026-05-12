import { Module } from "@nestjs/common";
import { I_COURSE_REPOSITORY } from "./domain/courses.repository";
import { I_MODULE_REPOSITORY } from "./domain/modules.repository";
import { I_SESSION_REPOSITORY } from "./domain/sessions.repository";
import { I_MATERIAL_REPOSITORY } from "./domain/materials.repository";
import { PrismaCourseRepository } from "./infrastructure/database/prisma-courses.repository";
import { PrismaModuleRepository } from "./infrastructure/database/prisma-modules.repository";
import { PrismaSessionRepository } from "./infrastructure/database/prisma-sessions.repository";
import { PrismaMaterialRepository } from "./infrastructure/database/prisma-materials.repository";
import { CoursesController } from "./infrastructure/routes/courses.controller";
import { ModulesController } from "./infrastructure/routes/modules.controller";
import { SessionsController } from "./infrastructure/routes/sessions.controller";
import { MaterialsController } from "./infrastructure/routes/materials.controller";
import { PrismaService } from "src/core/database/prisma.service";
import { CreateCourseUseCase } from "./application/use-cases/create-course.use-case";
import { GetCourseUseCase } from "./application/use-cases/get-course.use-case";
import { GetAllCoursesUseCase } from "./application/use-cases/get-all-courses.use-case";
import { UpdateCourseUseCase } from "./application/use-cases/update-course.use-case";
import { DeleteCourseUseCase } from "./application/use-cases/delete-course.use-case";
import { CreateModuleUseCase } from "./application/use-cases/create-module.use-case";
import { UpdateModuleUseCase } from "./application/use-cases/update-module.use-case";
import { DeleteModuleUseCase } from "./application/use-cases/delete-module.use-case";
import { GetModulesUseCase } from "./application/use-cases/get-modules.use-case";
import { CreateSessionUseCase } from "./application/use-cases/create-session.use-case";
import { UpdateSessionUseCase } from "./application/use-cases/update-session.use-case";
import { DeleteSessionUseCase } from "./application/use-cases/delete-session.use-case";
import { GetSessionsUseCase } from "./application/use-cases/get-sessions.use-case";
import { CreateMaterialUseCase } from "./application/use-cases/create-material.use-case";
import { DeleteMaterialUseCase } from "./application/use-cases/delete-material.use-case";
import { GetMaterialsUseCase } from "./application/use-cases/get-materials.use-case";

@Module({
	controllers: [
		CoursesController,
		ModulesController,
		SessionsController,
		MaterialsController,
	],
	providers: [
		PrismaService,
		CreateCourseUseCase,
		GetCourseUseCase,
		GetAllCoursesUseCase,
		UpdateCourseUseCase,
		DeleteCourseUseCase,
		CreateModuleUseCase,
		UpdateModuleUseCase,
		DeleteModuleUseCase,
		GetModulesUseCase,
		CreateSessionUseCase,
		UpdateSessionUseCase,
		DeleteSessionUseCase,
		GetSessionsUseCase,
		CreateMaterialUseCase,
		DeleteMaterialUseCase,
		GetMaterialsUseCase,
		{ provide: I_COURSE_REPOSITORY, useClass: PrismaCourseRepository },
		{ provide: I_MODULE_REPOSITORY, useClass: PrismaModuleRepository },
		{ provide: I_SESSION_REPOSITORY, useClass: PrismaSessionRepository },
		{ provide: I_MATERIAL_REPOSITORY, useClass: PrismaMaterialRepository },
	]
})
export class CoursesModule { }


// session opencode -s ses_1e70bd9e8ffeI3Wc9sFxU75XI6
