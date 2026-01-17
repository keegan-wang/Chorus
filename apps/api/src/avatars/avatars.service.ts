import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AvatarsService {
  constructor(private databaseService: DatabaseService) {}

  async findAll() {
    const supabase = this.databaseService.getClient();

    const { data, error } = await supabase
      .from('avatars')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch avatars: ${error.message}`);
    }

    return data || [];
  }
}
