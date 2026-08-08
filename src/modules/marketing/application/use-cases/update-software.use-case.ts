import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_SOFTWARE_REPOSITORY,
  type ISoftwareRepository,
} from '../../domain/softwares.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { UpdateSoftwareDto } from '../dtos/update-software.dto';

@Injectable()
export class UpdateSoftwareUseCase {
  constructor(
    @Inject(I_SOFTWARE_REPOSITORY)
    private readonly softwareRepository: ISoftwareRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateSoftwareDto) {
    const software = await this.softwareRepository.findById(id);
    if (!software) throw new NotFoundException('Software no encontrado');

    let imageUrl = dto.image_url ?? software.image_url;
    let imagePublicId = dto.image_public_id ?? software.image_public_id;
    const previousPublicId = software.image_public_id;

    if (dto.image) {
      if (previousPublicId) {
        await this.fileStorageService.delete(previousPublicId);
      }
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

    return this.softwareRepository.update(id, {
      name: dto.name,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
