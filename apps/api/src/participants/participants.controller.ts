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
import { ParticipantsService } from './participants.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateParticipantDto, BulkImportDto, ParticipantQueryDto } from './dto';

@ApiTags('participants')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('participants')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a single participant' })
  async create(@Body() createParticipantDto: CreateParticipantDto) {
    return this.participantsService.create(createParticipantDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk import participants' })
  async bulkImport(@Body() bulkImportDto: BulkImportDto) {
    return this.participantsService.bulkImport(bulkImportDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants' })
  async findAll(@Request() req, @Query() query: ParticipantQueryDto) {
    return this.participantsService.findAll(req.user.organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a participant by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.participantsService.findOne(req.user.organizationId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a participant' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.participantsService.remove(req.user.organizationId, id);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Send interview invitation to participant' })
  async sendInvitation(@Request() req, @Param('id') id: string) {
    return this.participantsService.sendInvitation(req.user.organizationId, id);
  }
}
