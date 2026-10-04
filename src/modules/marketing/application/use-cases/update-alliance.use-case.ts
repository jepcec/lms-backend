import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  I_ALLIANCE_REPOSITORY,
  type IAllianceRepository,
} from '../../domain/alliances.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import { replaceStoredImage } from '../../../storage/domain/replace-stored-image';
import { UpdateAllianceDto } from '../dtos/update-alliance.dto';

@Injectable()
export class UpdateAllianceUseCase {
  constructor(
    @Inject(I_ALLIANCE_REPOSITORY)
    private readonly allianceRepository: IAllianceRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(id: string, dto: UpdateAllianceDto) {
    const alliance = await this.allianceRepository.findById(id);
    if (!alliance) throw new NotFoundException('Alianza no encontrada');

    const imageUrl = dto.image_url ?? alliance.image_url;
    const imagePublicId = dto.image_public_id ?? alliance.image_public_id;
    const previousPublicId = alliance.image_public_id;

    if (dto.image) {
      return replaceStoredImage(
        this.fileStorageService,
        {
          buffer: dto.image.buffer,
          originalName: dto.image.originalname,
          mimetype: dto.image.mimetype,
          folder: 'alliances',
        },
        previousPublicId,
        (imageUrl, imagePublicId) =>
          this.allianceRepository.update(id, {
            image_url: imageUrl,
            image_public_id: imagePublicId,
            display_order: dto.display_order,
            status: dto.status,
          }),
        { format: 'webp' },
      );
    }

    return this.allianceRepository.update(id, {
      image_url: imageUrl,
      image_public_id: imagePublicId,
      display_order: dto.display_order,
      status: dto.status,
    });
  }
}
