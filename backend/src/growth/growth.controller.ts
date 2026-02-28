import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { GrowthService } from './growth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateGrowthRecordDto, UpdateGrowthRecordDto } from './growth.dto';

@Controller('children/:childId/growth')
@UseGuards(JwtAuthGuard)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

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
