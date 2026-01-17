import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StartInterviewDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class SubmitAnswerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  answerText?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  audioUrl?: string;
}

export class SkipQuestionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questionId: string;
}
