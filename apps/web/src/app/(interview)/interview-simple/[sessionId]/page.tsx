'use client';

import { useParams } from 'next/navigation';
import { RealtimeInterview } from '@/components/RealtimeInterview';

export default function InterviewSimplePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  return <RealtimeInterview sessionId={sessionId} />;
}
