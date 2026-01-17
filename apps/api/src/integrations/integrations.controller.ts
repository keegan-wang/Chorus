import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('shopify/import')
  @ApiOperation({ summary: 'Import customers from Shopify' })
  async importFromShopify(
    @Request() req,
    @Body() importDto: { studyId: string; storeUrl: string; accessToken: string },
  ) {
    return this.integrationsService.importFromShopify(
      req.user.organizationId,
      importDto,
    );
  }
}
