import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  I_SOFTWARE_REPOSITORY,
  type ISoftwareRepository,
} from '../../domain/softwares.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreateSoftwareDto } from '../dtos/create-software.dto';

@Injectable()
export class CreateSoftwareUseCase {
  constructor(
    @Inject(I_SOFTWARE_REPOSITORY)
    private readonly softwareRepository: ISoftwareRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateSoftwareDto) {
    if (!dto.name) {
      throw new BadRequestException('Se requiere el nombre del software');
    }
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
        folder: 'softwares',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    return this.softwareRepository.create({
      name: dto.name,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
