import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateParticipantDto, BulkImportDto, ParticipantQueryDto } from './dto';
import { randomBytes } from 'crypto';

@Injectable()
export class ParticipantsService {
  constructor(private databaseService: DatabaseService) {}

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  async create(createParticipantDto: CreateParticipantDto) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('participants')
      .insert({
        ...createParticipantDto,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create participant: ${error.message}`);
    }

    return data;
  }

  async bulkImport(bulkImportDto: BulkImportDto) {
    const supabase = this.databaseService.getClient();

    const participantsToInsert = bulkImportDto.participants.map((p) => ({
      study_id: bulkImportDto.study_id,
      ...p,
      status: 'pending',
    }));

    const { data, error } = await supabase
      .from('participants')
      .insert(participantsToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to bulk import participants: ${error.message}`);
    }

    return {
      imported: data?.length || 0,
      participants: data,
    };
  }

  async findAll(organizationId: string, query: ParticipantQueryDto) {
    const supabase = this.databaseService.getClient();

    let queryBuilder = supabase
      .from('participants')
      .select(`
        *,
        study:studies!inner(id, title, organization_id)
      `)
      .eq('study.organization_id', organizationId);

    if (query.study_id) {
      queryBuilder = queryBuilder.eq('study_id', query.study_id);
    }

    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    if (query.search) {
      queryBuilder = queryBuilder.or(
        `email.ilike.%${query.search}%,name.ilike.%${query.search}%`
      );
    }

    queryBuilder = queryBuilder.order('created_at', { ascending: false });

    const { data, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch participants: ${error.message}`);
    }

    return data || [];
  }

  async findOne(organizationId: string, id: string) {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('participants')
      .select(`
        *,
        study:studies!inner(id, title, organization_id)
      `)
      .eq('id', id)
      .eq('study.organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Participant not found');
    }

    return data;
  }

  async remove(organizationId: string, id: string) {
    // First verify the participant belongs to the organization
    await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete participant: ${error.message}`);
    }

    return { message: 'Participant deleted successfully' };
  }

  async sendInvitation(organizationId: string, id: string) {
    // First verify the participant belongs to the organization
    const participant = await this.findOne(organizationId, id);

    const supabase = this.databaseService.getClient();

    // Create or get session for this participant
    let { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('participant_id', id)
      .eq('study_id', participant.study_id)
      .single();

    if (!session) {
      const token = this.generateToken();
      const { data: newSession, error } = await supabase
        .from('sessions')
        .insert({
          study_id: participant.study_id,
          participant_id: id,
          participant_token: token,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }

      session = newSession;
    }

    // Update participant status
    await supabase
      .from('participants')
      .update({ status: 'invited' })
      .eq('id', id);

    // In production, this would send an email with the interview link
    const interviewUrl = `${process.env.FRONTEND_URL}/interview/${session.participant_token}`;

    // TODO: Send email via email service
    console.log(`Sending invitation to ${participant.email}: ${interviewUrl}`);

    return {
      message: 'Invitation sent successfully',
      interviewUrl,
    };
  }
}
