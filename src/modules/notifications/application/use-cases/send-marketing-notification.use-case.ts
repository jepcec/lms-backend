import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import {
  I_NOTIFICATION_REPOSITORY,
  type INotificationRepository,
} from '../../domain/notification.repository';
import {
  I_FILE_STORAGE_SERVICE,
  type IFileStorageService,
} from '../../../storage/domain/file-storage.interface';
import type { SendNotificationDto } from '../dtos/marketing-notification.dto';
import type { NotificationEntity } from '../../domain/notification.entity';

@Injectable()
export class SendMarketingNotificationUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(I_NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: INotificationRepository,
    @Inject(I_FILE_STORAGE_SERVICE)
    private readonly fileStorageService: IFileStorageService,
  ) {}

  async execute(
    data: SendNotificationDto,
  ): Promise<{ success: boolean; sent: number }> {
    const { title, body, redirect_url, audience, course_id } = data;

    const userIds = Array.isArray(data.user_ids)
      ? data.user_ids
      : data.user_ids
        ? [data.user_ids]
        : undefined;

    let userIdList: string[] = [];

    switch (audience) {
      case 'all':
        userIdList = await this.getAllActiveStudentIds();
        break;
      case 'course':
        if (!course_id) {
          throw new BadRequestException(
            'course_id is required when audience is "course"',
          );
        }
        userIdList = await this.getEnrolledUserIds(course_id);
        break;
      case 'users':
        if (!userIds || userIds.length === 0) {
          throw new BadRequestException(
            'user_ids are required when audience is "users"',
          );
        }
        userIdList = userIds;
        break;
    }

    if (userIdList.length === 0) {
      return { success: true, sent: 0 };
    }

    let imageUrl: string | undefined;
    if (data.image) {
      const result = await this.fileStorageService.upload({
        buffer: data.image.buffer,
        originalName: data.image.originalname,
        mimetype: data.image.mimetype,
        folder: 'notifications',
      });
      imageUrl = this.fileStorageService.getUrl(result.publicId, {
        format: 'webp',
      });
    }

    const notifications: Partial<NotificationEntity>[] = userIdList.map(
      (user_id) => ({
        user_id,
        type: data.type ?? 'nuevo_curso',
        title,
        body,
        redirect_url,
        image_url: imageUrl,
      }),
    );

    const sent = await this.notificationRepository.createMany(notifications);

    return { success: true, sent };
  }

  private async getAllActiveStudentIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: {
        role: 'estudiante',
        status: 'active',
      },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getEnrolledUserIds(courseId: string): Promise<string[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { course_id: courseId },
      select: { user_id: true },
      distinct: ['user_id'],
    });
    return enrollments.map((e) => e.user_id);
  }
}
