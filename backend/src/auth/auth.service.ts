import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // 检查用户是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 创建用户和家庭（使用事务确保数据一致性）
    const result = await this.prisma.$transaction(async (tx) => {
      // 创建用户
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          displayName: dto.displayName,
        },
      });

      // 创建家庭
      const family = await tx.family.create({
        data: {
          name: `${dto.displayName || dto.email.split('@')[0]}的家庭`,
        },
      });

      // 创建家庭成员（OWNER）
      await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: user.id,
          role: 'OWNER',
        },
      });

      // 更新用户的 familyId
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { familyId: family.id },
        include: {
          family: true,
        },
      });

      return updatedUser;
    });

    const user = result;

    // 生成 tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // 保存 refresh token
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        familyId: user.familyId,
        family: user.family,
      },
    };
  }

  async login(dto: LoginDto) {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 检查用户状态
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 生成 tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // 保存 refresh token（删除旧的）
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    // 验证 refresh token
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });
    } catch {
      throw new UnauthorizedException('无效的 refresh token');
    }

    // 查找 token 记录
    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        revokedAt: null,
      },
      orderBy: {
        id: 'desc',
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token 不存在');
    }

    // 验证 token hash
    const tokenValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
    if (!tokenValid) {
      throw new UnauthorizedException('无效的 refresh token');
    }

    // 检查是否过期
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token 已过期');
    }

    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    // 生成新的 tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // 撤销旧 token，创建新 token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(tokens.refreshToken, 10),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 天
      },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string) {
    // 撤销所有 refresh tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    return { message: '登出成功' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '30d',
    });

    return { accessToken, refreshToken };
  }
}
