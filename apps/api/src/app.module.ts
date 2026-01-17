import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudiesModule } from './studies/studies.module';
import { ParticipantsModule } from './participants/participants.module';
import { InterviewsModule } from './interviews/interviews.module';
import { QuestionsModule } from './questions/questions.module';
import { AvatarsModule } from './avatars/avatars.module';
import { ReportsModule } from './reports/reports.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { AgentsModule } from './agents/agents.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    AuthModule,
    StudiesModule,
    ParticipantsModule,
    InterviewsModule,
    QuestionsModule,
    AvatarsModule,
    ReportsModule,
    IntegrationsModule,
    AgentsModule,
  ],
})
export class AppModule {}
