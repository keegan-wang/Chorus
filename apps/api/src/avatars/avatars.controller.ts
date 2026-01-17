import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvatarsService } from './avatars.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('avatars')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('avatars')
export class AvatarsController {
  constructor(private readonly avatarsService: AvatarsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available avatars' })
  async findAll() {
    return this.avatarsService.findAll();
  }
}
