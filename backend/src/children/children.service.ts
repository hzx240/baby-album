import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto, UpdateChildDto } from './child.entity';

@Injectable()
export class ChildrenService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createChildDto: CreateChildDto) {
    // 获取用户的家庭
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { family: true },
    });

    if (!user || !user.familyId) {
      throw new ForbiddenException('用户没有家庭');
    }

    return this.prisma.child.create({
      data: {
        familyId: user.familyId,
        name: createChildDto.name,
        avatar: createChildDto.avatar,
        birthDate: createChildDto.birthDate ? new Date(createChildDto.birthDate) : null,
        gender: createChildDto.gender,
      },
    });
  }

  async findAll(familyId: string) {
    return this.prisma.child.findMany({
      where: { familyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, familyId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id },
    });

    if (!child) {
      throw new NotFoundException('孩子不存在');
    }

    if (child.familyId !== familyId) {
      throw new ForbiddenException('无权访问');
    }

    return child;
  }

  async update(id: string, familyId: string, updateChildDto: UpdateChildDto) {
    await this.findOne(id, familyId); // 验证权限

    return this.prisma.child.update({
      where: { id },
      data: {
        name: updateChildDto.name,
        avatar: updateChildDto.avatar,
        birthDate: updateChildDto.birthDate ? new Date(updateChildDto.birthDate) : undefined,
        gender: updateChildDto.gender,
      },
    });
  }

  async remove(id: string, familyId: string) {
    await this.findOne(id, familyId); // 验证权限

    return this.prisma.child.delete({
      where: { id },
    });
  }
}
