'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatNumber } from '@/lib/utils';
import { ParticipantDashboard } from '@/components/ParticipantDashboard';

interface Participant {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  status: string;
  created_at: string;
  study: {
    id: string;
    title: string;
  };
  demographics: {
    age?: number;
    gender?: string;
    location?: string;
  };
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchParticipants() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          email,
          name,
          phone,
          status,
          created_at,
          demographics,
          study:studies(id, title)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching participants:', error);
        setIsLoading(false);
        return;
      }

      const formattedData = (data || []).map((p: any) => ({
        ...p,
        study: Array.isArray(p.study) ? p.study[0] : p.study,
      }));

      setParticipants(formattedData);
      setFilteredParticipants(formattedData);
      setIsLoading(false);
    }

    fetchParticipants();
  }, []);

  useEffect(() => {
    let filtered = participants;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.email.toLowerCase().includes(query) ||
          p.name?.toLowerCase().includes(query) ||
          p.study.title.toLowerCase().includes(query)
      );
    }

    setFilteredParticipants(filtered);
  }, [searchQuery, statusFilter, participants]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'invited':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusCounts = participants.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading participants...</div>
      </div>
    );
  }

  if (selectedParticipantId) {
    return (
      <ParticipantDashboard
        participantId={selectedParticipantId}
        onBack={() => setSelectedParticipantId(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Participants</h1>
        <p className="text-muted-foreground">
          Manage participants across all studies
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Participants</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(participants.length)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(statusCounts.completed || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(statusCounts.in_progress || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl">
              {formatNumber(statusCounts.pending || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-x-4 md:space-y-0">
            <div className="flex-1">
              <Input
                placeholder="Search by email, name, or study..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="invited">Invited</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Participants ({formatNumber(filteredParticipants.length)})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No participants found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="py-3 text-left font-medium">Email</th>
                    <th className="py-3 text-left font-medium">Name</th>
                    <th className="py-3 text-left font-medium">Study</th>
                    <th className="py-3 text-left font-medium">Demographics</th>
                    <th className="py-3 text-left font-medium">Status</th>
                    <th className="py-3 text-left font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((participant) => (
                    <tr
                      key={participant.id}
                      className="border-b hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedParticipantId(participant.id)}
                    >
                      <td className="py-3">{participant.email}</td>
                      <td className="py-3">{participant.name || '-'}</td>
                      <td className="py-3">{participant.study.title}</td>
                      <td className="py-3 text-muted-foreground">
                        {[
                          participant.demographics?.age,
                          participant.demographics?.gender,
                          participant.demographics?.location,
                        ]
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(
                            participant.status
                          )}`}
                        >
                          {participant.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(participant.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
