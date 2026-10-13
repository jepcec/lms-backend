import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  I_ALLIANCE_REPOSITORY,
  type IAllianceRepository,
} from '../../domain/alliances.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreateAllianceDto } from '../dtos/create-alliance.dto';

@Injectable()
export class CreateAllianceUseCase {
  constructor(
    @Inject(I_ALLIANCE_REPOSITORY)
    private readonly allianceRepository: IAllianceRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateAllianceDto) {
    if (!dto.image && !dto.image_url) {
      throw new BadRequestException('Se requiere una imagen');
    }

    let imageUrl = dto.image_url;
    let imagePublicId = dto.image_public_id;

    if (dto.image) {
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'alliances',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    return this.allianceRepository.create({
      image_url: imageUrl,
      image_public_id: imagePublicId,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
