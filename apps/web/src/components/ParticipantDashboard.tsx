'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface Assignment {
    id: string;
    invite_status: string;
    created_at: string;
    study: {
        title: string;
    };
}

interface ParticipantDashboardProps {
    participantId: string;
    onBack: () => void;
}

export function ParticipantDashboard({ participantId, onBack }: ParticipantDashboardProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchAssignments() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('study_participant_assignments')
                .select(`
          id,
          invite_status,
          created_at,
          study:studies(title)
        `)
                .eq('participant_id', participantId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching assignments:', error);
            } else {
                // Handle potential array or single object response for relations
                const formattedData = (data || []).map((a: any) => ({
                    ...a,
                    study: Array.isArray(a.study) ? a.study[0] : a.study,
                }));
                setAssignments(formattedData);
            }
            setIsLoading(false);
        }

        if (participantId) {
            fetchAssignments();
        }
    }, [participantId]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'started':
                return 'bg-blue-100 text-blue-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Participant Dashboard</h1>
                    <p className="text-muted-foreground">View participant details and interviews</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Interview Invitations</CardTitle>
                    <CardDescription>All studies this participant has been invited to</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-4">Loading interviews...</div>
                    ) : assignments.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No interviews found for this participant.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left">
                                        <th className="py-3 font-medium">Study</th>
                                        <th className="py-3 font-medium">Status</th>
                                        <th className="py-3 font-medium">Date Invited</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.id} className="border-b last:border-0 hover:bg-muted/50">
                                            <td className="py-3">{assignment.study?.title || 'Unknown Study'}</td>
                                            <td className="py-3">
                                                <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(assignment.invite_status)}`}>
                                                    {assignment.invite_status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-muted-foreground">
                                                {new Date(assignment.created_at).toLocaleDateString()}
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
