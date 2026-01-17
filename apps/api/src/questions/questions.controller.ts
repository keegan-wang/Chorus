import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { QuestionsService } from './questions.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get('study/:studyId')
  @ApiOperation({ summary: 'Get all questions for a study' })
  async findByStudy(@Request() req, @Param('studyId') studyId: string) {
    return this.questionsService.findByStudy(req.user.organizationId, studyId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new question' })
  async create(@Request() req, @Body() createQuestionDto: any) {
    return this.questionsService.create(req.user.organizationId, createQuestionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a question' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.questionsService.remove(req.user.organizationId, id);
  }
}
