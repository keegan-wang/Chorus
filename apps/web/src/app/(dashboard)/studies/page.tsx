'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { studiesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface Study {
  id: string;
  title: string;
  description: string | null;
  research_intent?: { type?: string; goals?: string };
  status: string;
  target_participant_count: number;
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
      try {
        console.log('[Studies] Fetching studies via API...');

        // Use the API instead of direct Supabase to bypass RLS in dev mode
        const studiesData = await studiesApi.list();

        console.log('[Studies] Found studies:', studiesData?.length || 0);

        // The API returns studies with counts
        const studiesArray = Array.isArray(studiesData) ? studiesData : [];

        setStudies(studiesArray);

      } catch (error) {
        console.error('Error fetching studies:', error);
      } finally {
        setIsLoading(false);
      }
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
