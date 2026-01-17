'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/utils';

interface Study {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  target_participants: number;
  created_at: string;
  interview_config: {
    max_follow_ups: number;
    max_questions: number;
    allow_skip: boolean;
  };
}

interface Question {
  id: string;
  text: string;
  type: string;
  order_index: number;
  is_seed: boolean;
}

interface Stats {
  totalParticipants: number;
  completedInterviews: number;
  avgDuration: number;
  avgQualityScore: number;
}

export default function StudyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [study, setStudy] = useState<Study | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalParticipants: 0,
    completedInterviews: 0,
    avgDuration: 0,
    avgQualityScore: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'participants' | 'questions' | 'report'>('overview');

  useEffect(() => {
    async function fetchStudy() {
      const supabase = createClient();
      const studyId = params.id as string;

      // Fetch study details
      const { data: studyData, error: studyError } = await supabase
        .from('studies')
        .select('*')
        .eq('id', studyId)
        .single();

      if (studyError) {
        console.error('Error fetching study:', studyError);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Study not found.',
        });
        router.push('/studies');
        return;
      }

      setStudy(studyData);

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('study_id', studyId)
        .order('order_index', { ascending: true });

      setQuestions(questionsData || []);

      // Fetch stats
      const { count: participantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('study_id', studyId);

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('id, duration_seconds')
        .eq('study_id', studyId)
        .eq('status', 'completed');

      const completedCount = sessionsData?.length || 0;
      const avgDuration =
        completedCount > 0
          ? Math.round(
              sessionsData!.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) /
                completedCount
            )
          : 0;

      // Fetch quality scores
      const { data: qualityData } = await supabase
        .from('quality_labels')
        .select('overall_score, sessions!inner(study_id)')
        .eq('sessions.study_id', studyId);

      const avgQuality =
        qualityData && qualityData.length > 0
          ? qualityData.reduce((acc, q) => acc + q.overall_score, 0) /
            qualityData.length
          : 0;

      setStats({
        totalParticipants: participantCount || 0,
        completedInterviews: completedCount,
        avgDuration,
        avgQualityScore: Math.round(avgQuality * 10) / 10,
      });

      setIsLoading(false);
    }

    fetchStudy();
  }, [params.id, router, toast]);

  async function updateStudyStatus(newStatus: string) {
    if (!study) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('studies')
      .update({ status: newStatus })
      .eq('id', study.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update study status.',
      });
      return;
    }

    setStudy({ ...study, status: newStatus });
    toast({
      title: 'Status updated',
      description: `Study is now ${newStatus}.`,
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading || !study) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading study...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold">{study.title}</h1>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                study.status
              )}`}
            >
              {study.status}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {study.description || 'No description'}
          </p>
        </div>
        <div className="flex space-x-2">
          {study.status === 'draft' && (
            <Button onClick={() => updateStudyStatus('active')}>
              Launch Study
            </Button>
          )}
          {study.status === 'active' && (
            <Button
              variant="outline"
              onClick={() => updateStudyStatus('paused')}
            >
              Pause Study
            </Button>
          )}
          {study.status === 'paused' && (
            <>
              <Button onClick={() => updateStudyStatus('active')}>
                Resume Study
              </Button>
              <Button
                variant="outline"
                onClick={() => updateStudyStatus('completed')}
              >
                Complete Study
              </Button>
            </>
          )}
          <Link href={`/studies/${study.id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(stats.totalParticipants)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Target: {formatNumber(study.target_participants)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed Interviews</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(stats.completedInterviews)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {stats.totalParticipants > 0
                ? Math.round(
                    (stats.completedInterviews / stats.totalParticipants) * 100
                  )
                : 0}
              % completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Interview Duration</CardDescription>
            <CardTitle className="text-3xl">
              {Math.floor(stats.avgDuration / 60)}:{String(stats.avgDuration % 60).padStart(2, '0')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">minutes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Quality Score</CardDescription>
            <CardTitle className="text-3xl">{stats.avgQualityScore}/5</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Response quality rating
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'participants', 'questions', 'report'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-1 py-4 text-sm font-medium capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            )
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Study Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{study.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(study.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Follow-ups</span>
                <span>{study.interview_config?.max_follow_ups || 2}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Questions</span>
                <span>{study.interview_config?.max_questions || 10}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Allow Skip</span>
                <span>{study.interview_config?.allow_skip ? 'Yes' : 'No'}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/studies/${study.id}/participants`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  Manage Participants
                </Button>
              </Link>
              <Link href={`/studies/${study.id}/import`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  Import Participants
                </Button>
              </Link>
              <Link href={`/studies/${study.id}/report`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  View Report
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                Export Data
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'participants' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                {stats.totalParticipants} participants in this study
              </CardDescription>
            </div>
            <Link href={`/studies/${study.id}/import`}>
              <Button>Import Participants</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground py-8">
              Participant list will be shown here.{' '}
              <Link
                href={`/studies/${study.id}/participants`}
                className="text-primary hover:underline"
              >
                View all participants
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'questions' && (
        <Card>
          <CardHeader>
            <CardTitle>Research Questions</CardTitle>
            <CardDescription>
              {questions.length} questions configured for this study
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {questions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No questions configured yet.
              </p>
            ) : (
              questions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex items-start space-x-3 rounded-lg border p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>
                  <div>
                    <p>{question.text}</p>
                    <div className="mt-1 flex space-x-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {question.type.replace('_', ' ')}
                      </span>
                      {question.is_seed && (
                        <span className="rounded bg-blue-100 px-1 text-xs text-blue-800">
                          Seed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'report' && (
        <Card>
          <CardHeader>
            <CardTitle>Research Report</CardTitle>
            <CardDescription>
              AI-generated insights from completed interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.completedInterviews === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Complete some interviews to generate a report.
              </p>
            ) : (
              <div className="text-center py-8">
                <Link href={`/studies/${study.id}/report`}>
                  <Button>View Full Report</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
