import { Injectable, NotFoundException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AgentsService } from '../agents/agents.service';
import { CreateStudyDto, UpdateStudyDto, StudyQueryDto } from './dto';

@Injectable()
export class StudiesService {
  constructor(
    private databaseService: DatabaseService,
    private agentsService: AgentsService,
  ) {}

  async create(organizationId: string, createStudyDto: CreateStudyDto, userId?: string) {
    const supabase = this.databaseService.getClient();

    const { questions, ...studyData } = createStudyDto;

    const { data, error } = await supabase
      .from('studies')
      .insert({
        organization_id: organizationId,
        created_by: userId,
        ...studyData,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create study: ${error.message}`);
    }

    // Create questions if provided
    if (questions && questions.length > 0) {
      const questionInserts = questions.map((q, index) => ({
        study_id: data.id,
        text: q.text,
        type: 'open_ended',
        order_index: index,
        is_seed: true,
      }));

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionInserts);

      if (questionsError) {
        console.error('Failed to create questions:', questionsError);
        // Don't fail the whole operation, just log the error
      }
    }

    // Trigger participant selection via LLM agent
    // Run asynchronously in the background, don't wait for completion
    if (studyData.target_participant_count && studyData.target_participant_count > 0) {
      this.agentsService.selectParticipants({
        studyId: data.id,
        targetCount: studyData.target_participant_count || 20,
        targetDemographics: studyData.target_demographics || {},
        studyContext: {
          title: data.title,
          description: data.description,
          type: data.type,
        },
      }).then((result) => {
        console.log(`Participant selection completed for study ${data.id}:`, result);
      }).catch((err) => {
        console.error(`Participant selection failed for study ${data.id}:`, err);
      });
    }

    return data;
  }

  async findAll(organizationId: string, query: StudyQueryDto) {
    const supabase = this.databaseService.getClient();

    let queryBuilder = supabase
      .from('studies')
      .select('*')
      .eq('organization_id', organizationId);

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.type) {
      queryBuilder = queryBuilder.eq('type', query.type);
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    if (query.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder = queryBuilder.range(query.offset, query.offset + (query.limit || 10) - 1);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch studies: ${error.message}`);
    }

    // Add counts for each study
    const studiesWithCounts = await Promise.all(
      (data || []).map(async (study) => {
        const { count: participantCount } = await supabase
          .from('study_participant_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('study_id', study.id);

        const { count: completedCount } = await supabase
          .from('interview_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('study_id', study.id)
          .eq('status', 'completed');

        return {
          ...study,
          _count: {
            participants: participantCount || 0,
            completed: completedCount || 0,
          },
        };
      })
    );

    return studiesWithCounts;
  }

  async findOne(organizationId: string, id: string) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('studies')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Study not found');
    }

    return data;
  }

  async update(organizationId: string, id: string, updateStudyDto: UpdateStudyDto) {
    // First verify the study belongs to the organization
    await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('studies')
      .update(updateStudyDto)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update study: ${error.message}`);
    }

    return data;
  }

  async remove(organizationId: string, id: string) {
    // First verify the study belongs to the organization
    await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    const { error } = await supabase
      .from('studies')
      .delete()
      .eq('id', id)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(`Failed to delete study: ${error.message}`);
    }

    return { message: 'Study deleted successfully' };
  }

  async updateStatus(organizationId: string, id: string, status: string) {
    return this.update(organizationId, id, { status } as UpdateStudyDto);
  }

  async getStats(organizationId: string, id: string) {
    // First verify the study belongs to the organization
    await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    // Get participant count
    const { count: participantCount } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('study_id', id);

    // Get completed interviews count
    const { count: completedCount } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('study_id', id)
      .eq('status', 'completed');

    // Get average duration
    const { data: sessions } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .eq('study_id', id)
      .eq('status', 'completed');

    const avgDuration = sessions && sessions.length > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / sessions.length
        )
      : 0;

    // Get average quality score
    const { data: qualityLabels } = await supabase
      .from('quality_labels')
      .select('overall_score, sessions!inner(study_id)')
      .eq('sessions.study_id', id);

    const avgQuality = qualityLabels && qualityLabels.length > 0
      ? qualityLabels.reduce((acc, q) => acc + q.overall_score, 0) / qualityLabels.length
      : 0;

    return {
      participantCount: participantCount || 0,
      completedCount: completedCount || 0,
      avgDuration,
      avgQuality: Math.round(avgQuality * 10) / 10,
    };
  }

  async analyzeStudy(organizationId: string, id: string) {
    // First verify the study belongs to the organization
    const study = await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    // Generate aggregate summaries for all research questions in parallel
    const { data: researchQuestions } = await supabase
      .from('research_questions')
      .select('id')
      .eq('organization_id', organizationId);

    if (researchQuestions && researchQuestions.length > 0) {
      console.log(`Generating aggregate summaries for ${researchQuestions.length} research questions...`);

      // Generate all aggregate summaries in parallel
      await Promise.all(
        researchQuestions.map((rq) =>
          this.agentsService.generateAggregateSummary({
            researchQuestionId: rq.id,
            recompute: true,
          }).catch((err) => {
            console.error(`Failed to generate aggregate for question ${rq.id}:`, err);
            return null;
          })
        )
      );
    }

    // Call the agents service to generate overview report
    let analysis: any;
    try {
      analysis = await this.agentsService.generateStudyOverview({
        studyId: id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate analysis';
      throw new ServiceUnavailableException(message);
    }

    if (!analysis) {
      throw new ServiceUnavailableException('Agents service failed to generate analysis');
    }

    // Save to database
    // Get the current version number
    const { data: existingReports } = await supabase
      .from('study_reports')
      .select('version')
      .eq('study_id', id)
      .order('version', { ascending: false })
      .limit(1);

    const nextVersion = existingReports && existingReports.length > 0
      ? existingReports[0].version + 1
      : 1;

    const reportData = {
      study_id: id,
      version: nextVersion,
      report_type: 'overview',
      analysis_data: analysis,
      generated_at: new Date().toISOString(),
    };

    const { data: savedReport, error } = await supabase
      .from('study_reports')
      .insert(reportData)
      .select()
      .single();

    if (error) {
      console.error('Failed to save analysis to database:', error);
      // Return the analysis anyway even if saving fails
      return analysis;
    }

    return analysis;
  }

  async getAnalysis(organizationId: string, id: string) {
    // First verify the study belongs to the organization
    await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    // Get the most recent analysis from the database
    const { data, error } = await supabase
      .from('study_reports')
      .select('*')
      .eq('study_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw new Error(`Failed to fetch analysis: ${error.message}`);
    }

    // Also fetch research questions and their aggregate summaries
    const { data: researchQuestions } = await supabase
      .from('research_questions')
      .select(`
        id,
        root_question,
        specific_product,
        research_question_aggregate_summaries (
          id,
          statistics,
          pros,
          cons,
          total_responses_analyzed,
          generated_at
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    // Attach research questions to the analysis
    if (data) {
      return {
        ...data,
        research_questions: researchQuestions || [],
      };
    }

    return data || null;
  }
}
