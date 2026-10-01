import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../src/core/database/prisma.service'
import { StaffMemberEntity } from '../../domain/staff-member.entity';
import { IStaffMemberRepository } from '../../domain/staff-members.repository';
import { ContentStatus } from '../../../../../src/generated/prisma/enums'

@Injectable()
export class PrismaStaffMemberRepository implements IStaffMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Partial<StaffMemberEntity>): Promise<any> {
    return this.prisma.staffMember.create({
      data: {
        full_name: data.full_name,
        title: data.title,
        description: data.description,
        image_url: data.image_url ?? '', // 👈 Garantiza string para Prisma
        image_public_id: data.image_public_id,
        display_order: data.display_order ?? 0,
        status: data.status ?? 'active',
      },
    });
  }

  async update(id: string, data: Partial<StaffMemberEntity>): Promise<any> {
    return this.prisma.staffMember.update({
      where: { id },
      data: {
        ...(data.full_name !== undefined && { full_name: data.full_name }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.image_url && { image_url: data.image_url }),
        ...(data.image_public_id && { image_public_id: data.image_public_id }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.staffMember.delete({ where: { id } });
  }

  async findAll(vigente?: boolean): Promise<any[]> {
    return this.prisma.staffMember.findMany({
      where: vigente ? { status: 'active' } : undefined,
      orderBy: { display_order: 'asc' },
    });
  }

  async findById(id: string): Promise<any | null> {
    return this.prisma.staffMember.findUnique({ where: { id } });
  }
}