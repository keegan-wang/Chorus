import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller';
import { InterviewsService} from './interviews.service';
import { InterviewsGateway } from './interviews.gateway';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [AgentsModule],
  controllers: [InterviewsController],
  providers: [InterviewsService, InterviewsGateway],
  exports: [InterviewsService],
})
export class InterviewsModule {}
