import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InterviewsService } from './interviews.service';
import { AuthGuard } from '../auth/auth.guard';
import { StartInterviewDto, SubmitAnswerDto, SkipQuestionDto } from './dto';

@ApiTags('interviews')
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start an interview session' })
  async start(@Body() startInterviewDto: StartInterviewDto) {
    return this.interviewsService.startInterview(startInterviewDto.sessionId);
  }

  @Post('answer')
  @ApiOperation({ summary: 'Submit an answer to a question' })
  async submitAnswer(@Body() submitAnswerDto: SubmitAnswerDto) {
    return this.interviewsService.submitAnswer(submitAnswerDto);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip a question' })
  async skipQuestion(@Body() skipQuestionDto: SkipQuestionDto) {
    return this.interviewsService.skipQuestion(skipQuestionDto);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get interview session details' })
  async getSession(@Param('sessionId') sessionId: string) {
    return this.interviewsService.getSession(sessionId);
  }

  @Get('session/:sessionId/qa-turns')
  @ApiOperation({ summary: 'Get Q&A turns for a session' })
  async getQATurns(@Param('sessionId') sessionId: string) {
    return this.interviewsService.getQATurns(sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('session/:sessionId/complete')
  @ApiOperation({ summary: 'Mark an interview session as completed' })
  async completeSession(@Request() req, @Param('sessionId') sessionId: string) {
    return this.interviewsService.completeSession(sessionId);
  }
}
