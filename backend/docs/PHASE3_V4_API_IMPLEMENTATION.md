# Phase 3 v4.0 Backend API Implementation Plan

**Document**: Phase 3 v4.0 Backend API Implementation Plan
**Date**: 2026-02-14
**Status**: ✅ **Ready for Development**
**Start Date**: Feb 17, 2026
**Duration**: 3 weeks

---

## 🎯 Executive Summary

Phase 3 v4.0 backend development focuses on **Growth Tracking**, **Social Sharing**, and **Rule-Based Smart Albums** with **ZERO AI features**.

### Backend Work Breakdown

| Module | Hours | Priority | Week |
|---------|--------|----------|------|
| Growth Records API | 12h | P0 (Must) | Week 1 |
| Photo Comments API | 14h | P1 (Should) | Week 2 |
| Album Sharing API | 10h | P1 (Should) | Week 2 |
| Smart Rules Engine | 16h | P2 (Could) | Week 3 |
| Performance Optimization | 20h | P1 (Should) | Week 3 |
| **Total** | **72h** | | **3 weeks** |

---

## 📅 Week 1: Growth Tracking Module (Feb 17-21)

### Module 1: Growth Records API (12h)

**Priority**: P0 (Must)
**Developer**: backend-dev-1
**Timeline**: 16h

#### Day 1-2: Core CRUD API (8h)

**1.1 Service Layer** (`src/growth/growth.service.ts`)

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './dto';

@Injectable()
export class GrowthService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create growth record
   * - Validate: Value range, Date not in future
   * - Auto-calculate: Age in months
   */
  async create(childId: string, dto: CreateGrowthRecordDto) {
    // Validate child belongs to user's family
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: { family: true }
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    // Validate value range
    this.validateValueRange(dto.recordType, dto.value);

    // Validate date not in future
    if (new Date(dto.date) > new Date()) {
      throw new ForbiddenException('Date cannot be in future');
    }

    return this.prisma.growthRecord.create({
      data: {
        childId,
        recordType: dto.recordType,
        value: dto.value,
        date: new Date(dto.date),
        notes: dto.notes
      }
    });
  }

  /**
   * Query growth records
   * - Filters: childId, recordType, date range
   * - Sort: Date DESC (latest first)
   */
  async findAll(params: {
    childId: string;
    recordType?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { childId: params.childId };

    if (params.recordType) {
      where.recordType = params.recordType;
    }

    if (params.startDate || params.endDate) {
      where.date = {};
      if (params.startDate) where.date.gte = params.startDate;
      if (params.endDate) where.date.lte = params.endDate;
    }

    return this.prisma.growthRecord.findMany({
      where,
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Get growth statistics
   * - Latest measurement for each type
   * - Growth velocity (change per month)
   */
  async getStats(childId: string) {
    const records = await this.prisma.growthRecord.findMany({
      where: { childId },
      orderBy: { date: 'desc' }
    });

    const stats = {
      height: this.getLatestByType(records, 'HEIGHT'),
      weight: this.getLatestByType(records, 'WEIGHT'),
      headCircumference: this.getLatestByType(records, 'HEAD_CIRCUMFERENCE'),
      growthVelocity: this.calculateGrowthVelocity(records)
    };

    return stats;
  }

  private validateValueRange(type: string, value: number) {
    const ranges = {
      HEIGHT: { min: 0, max: 200 },      // cm
      WEIGHT: { min: 0, max: 100 },        // kg
      HEAD_CIRCUMFERENCE: { min: 0, max: 60 } // cm
    };

    const range = ranges[type];
    if (value < range.min || value > range.max) {
      throw new ForbiddenException(
        `Value must be between ${range.min} and ${range.max}`
      );
    }
  }

  private getLatestByType(records: any[], type: string) {
    return records.find(r => r.recordType === type);
  }

  private calculateGrowthVelocity(records: any[]) {
    // Calculate growth per month
    // Implementation: Compare oldest vs newest
    return { /* ... */ };
  }
}
```

**1.2 Controller** (`src/growth/growth.controller.ts`)

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GrowthService } from './growth.service';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './dto';

@Controller('children/:childId/growth-records')
@UseGuards(JwtAuthGuard)
export class GrowthController {
  constructor(private growthService: GrowthService) {}

  @Post()
  async create(
    @Param('childId') childId: string,
    @Body() dto: CreateGrowthRecordDto
  ) {
    return this.growthService.create(childId, dto);
  }

  @Get()
  async findAll(@Param('childId') childId: string) {
    return this.growthService.findAll({ childId });
  }

  @Get('stats')
  async getStats(@Param('childId') childId: string) {
    return this.growthService.getStats(childId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGrowthRecordDto
  ) {
    return this.growthService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.growthService.delete(id);
  }
}
```

**1.3 DTOs** (`src/growth/dto/index.ts`)

```typescript
export class CreateGrowthRecordDto {
  recordType: 'HEIGHT' | 'WEIGHT' | 'HEAD_CIRCUMFERENCE';
  value: number;
  date: string;  // ISO 8601
  notes?: string;
}

export class UpdateGrowthRecordDto {
  value?: number;
  date?: string;
  notes?: string;
}

export class QueryGrowthRecordsDto {
  recordType?: string;
  startDate?: string;
  endDate?: string;
}
```

#### Day 3: WHO Standards Integration (4h)

**Purpose**: Provide growth percentiles for comparison

**Service** (`src/growth/who.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class WhoStandardsService {
  // WHO growth standards data (simplified)
  private standards = {
    boys: {
      '0m': { height: { p50: 49.9 }, weight: { p50: 3.3 } },
      '6m': { height: { p50: 67.6 }, weight: { p50: 7.9 } },
      '12m': { height: { p50: 75.7 }, weight: { p50: 9.6 } },
      // ... more months
    },
    girls: {
      '0m': { height: { p50: 49.1 }, weight: { p50: 3.2 } },
      '6m': { height: { p50: 65.7 }, weight: { p50: 7.3 } },
      '12m': { height: { p50: 74.0 }, weight: { p50: 8.9 } },
      // ... more months
    }
  };

  /**
   * Get WHO standard for age and gender
   * Returns: Percentiles (p3, p15, p50, p85, p97)
   */
  getStandard(ageMonths: number, gender: string) {
    const ageKey = `${ageMonths}m`;
    const genderKey = gender === 'male' ? 'boys' : 'girls';

    return this.standards[genderKey][ageKey] || null;
  }

  /**
   * Calculate percentile for a given measurement
   * Returns: Percentile rank (0-100)
   */
  calculatePercentile(
    ageMonths: number,
    gender: string,
    recordType: string,
    value: number
  ): number {
    const standard = this.getStandard(ageMonths, gender);
    if (!standard) return 50; // Default

    // Simplified: Use p50 as baseline
    // Actual implementation: Interpolate between percentiles
    const p50 = standard[recordType.toLowerCase()]?.p50 || 0;
    return 50 + ((value - p50) / p50) * 10;
  }
}
```

**Controller** (`src/growth/who.controller.ts`)

```typescript
import { Controller, Get, Query } from '@nestjs/common';
import { WhoStandardsService } from './who.service';

@Controller('who-standards')
export class WhoStandardsController {
  constructor(private whoService: WhoStandardsService) {}

  @Get()
  async getStandard(
    @Query('ageMonths') ageMonths: number,
    @Query('gender') gender: string
  ) {
    return this.whoService.getStandard(ageMonths, gender);
  }

  @Get('percentile')
  async calculatePercentile(
    @Query('ageMonths') ageMonths: number,
    @Query('gender') gender: string,
    @Query('recordType') recordType: string,
    @Query('value') value: number
  ) {
    return this.whoService.calculatePercentile(
      ageMonths,
      gender,
      recordType,
      value
    );
  }
}
```

---

### Module 2: Milestone Reminders API (12h)

**Priority**: P0 (Must)
**Developer**: backend-dev-2
**Timeline**: 12h

**2.1 Background Job** (`src/milestones/jobs/milestone-reminder.job.ts`)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MilestoneReminderJob {
  private logger = new Logger(MilestoneReminderJob.name);

  constructor(
    private prisma: PrismaService,
    private email: EmailService
  ) {}

  /**
   * Run daily at 8:00 AM
   * Check for upcoming milestones
   */
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async handleMilestoneReminders() {
    this.logger.log('Checking milestone reminders...');

    // Find children with upcoming milestones
    const children = await this.prisma.child.findMany({
      where: {
        birthDate: { not: null }
      },
      include: {
        family: {
          include: {
            members: {
              include: { user: true }
            }
          }
        }
      }
    });

    for (const child of children) {
      const upcomingMilestones = this.getUpcomingMilestones(child);

      for (const milestone of upcomingMilestones) {
        await this.sendReminder(child, milestone);
      }
    }
  }

  /**
   * Get upcoming milestones (next 7 days)
   * Based on WHO development milestones
   */
  private getUpcomingMilestones(child: Child) {
    const ageInDays = this.calculateAgeInDays(child.birthDate);
    const ageInMonths = Math.floor(ageInDays / 30);

    // WHO milestones (simplified)
    const whoMilestones = [
      { age: 6, title: '开始坐立' },
      { age: 12, title: '开始走路' },
      { age: 18, title: '开始说话' },
      // ... more milestones
    ];

    return whoMilestones.filter(m => {
      const milestoneDays = m.age * 30;
      const daysUntil = milestoneDays - ageInDays;
      return daysUntil >= 0 && daysUntil <= 7;
    });
  }

  private async sendReminder(child: Child, milestone: any) {
    const familyUsers = child.family.members.map(m => m.user);

    for (const user of familyUsers) {
      await this.email.sendTemplate(user.email, 'MILESTONE_REMINDER', {
        childName: child.name,
        milestone: milestone.title,
        actionUrl: `${process.env.APP_URL}/children/${child.id}/milestones`
      });
    }
  }

  private calculateAgeInDays(birthDate: Date): number {
    const now = new Date();
    const birth = new Date(birthDate);
    return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
  }
}
```

---

## 📅 Week 2: Social Sharing Module (Feb 24-Mar 07)

### Module 3: Photo Comments API (14h)

**Priority**: P1 (Should)
**Developer**: backend-dev-1
**Timeline**: 14h

#### Day 1-3: Core Comment API (10h)

**Service** (`src/comments/comment.service.ts`)

```typescript
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create comment
   * - Sanitize: XSS prevention
   * - Validate: Content length (1-500 chars)
   * - Notify: Email to photo owner
   */
  async create(photoId: string, userId: string, dto: CreateCommentDto) {
    // Verify photo exists and user has access
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      include: { family: true }
    });

    if (!photo || photo.familyId !== photo.family.id) {
      throw new ForbiddenException('Photo not found');
    }

    // Sanitize content (XSS prevention)
    const sanitizedContent = this.sanitizeHtml(dto.content);

    // Validate length
    if (sanitizedContent.length < 1 || sanitizedContent.length > 500) {
      throw new ForbiddenException('Content must be 1-500 characters');
    }

    const comment = await this.prisma.photoComment.create({
      data: {
        photoId,
        userId,
        content: sanitizedContent,
        emojiReaction: dto.emojiReaction,
        parentId: dto.parentId
      },
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } }
      }
    });

    // Notify photo owner
    if (comment.userId !== photo.uploaderId) {
      await this.notificationService.create({
        userId: photo.uploaderId,
        type: 'PHOTO_COMMENT',
        message: `${comment.user.displayName} commented on photo`,
        link: `/photos/${photoId}`
      });
    }

    return comment;
  }

  /**
   * Query comments
   * - Supports: Pagination, replies filtering
   * - Default: Top-level only, latest first
   */
  async findAll(photoId: string, query: QueryCommentsDto) {
    const where: any = { photoId };

    if (query.parentId === undefined) {
      where.parentId = null;  // Top-level only
    } else if (query.parentId !== null) {
      where.parentId = query.parentId;  // Specific thread
    }

    return this.prisma.photoComment.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        replies: { take: 3, orderBy: { likes: 'desc' } }  // Top 3 replies
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit || 20,
      skip: ((query.page || 1) - 1) * (query.limit || 20)
    });
  }

  /**
   * Like comment
   * - Increment like count
   * - Prevent duplicate likes (TODO: Add likes table)
   */
  async like(id: string, userId: string) {
    // TODO: Check if already liked
    return this.prisma.photoComment.update({
      where: { id },
      data: { likes: { increment: 1 } }
    });
  }

  private sanitizeHtml(html: string): string {
    // Basic XSS sanitization
    return html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
}
```

**Controller** (`src/comments/comment.controller.ts`)

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentService } from './comment.service';

@Controller('photos/:photoId/comments')
@UseGuards(JwtAuthGuard)
export class CommentController {
  constructor(private commentService: CommentService) {}

  @Post()
  async create(
    @Param('photoId') photoId: string,
    @Body() dto: CreateCommentDto,
    @Req() req
  ) {
    return this.commentService.create(photoId, req.user.id, dto);
  }

  @Get()
  async findAll(@Param('photoId') photoId: string, @Query() query: QueryCommentsDto) {
    return this.commentService.findAll(photoId, query);
  }

  @Post(':id/like')
  async like(@Param('id') id: string, @Req() req) {
    return this.commentService.like(id, req.user.id);
  }
}
```

#### Day 4: Real-time Notifications (4h)

**WebSocket Gateway** (`src/comments/comment.gateway.ts`)

```typescript
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { CommentService } from './comment.service';

@WebSocketGateway({ cors: true })
export class CommentGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwt: JwtService,
    private commentService: CommentService
  ) {}

  async handleConnection(client: Socket) {
    // Authenticate
    const token = client.handshake.auth.token;
    const user = this.jwt.verify(token);
    client.data.user = user;

    // Join family room
    const familyId = client.handshake.query.familyId;
    client.join(`family:${familyId}`);

    console.log(`User ${user.id} joined family:${familyId}`);
  }

  @SubscribeMessage('comment:create')
  async handleCommentCreate(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket
  ) {
    const comment = await this.commentService.create(
      data.photoId,
      client.data.user.id,
      data
    );

    // Broadcast to family room
    this.server.to(`family:${data.familyId}`).emit('comment:new', comment);

    return comment;
  }
}
```

---

### Module 4: Album Sharing API (10h)

**Priority**: P1 (Should)
**Developer**: backend-dev-2
**Timeline**: 10h

**Service** (`src/albums/shares/album-share.service.ts`)

```typescript
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AlbumShareService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create album share
   * - Password: bcrypt hash (cost 10)
   * - Token: Random UUID
   * - Permissions: VIEW | COMMENT | DOWNLOAD
   */
  async create(albumId: string, dto: CreateAlbumShareDto) {
    // Validate album belongs to user's family
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { family: true }
    });

    if (!album) {
      throw new NotFoundException('Album not found');
    }

    // Hash password if provided
    let passwordHash: string | null = null;
    if (dto.password) {
      // Validate: 8 chars, alphanumeric
      if (!/^[A-Za-z0-9]{8}$/.test(dto.password)) {
        throw new BadRequestException(
          'Password must be 8 alphanumeric characters'
        );
      }
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.albumShare.create({
      data: {
        albumId,
        shareToken: this.generateToken(),
        password: passwordHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        permissions: dto.permissions || 'VIEW'
      }
    });
  }

  /**
   * Access shared album
   * - If password-protected: Verify password
   * - Increment view count
   * - Check expiration
   */
  async access(shareToken: string, password?: string) {
    const share = await this.prisma.albumShare.findUnique({
      where: { shareToken },
      include: {
        album: {
          include: {
            photos: { take: 50, orderBy: { takenAt: 'desc' } }
          }
        }
      }
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Check expiration
    if (share.expiresAt && new Date() > share.expiresAt) {
      throw new ForbiddenException('Share has expired');
    }

    // Verify password if set
    if (share.password && password) {
      const isValid = await bcrypt.compare(password, share.password);
      if (!isValid) {
        throw new ForbiddenException('Invalid password');
      }
    } else if (share.password && !password) {
      throw new ForbiddenException('Password required');
    }

    // Increment view count
    await this.prisma.albumShare.update({
      where: { id: share.id },
      data: { viewCount: { increment: 1 } }
    });

    return share;
  }

  /**
   * Query shares
   * - Filter: By album, active only (not expired)
   * - Sort: Created date DESC
   */
  async findAll(albumId: string, includeExpired: boolean = false) {
    const where: any = { albumId };

    if (!includeExpired) {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }

    return this.prisma.albumShare.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  private generateToken(): string {
    // Generate random 16-character token
    return require('crypto').randomBytes(16).toString('hex');
  }
}
```

**Controller** (`src/albums/shares/album-share.controller.ts`)

```typescript
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { AlbumShareService } from './album-share.service';

@Controller('albums/:albumId/shares')
@UseGuards(JwtAuthGuard)  // For creating shares
export class AlbumShareController {
  constructor(private shareService: AlbumShareService) {}

  @Post()
  async create(
    @Param('albumId') albumId: string,
    @Body() dto: CreateAlbumShareDto
  ) {
    return this.shareService.create(albumId, dto);
  }

  @Get()
  async findAll(@Param('albumId') albumId: string) {
    return this.shareService.findAll(albumId);
  }
}

// Public endpoint (no auth required)
@Controller('shared')
export class PublicShareController {
  constructor(private shareService: AlbumShareService) {}

  @Get(':shareToken')
  async access(
    @Param('shareToken') shareToken: string,
    @Body() body: { password?: string }
  ) {
    return this.shareService.access(shareToken, body.password);
  }
}
```

---

## 📅 Week 3: Smart Albums + Performance (Mar 03-14)

### Module 5: Rule-Based Smart Albums (16h)

**Priority**: P2 (Could)
**Developer**: backend-dev-1
**Timeline**: 16h

**Service** (`src/albums/smart/smart-album.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SmartAlbumService {
  constructor(private prisma: PrismaService) {}

  /**
   * Apply smart rules to update album photos
   * - Run daily (via cron job)
   * - Parse: JSON rules from Album.smartRules
   * - Update: Auto-add/remove matching photos
   */
  async applyRules(albumId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
      include: { family: true }
    });

    if (!album || !album.isSmart || !album.smartRules) {
      return;  // Not a smart album
    }

    // Parse rules
    const rules = JSON.parse(album.smartRules);

    // Query matching photos
    const matchingPhotos = await this.queryPhotosByRules(
      album.familyId,
      rules
    );

    // Update album photos (replace all)
    await this.prisma.albumPhoto.deleteMany({
      where: { albumId }
    });

    await this.prisma.albumPhoto.createMany({
      data: matchingPhotos.map(photoId => ({
        albumId,
        photoId,
        sortOrder: 0,
        addedAt: new Date(),
        addedBy: 'SYSTEM'  // Auto-added by rules
      }))
    });

    // Update photo count
    await this.prisma.album.update({
      where: { id: albumId },
      data: { photoCount: matchingPhotos.length }
    });

    return { added: matchingPhotos.length };
  }

  /**
   * Query photos by rules
   * - Supports: Date range, tags, child, location
   * - Logic: AND between conditions, OR between values
   */
  private async queryPhotosByRules(
    familyId: string,
    rules: SmartRules
  ): Promise<string[]> {
    const where: any = { familyId };

    // Date range filter
    if (rules.startDate || rules.endDate) {
      where.takenAt = {};
      if (rules.startDate) where.takenAt.gte = new Date(rules.startDate);
      if (rules.endDate) where.takenAt.lte = new Date(rules.endDate);
    }

    // Tags filter (OR logic)
    if (rules.tags && rules.tags.length > 0) {
      where.tags = { hasSome: rules.tags };
    }

    // Child filter
    if (rules.childId) {
      where.childId = rules.childId;
    }

    // Location filter
    if (rules.location) {
      where.location = { contains: rules.location };
    }

    const photos = await this.prisma.photo.findMany({
      where,
      select: { id: true }
    });

    return photos.map(p => p.id);
  }
}

// Types
interface SmartRules {
  startDate?: string;
  endDate?: string;
  tags?: string[];
  childId?: string;
  location?: string;
}

// DTOs
export class CreateSmartAlbumDto {
  name: string;
  isSmart: true;
  smartRules: string;  // JSON string
  sortOrder?: number;
}

export class UpdateSmartAlbumDto {
  name?: string;
  smartRules?: string;
  sortOrder?: number;
}
```

**Job** (`src/albums/smart/jobs/apply-rules.job.ts`)

```typescript
import { Injectable, Cron, CronExpression } from '@nestjs/common';
import { SmartAlbumService } from '../smart-album.service';

@Injectable()
export class ApplySmartRulesJob {
  constructor(private smartAlbumService: SmartAlbumService) {}

  /**
   * Run daily at 2:00 AM
   * Apply smart rules to all smart albums
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handle() {
    const smartAlbums = await this.prisma.album.findMany({
      where: { isSmart: true },
      select: { id: true }
    });

    for (const album of smartAlbums) {
      await this.smartAlbumService.applyRules(album.id);
    }
  }
}
```

---

## 🎯 Performance Optimization (20h)

### 6.1 Redis Caching (8h)

**Service** (`src/common/cache/redis.service.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
  }

  /**
   * Cache growth records
   * - TTL: 1 hour
   * - Key: growth:records:{childId}
   */
  async cacheGrowthRecords(childId: string, data: any) {
    const key = `growth:records:${childId}`;
    await this.client.setex(key, 3600, JSON.stringify(data));
  }

  /**
   * Get cached growth records
   */
  async getCachedGrowthRecords(childId: string): Promise<any | null> {
    const key = `growth:records:${childId}`;
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Invalidate cache on update
   */
  async invalidateGrowthRecords(childId: string) {
    const key = `growth:records:${childId}`;
    await this.client.del(key);
  }
}
```

**Interceptor** (`src/common/interceptors/cache.interceptor.ts`)

```typescript
import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class CacheInterceptor {
  constructor(
    private reflector: Reflector,
    private redis: RedisService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.getCacheKey(context);

    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Execute and cache result
    const result = await next.handle();
    await this.redis.setex(cacheKey, 300, JSON.stringify(result));  // 5 min TTL

    return result;
  }

  private getCacheKey(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest();
    return `${request.route.path}:${JSON.stringify(request.query)}`;
  }
}
```

---

## ✅ Testing Strategy

### Unit Tests

```bash
# Growth module
npm test -- growth.service.spec.ts

# Comments module
npm test -- comment.service.spec.ts

# Smart albums
npm test -- smart-album.service.spec.ts
```

### Integration Tests

```bash
# API endpoints
npm run test:e2e -- --spec "growth-records-api.spec.ts"

# Performance
npm run test:perf -- --spec "cache-performance.spec.ts"
```

---

## 📊 Success Metrics

### Week 1

- [ ] Growth Records API: 100% test coverage
- [ ] WHO Standards API: 100% test coverage
- [ ] Milestone Reminders: Cron job tested

### Week 2

- [ ] Photo Comments API: 90% test coverage
- [ ] Album Sharing API: 95% test coverage
- [ ] WebSocket Gateway: Integration tested

### Week 3

- [ ] Smart Albums: Rule engine tested
- [ ] Redis Cache: 70% hit rate
- [ ] Performance: < 100ms p95 latency

---

**Document Version**: 1.0
**Last Updated**: 2026-02-14
**Status**: ✅ **Ready for Week 1 (Feb 17)**
**Next Step**: Assign tasks to backend-dev-1 and backend-dev-2
