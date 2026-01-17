import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class QuestionsService {
  constructor(private databaseService: DatabaseService) {}

  async findByStudy(organizationId: string, studyId: string) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        study:studies!inner(id, organization_id)
      `)
      .eq('study_id', studyId)
      .eq('study.organization_id', organizationId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
  }

  async create(organizationId: string, createQuestionDto: any) {
    const supabase = this.databaseService.getClient();

    // Verify study belongs to organization
    const { data: study } = await supabase
      .from('studies')
      .select('id')
      .eq('id', createQuestionDto.study_id)
      .eq('organization_id', organizationId)
      .single();

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    const { data, error } = await supabase
      .from('questions')
      .insert(createQuestionDto)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create question: ${error.message}`);
    }

    return data;
  }

  async remove(organizationId: string, id: string) {
    const supabase = this.databaseService.getClient();

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete question: ${error.message}`);
    }

    return { message: 'Question deleted successfully' };
  }
}
