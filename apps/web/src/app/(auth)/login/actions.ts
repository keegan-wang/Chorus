'use server';

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase Service Key or URL for Dev Login");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});

export async function getLoginData() {
    console.log('[Server Action] getLoginData called');
    console.log('[Server Action] Supabase URL:', supabaseUrl);
    console.log('[Server Action] Has Service Key:', !!supabaseServiceKey);

    try {
        const [participantsRes, usersRes] = await Promise.all([
            supabase.from('participants').select('id, full_name, email, organization_id'),
            supabase.from('users').select('id, full_name, email, organization_id, role')
        ]);

        console.log('[Server Action] Participants response:', {
            error: participantsRes.error,
            count: participantsRes.data?.length || 0
        });
        console.log('[Server Action] Users response:', {
            error: usersRes.error,
            count: usersRes.data?.length || 0
        });

        if (participantsRes.error) {
            console.error('[Server Action] Participants error:', participantsRes.error);
            throw participantsRes.error;
        }
        if (usersRes.error) {
            console.error('[Server Action] Users error:', usersRes.error);
            throw usersRes.error;
        }

        const result = {
            success: true,
            participants: participantsRes.data || [],
            users: usersRes.data || []
        };

        console.log('[Server Action] Returning:', {
            success: result.success,
            participantsCount: result.participants.length,
            usersCount: result.users.length
        });

        return result;
    } catch (error) {
        console.error("[Server Action] Error fetching login data:", error);
        return {
            success: false,
            participants: [],
            users: [],
            error: error
        };
    }
}
