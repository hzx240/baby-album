import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ChildrenService } from './children.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CreateChildDto, UpdateChildDto } from './child.entity';

@Controller('v1/children')
@UseGuards(JwtAuthGuard)
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Post()
  create(@CurrentUser('userId') userId: string, @Body() createChildDto: CreateChildDto) {
    return this.childrenService.create(userId, createChildDto);
  }

  @Get()
  findAll(@CurrentUser('familyId') familyId: string) {
    return this.childrenService.findAll(familyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.childrenService.findOne(id, familyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('familyId') familyId: string,
    @Body() updateChildDto: UpdateChildDto,
  ) {
    return this.childrenService.update(id, familyId, updateChildDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('familyId') familyId: string) {
    return this.childrenService.remove(id, familyId);
  }
}
