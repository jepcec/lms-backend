import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_UPCOMING_LAUNCH_REPOSITORY,
  type IUpcomingLaunchRepository,
} from '../../domain/upcoming-launches.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { UpdateUpcomingLaunchDto } from '../dtos/update-upcoming-launch.dto';

@Injectable()
export class UpdateUpcomingLaunchUseCase {
  constructor(
    @Inject(I_UPCOMING_LAUNCH_REPOSITORY)
    private readonly launchRepository: IUpcomingLaunchRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateUpcomingLaunchDto) {
    const launch = await this.launchRepository.findById(id);
    if (!launch) throw new NotFoundException('Lanzamiento no encontrado');

    let imageUrl = dto.image_url ?? launch.image_url;
    let imagePublicId = dto.image_public_id ?? launch.image_public_id;
    const previousPublicId = launch.image_public_id;

    if (dto.image) {
      if (previousPublicId) {
        await this.fileStorageService.delete(previousPublicId);
      }
      const result = await this.fileStorageService.upload({
        buffer: dto.image.buffer,
        originalName: dto.image.originalname,
        mimetype: dto.image.mimetype,
        folder: 'upcoming-launches',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
      imagePublicId = result.publicId;
    }

    return this.launchRepository.update(id, {
      category_label: dto.category_label,
      title: dto.title,
      start_date: dto.start_date ? new Date(dto.start_date) : undefined,
      image_url: imageUrl,
      image_public_id: imagePublicId,
      link_url: dto.link_url,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
