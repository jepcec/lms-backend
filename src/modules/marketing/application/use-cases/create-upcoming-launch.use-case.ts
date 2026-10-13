import { Inject, Injectable } from '@nestjs/common';
import {
  I_UPCOMING_LAUNCH_REPOSITORY,
  type IUpcomingLaunchRepository,
} from '../../domain/upcoming-launches.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { CreateUpcomingLaunchDto } from '../dtos/create-upcoming-launch.dto';

@Injectable()
export class CreateUpcomingLaunchUseCase {
  constructor(
    @Inject(I_UPCOMING_LAUNCH_REPOSITORY)
    private readonly launchRepository: IUpcomingLaunchRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(dto: CreateUpcomingLaunchDto) {
    let imageUrl = dto.image_url;
    let imagePublicId = dto.image_public_id;

    if (dto.image) {
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

    return this.launchRepository.create({
      category_label: dto.category_label,
      title: dto.title,
      start_date: new Date(dto.start_date),
      image_url: imageUrl,
      image_public_id: imagePublicId,
      link_url: dto.link_url,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
