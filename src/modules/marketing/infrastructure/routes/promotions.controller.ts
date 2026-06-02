import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseInterceptors,
	UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Express, Request } from 'express';
import type { FileFilterCallback } from 'multer';
import { CreatePromotionDto } from '../../application/dtos/create-promotion.dto';
import { ReorderPromotionsDto } from '../../application/dtos/reorder-promotions.dto';
import { UpdatePromotionDto } from '../../application/dtos/update-promotion.dto';
import { CreatePromotionUseCase } from '../../application/use-cases/create-promotion.use-case';
import { DeletePromotionUseCase } from '../../application/use-cases/delete-promotion.use-case';
import { GetPromotionsUseCase } from '../../application/use-cases/get-promotions.use-case';
import { ReorderPromotionsUseCase } from '../../application/use-cases/reorder-promotions.use-case';
import { UpdatePromotionUseCase } from '../../application/use-cases/update-promotion.use-case';
import { Public } from 'src/modules/auth/decorators/public.decorator';

const imageFileFilter = (
	_req: Request,
	file: Express.Multer.File,
	callback: FileFilterCallback,
) => {
	if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
		return callback(
			new Error('Only image files are allowed (jpg, jpeg, png, webp)'),
		);
	}
	callback(null, true);
};

@Controller('promociones')
export class PromotionsController {
	constructor(
		private readonly createPromotionUseCase: CreatePromotionUseCase,
		private readonly getPromotionsUseCase: GetPromotionsUseCase,
		private readonly updatePromotionUseCase: UpdatePromotionUseCase,
		private readonly deletePromotionUseCase: DeletePromotionUseCase,
		private readonly reorderPromotionsUseCase: ReorderPromotionsUseCase,
	) {}

	@Public()
	@Get()
	findAll() {
		return this.getPromotionsUseCase.execute();
	}

	@Post()
	@UseInterceptors(
		FileInterceptor('image', {
			storage: memoryStorage(),
			fileFilter: imageFileFilter,
			limits: { fileSize: 5 * 1024 * 1024 },
		}),
	)
	create(
		@Body() dto: CreatePromotionDto,
		@UploadedFile() image?: Express.Multer.File,
	) {
		if (image) {
			dto.image = image;
		}
		return this.createPromotionUseCase.execute(dto);
	}

	@Patch('reorder')
	reorder(@Body() dto: ReorderPromotionsDto) {
		return this.reorderPromotionsUseCase.execute(dto);
	}

	@Patch(':id')
	@UseInterceptors(
		FileInterceptor('image', {
			storage: memoryStorage(),
			fileFilter: imageFileFilter,
			limits: { fileSize: 5 * 1024 * 1024 },
		}),
	)
	update(
		@Param('id') id: string,
		@Body() dto: UpdatePromotionDto,
		@UploadedFile() image?: Express.Multer.File,
	) {
		if (image) {
			dto.image = image;
		}
		return this.updatePromotionUseCase.execute(id, dto);
	}

	@Delete(':id')
	remove(@Param('id') id: string) {
		return this.deletePromotionUseCase.execute(id);
	}
}
