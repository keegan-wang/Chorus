import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsObject,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ParticipantStatus {
  PENDING = 'pending',
  INVITED = 'invited',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateParticipantDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  study_id: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkImportDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  study_id: string;

  @ApiProperty({ type: [CreateParticipantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: Omit<CreateParticipantDto, 'study_id'>[];
}

export class ParticipantQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  study_id?: string;

  @ApiPropertyOptional({ enum: ParticipantStatus })
  @IsEnum(ParticipantStatus)
  @IsOptional()
  status?: ParticipantStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string;
}
