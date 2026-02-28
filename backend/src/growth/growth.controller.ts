import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { GrowthService } from './growth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';

@Controller('children/:childId/growth')
@UseGuards(JwtAuthGuard)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get('export')
  async exportCSV(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
    @Res() res: Response,
  ) {
    const csv = await this.growthService.exportToCSV(childId, familyId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="growth-records-${childId}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importCSV(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('请上传CSV文件');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('只支持CSV文件格式');
    }

    const csvContent = file.buffer.toString('utf-8');
    return this.growthService.importFromCSV(childId, familyId, csvContent);
  }

  @Get('who-standards')
  getWHOStandards(
    @Query('measurementType') measurementType: 'height' | 'weight' | 'headCirc',
    @Query('gender') gender: 'male' | 'female',
    @Query('ageMonths') ageMonths: string,
  ) {
    const ageMonthsNum = parseInt(ageMonths, 10);
    if (isNaN(ageMonthsNum) || ageMonthsNum < 0) {
      throw new BadRequestException('Invalid ageMonths parameter');
    }

    return this.growthService.getWHOStandards(measurementType, gender, ageMonthsNum);
  }

  @Get('milestones')
  getDevelopmentalMilestones(
    @Query('category') category: 'motor' | 'language' | 'social' | 'cognitive',
    @Query('ageMonths') ageMonths: string,
  ) {
    const ageMonthsNum = parseInt(ageMonths, 10);
    if (isNaN(ageMonthsNum) || ageMonthsNum < 0) {
      throw new BadRequestException('Invalid ageMonths parameter');
    }

    if (category) {
      return this.growthService.getDevelopmentalMilestones(category, ageMonthsNum);
    } else {
      return this.growthService.getAllDevelopmentalMilestones(ageMonthsNum);
    }
  }

  @Post()
  create(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
    @Body() createDto: CreateGrowthRecordDto,
  ) {
    return this.growthService.create(childId, familyId, createDto);
  }

  @Get()
  findAll(
    @Param('childId') childId: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.growthService.findAll(childId, familyId);
  }

  @Get(':id')
  findOne(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.growthService.findOne(childId, id, familyId);
  }

  @Put(':id')
  update(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
    @Body() updateDto: UpdateGrowthRecordDto,
  ) {
    return this.growthService.update(childId, id, familyId, updateDto);
  }

  @Delete(':id')
  remove(
    @Param('childId') childId: string,
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
  ) {
    return this.growthService.remove(childId, id, familyId);
  }
}
