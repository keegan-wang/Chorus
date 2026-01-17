'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface Study {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  target_participants: number;
  created_at: string;
  _count?: {
    participants: number;
    completed: number;
  };
}

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStudies() {
      const supabase = createClient();

      const { data: studiesData, error } = await supabase
        .from('studies')
        .select(`
          id,
          title,
          description,
          type,
          status,
          target_participants,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching studies:', error);
        setIsLoading(false);
        return;
      }

      // Fetch participant counts for each study
      const studiesWithCounts = await Promise.all(
        (studiesData || []).map(async (study) => {
          const { count: participantCount } = await supabase
            .from('participants')
            .select('*', { count: 'exact', head: true })
            .eq('study_id', study.id);

          const { count: completedCount } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('study_id', study.id)
            .eq('status', 'completed');

          return {
            ...study,
            _count: {
              participants: participantCount || 0,
              completed: completedCount || 0,
            },
          };
        })
      );

      setStudies(studiesWithCounts);
      setIsLoading(false);
    }

    fetchStudies();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading studies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Studies</h1>
          <p className="text-muted-foreground">
            Manage your research studies and view results
          </p>
        </div>
        <Link href="/studies/new">
          <Button>Create Study</Button>
        </Link>
      </div>

      {/* Studies Grid */}
      {studies.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CardHeader className="text-center">
            <CardTitle>No studies yet</CardTitle>
            <CardDescription>
              Create your first study to start collecting customer insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/studies/new">
              <Button>Create Your First Study</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {studies.map((study) => (
            <Link key={study.id} href={`/studies/${study.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="line-clamp-1">{study.title}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                        study.status
                      )}`}
                    >
                      {study.status}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {study.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">
                        {formatNumber(study._count?.participants || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Participants</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {formatNumber(study._count?.completed || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {study._count?.participants
                          ? Math.round(
                              ((study._count?.completed || 0) /
                                study._count.participants) *
                                100
                            )
                          : 0}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground">Rate</div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-muted-foreground">
                    Created {new Date(study.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
