import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(private databaseService: DatabaseService) {}

  async validateToken(token: string): Promise<{ userId: string; email: string }> {
    try {
      const supabase = this.databaseService.getClient();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data.user) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        userId: data.user.id,
        email: data.user.email!,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUserOrganization(userId: string): Promise<string | null> {
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.organization_id;
  }
}
