import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { StaffMemberEntity } from '../../domain/staff-member.entity';
import { IStaffMemberRepository } from '../../domain/staff-members.repository';
import { ContentStatus } from 'src/generated/prisma/enums';

@Injectable()
export class PrismaStaffMemberRepository implements IStaffMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyVigentes = false): Promise<StaffMemberEntity[]> {
    const members = await this.prisma.staffMember.findMany({
      where: onlyVigentes ? { status: ContentStatus.active } : undefined,
      orderBy: { display_order: 'asc' },
    });
    return members.map((m) => new StaffMemberEntity(m));
  }

  async findById(id: string): Promise<StaffMemberEntity | null> {
    const m = await this.prisma.staffMember.findUnique({ where: { id } });
    if (!m) return null;
    return new StaffMemberEntity(m);
  }

  async create(data: Partial<StaffMemberEntity>): Promise<StaffMemberEntity> {
    const count = await this.prisma.staffMember.count();
    const m = await this.prisma.staffMember.create({
      data: {
        image_url: data.image_url!,
        image_public_id: data.image_public_id,
        display_order: data.display_order ?? count + 1,
        status: (data.status as ContentStatus) ?? ContentStatus.active,
      },
    });
    return new StaffMemberEntity(m);
  }

  async update(
    id: string,
    data: Partial<StaffMemberEntity>,
  ): Promise<StaffMemberEntity> {
    const m = await this.prisma.staffMember.update({
      where: { id },
      data: {
        image_url: data.image_url,
        image_public_id: data.image_public_id,
        display_order: data.display_order,
        status: data.status as ContentStatus,
      },
    });
    return new StaffMemberEntity(m);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.staffMember.delete({ where: { id } });
  }
}
