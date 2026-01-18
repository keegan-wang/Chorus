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
    const configuredUrl =
      this.configService.get<string>('AGENTS_API_URL') || 'http://localhost:8000';
    // Normalize to avoid double /api or /api/agents in requests.
    let normalized = configuredUrl.replace(/\/+$/, '');
    if (normalized.endsWith('/api/agents')) {
      normalized = normalized.slice(0, -'/api/agents'.length);
    } else if (normalized.endsWith('/api')) {
      normalized = normalized.slice(0, -'/api'.length);
    }
    this.agentsBaseUrl = normalized;
  }

  private getAgentErrorMessage(error: unknown, fallback: string): string {
    const axiosError = error as { response?: { data?: any; status?: number } };
    const detail = axiosError?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim().length > 0) {
      return detail;
    }
    if (axiosError?.response?.status) {
      return `${fallback} (status ${axiosError.response.status})`;
    }
    return fallback;
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
      throw new Error(this.getAgentErrorMessage(error, 'Overview generation failed'));
    }
  }

  // Alias for generateStudyReport
  async generateStudyOverview(params: { studyId: string }): Promise<any> {
    return this.generateStudyReport(params.studyId);
  }

  async generateAggregateSummary(params: {
    researchQuestionId: string;
    recompute?: boolean;
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/aggregate-summary`, {
          research_question_id: params.researchQuestionId,
          recompute: params.recompute || false,
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error generating aggregate summary:', error);
      throw new Error(this.getAgentErrorMessage(error, 'Aggregate summary generation failed'));
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

  async selectParticipants(params: {
    studyId: string;
    targetCount: number;
    targetDemographics: any;
    studyContext: any;
  }): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.agentsBaseUrl}/api/agents/participant-selection`, params),
      );
      return response.data;
    } catch (error) {
      console.error('Error selecting participants:', error);
      // Return error info but don't fail the study creation
      return {
        error: error.message,
        selectedParticipants: [],
        totalEvaluated: 0,
      };
    }
  }
}
