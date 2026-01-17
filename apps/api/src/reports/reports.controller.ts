import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('study/:studyId')
  @ApiOperation({ summary: 'Get report for a study' })
  async getStudyReport(@Request() req, @Param('studyId') studyId: string) {
    return this.reportsService.getStudyReport(req.user.organizationId, studyId);
  }

  @Post('study/:studyId/generate')
  @ApiOperation({ summary: 'Generate a new report for a study' })
  async generateReport(@Request() req, @Param('studyId') studyId: string) {
    return this.reportsService.generateReport(req.user.organizationId, studyId);
  }
}
