import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';
import { InterviewsGateway } from './interviews.gateway';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule, AuthModule],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewsGateway],
  exports: [InterviewsService],
})
export class InterviewsModule { }
