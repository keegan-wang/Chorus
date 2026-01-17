import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AgentsService } from './agents.service';

@Module({
  imports: [HttpModule],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
