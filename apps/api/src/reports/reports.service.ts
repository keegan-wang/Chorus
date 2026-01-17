import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AgentsService } from '../agents/agents.service';

@Injectable()
export class ReportsService {
  constructor(
    private databaseService: DatabaseService,
    private agentsService: AgentsService,
  ) {}

  async getStudyReport(organizationId: string, studyId: string) {
    const supabase = this.databaseService.getClient();

    // Verify study belongs to organization
    const { data: study } = await supabase
      .from('studies')
      .select('id')
      .eq('id', studyId)
      .eq('organization_id', organizationId)
      .single();

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    // Get the latest report
    const { data: report, error } = await supabase
      .from('overview_reports')
      .select('*')
      .eq('study_id', studyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !report) {
      return null;
    }

    return report;
  }

  async generateReport(organizationId: string, studyId: string) {
    const supabase = this.databaseService.getClient();

    // Verify study belongs to organization
    const { data: study } = await supabase
      .from('studies')
      .select('id')
      .eq('id', studyId)
      .eq('organization_id', organizationId)
      .single();

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    // Call Overview Agent to generate the report
    const reportData = await this.agentsService.generateStudyReport(studyId);

    if (!reportData) {
      throw new Error('Failed to generate report');
    }

    // Save the report to database
    const { data: savedReport, error } = await supabase
      .from('overview_reports')
      .insert({
        study_id: studyId,
        ...reportData,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }

    return savedReport;
  }
}
