import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsObject,
  IsEnum,
  Min,
  Max,
} from 'class-validator';

export enum StudyType {
  EXPLORATORY = 'exploratory',
  USABILITY = 'usability',
  SATISFACTION = 'satisfaction',
  CUSTOM = 'custom',
}

export enum StudyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export class CreateStudyDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: StudyType })
  @IsEnum(StudyType)
  type: StudyType;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  target_participants: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guardrail_profile_id?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  interview_config?: {
    max_follow_ups?: number;
    max_questions?: number;
    allow_skip?: boolean;
    require_audio_response?: boolean;
  };
}

export class UpdateStudyDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: StudyType })
  @IsEnum(StudyType)
  @IsOptional()
  type?: StudyType;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @IsOptional()
  target_participants?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  guardrail_profile_id?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  interview_config?: {
    max_follow_ups?: number;
    max_questions?: number;
    allow_skip?: boolean;
    require_audio_response?: boolean;
  };

  @ApiPropertyOptional({ enum: StudyStatus })
  @IsEnum(StudyStatus)
  @IsOptional()
  status?: StudyStatus;
}

export class StudyQueryDto {
  @ApiPropertyOptional({ enum: StudyStatus })
  @IsEnum(StudyStatus)
  @IsOptional()
  status?: StudyStatus;

  @ApiPropertyOptional({ enum: StudyType })
  @IsEnum(StudyType)
  @IsOptional()
  type?: StudyType;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number;
}
