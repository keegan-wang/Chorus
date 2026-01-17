import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AgentsService {
  private agentsBaseUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.agentsBaseUrl =
      this.configService.get<string>('AGENTS_API_URL') || 'http://localhost:8000';
  }

  async getNextQuestion(params: {
    sessionId: string;
    studyId: string;
    seedQuestions: any[];
    conversationHistory: any[];
    participantContext: any;
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/question`, params),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling Question Agent:', error);
      // Fallback: return first seed question
      return params.seedQuestions[0] || { id: 'fallback', text: 'Tell me about your experience.' };
    }
  }

  async scoreQA(params: {
    questionText: string;
    answerText: string;
    studyContext: any;
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/quality`, params),
      );
      return response.data;
    } catch (error) {
      console.error('Error calling Quality Agent:', error);
      // Fallback: return neutral score
      return {
        overall_score: 3,
        relevance_score: 3,
        depth_score: 3,
        clarity_score: 3,
        actionability_score: 3,
        flags: [],
      };
    }
  }

  async transcribeAudio(audioUrl: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/transcribe`, {
          audioUrl,
        }),
      );
      return response.data.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return '[Transcription failed]';
    }
  }

  async generateAvatarVideo(params: {
    avatarId: string;
    text: string;
    voice: any;
  }): Promise<string | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/avatar`, params),
      );
      return response.data.videoUrl;
    } catch (error) {
      console.error('Error generating avatar video:', error);
      return null;
    }
  }

  async generateSessionSummary(sessionId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/summary`, {
          sessionId,
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error generating session summary:', error);
      return null;
    }
  }

  async generateStudyReport(studyId: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/overview`, {
          studyId,
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error generating study report:', error);
      return null;
    }
  }

  async selectAvatar(params: {
    participantDemographics: any;
    studyContext: any;
    availableAvatars: any[];
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/avatar-selection`, params),
      );
      return response.data;
    } catch (error) {
      console.error('Error selecting avatar:', error);
      // Fallback: return first available avatar
      return params.availableAvatars[0] || null;
    }
  }
}
