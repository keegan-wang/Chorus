'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RealtimeInterview } from '@/components/RealtimeInterview';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function InterviewPage() {
  const params = useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient();

      try {
        // Fetch assignment by invite token
        const { data: assignmentData, error: assignmentError } = await supabase
          .from('study_participant_assignments')
          .select(`
            id,
            avatar_id,
            study:studies!inner(id, title),
            participant:participants!inner(id)
          `)
          .eq('invite_token', token)
          .single();

        if (assignmentError || !assignmentData) {
          setError('This interview link is not valid or has expired.');
          setIsLoading(false);
          return;
        }

        const assignment = assignmentData as any;

        // Check for existing session
        const { data: existingSession } = await supabase
          .from('interview_sessions')
          .select('id')
          .eq('assignment_id', assignment.id)
          .single();

        if (existingSession) {
          setSessionId(existingSession.id);
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('interview_sessions')
            .insert({
              assignment_id: assignment.id,
              study_id: assignment.study.id,
              participant_id: assignment.participant.id,
              avatar_id: assignment.avatar_id,
              status: 'initialized',
            })
            .select('id')
            .single();

          if (createError || !newSession) {
            setError('Failed to create interview session.');
            setIsLoading(false);
            return;
          }

          setSessionId(newSession.id);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('An unexpected error occurred.');
        setIsLoading(false);
      }
    }

    loadSession();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading interview...</div>
      </div>
    );
  }

  if (error || !sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid Interview Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || 'This interview link is not valid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <RealtimeInterview sessionId={sessionId} />;
}
