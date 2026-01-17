import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateStudyDto, UpdateStudyDto, StudyQueryDto } from './dto';

@Injectable()
export class StudiesService {
  constructor(private databaseService: DatabaseService) {}

  async create(organizationId: string, createStudyDto: CreateStudyDto) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('studies')
      .insert({
        organization_id: organizationId,
        ...createStudyDto,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create study: ${error.message}`);
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

    return data || [];
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
}
