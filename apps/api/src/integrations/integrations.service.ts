import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { DatabaseService } from '../database/database.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class IntegrationsService {
  constructor(
    private httpService: HttpService,
    private databaseService: DatabaseService,
  ) {}

  async importFromShopify(
    organizationId: string,
    importDto: { studyId: string; storeUrl: string; accessToken: string },
  ) {
    const supabase = this.databaseService.getClient();

    // Verify study belongs to organization
    const { data: study } = await supabase
      .from('studies')
      .select('id')
      .eq('id', importDto.studyId)
      .eq('organization_id', organizationId)
      .single();

    if (!study) {
      throw new NotFoundException('Study not found');
    }

    try {
      // Call Shopify API to get customers
      const response = await firstValueFrom(
        this.httpService.get(
          `https://${importDto.storeUrl}/admin/api/2024-01/customers.json`,
          {
            headers: {
              'X-Shopify-Access-Token': importDto.accessToken,
            },
          },
        ),
      );

      const customers = response.data.customers || [];

      // Transform Shopify customers to participants
      const participants = customers.map((customer: any) => ({
        study_id: importDto.studyId,
        email: customer.email,
        name: `${customer.first_name} ${customer.last_name}`.trim(),
        phone: customer.phone,
        demographics: {
          location: customer.default_address?.city || undefined,
        },
        metadata: {
          shopify_id: customer.id,
          orders_count: customer.orders_count,
          total_spent: customer.total_spent,
        },
        status: 'pending',
      }));

      // Insert participants
      const { data, error } = await supabase
        .from('participants')
        .insert(participants)
        .select();

      if (error) {
        throw new Error(`Failed to import participants: ${error.message}`);
      }

      return {
        imported: data?.length || 0,
        participants: data,
      };
    } catch (error) {
      throw new Error(`Shopify import failed: ${error.message}`);
    }
  }
}
