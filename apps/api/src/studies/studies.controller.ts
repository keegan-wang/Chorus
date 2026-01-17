import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudiesService } from './studies.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateStudyDto, UpdateStudyDto, StudyQueryDto } from './dto';

@ApiTags('studies')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('studies')
export class StudiesController {
  constructor(private readonly studiesService: StudiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new study' })
  async create(@Request() req, @Body() createStudyDto: CreateStudyDto) {
    return this.studiesService.create(req.user.organizationId, createStudyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all studies for the organization' })
  async findAll(@Request() req, @Query() query: StudyQueryDto) {
    return this.studiesService.findAll(req.user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a study by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.studiesService.findOne(req.user.organizationId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a study' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateStudyDto: UpdateStudyDto,
  ) {
    return this.studiesService.update(req.user.organizationId, id, updateStudyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a study' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.studiesService.remove(req.user.organizationId, id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get study statistics' })
  async getStats(@Request() req, @Param('id') id: string) {
    return this.studiesService.getStats(req.user.organizationId, id);
  }

  @Post(':id/launch')
  @ApiOperation({ summary: 'Launch a study (change status from draft to active)' })
  async launch(@Request() req, @Param('id') id: string) {
    return this.studiesService.updateStatus(req.user.organizationId, id, 'active');
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pause an active study' })
  async pause(@Request() req, @Param('id') id: string) {
    return this.studiesService.updateStatus(req.user.organizationId, id, 'paused');
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark a study as completed' })
  async complete(@Request() req, @Param('id') id: string) {
    return this.studiesService.updateStatus(req.user.organizationId, id, 'completed');
  }
}
