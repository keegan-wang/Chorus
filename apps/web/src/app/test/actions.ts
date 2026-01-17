'use server';

import { createClient } from '@supabase/supabase-js';

// We use the Service Role Key here to bypass RLS for testing purposes
// This allows fetching participants and questions without being logged in
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase URL or Service Role Key in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function getTestData() {
    console.log("getTestData: Running...");

    // Decode JWT to verify role (simple base64 check)
    let keyRole = "unknown";
    try {
        if (supabaseServiceKey) {
            const parts = supabaseServiceKey.split('.');
            if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1]));
                keyRole = payload.role;
            }
        }
    } catch (e) {
        keyRole = "parse_error";
    }

    // Debug Info to send to client
    const debugInfo = {
        hasUrl: !!supabaseUrl,
        url: supabaseUrl,
        hasKey: !!supabaseServiceKey,
        keyPrefix: supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + "..." : "MISSING",
        keyRole: keyRole
    };

    if (!supabaseServiceKey) {
        console.error("getTestData Error: Service Role Key is MISSING!");
        return { participants: [], questions: [], error: "Missing Key", debugInfo };
    }

    try {
        // Simple count check
        const { count: pCount, error: pError } = await supabase.from('participants').select('*', { count: 'exact', head: true });
        const { count: qCount, error: qError } = await supabase.from('research_questions').select('*', { count: 'exact', head: true });

        // Fetch Data
        const [participants, questions] = await Promise.all([
            supabase.from('participants').select('id, full_name, email').limit(50),
            supabase.from('research_questions').select('id, root_question').limit(50)
        ]);

        return {
            participants: participants.data || [],
            questions: questions.data || [],
            error: null,
            debugInfo: {
                ...debugInfo,
                pCount,
                pError,
                qCount,
                qError,
                pDataLen: participants.data?.length,
                qDataLen: questions.data?.length
            }
        };
    } catch (error) {
        console.error("Error fetching test data:", error);
        return {
            participants: [],
            questions: [],
            error: String(error),
            debugInfo
        };
    }
}
