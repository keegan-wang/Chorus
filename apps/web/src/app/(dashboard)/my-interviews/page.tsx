'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMyAssignments, getOrCreateInviteToken, startInterview } from './actions';

export default function MyInterviewsPage() {
    const router = useRouter();
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [startingInterview, setStartingInterview] = useState<string | null>(null);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }

        const userData = JSON.parse(storedUser);
        setUser(userData);

        // Fetch assignments
        async function loadAssignments() {
            try {
                const result = await getMyAssignments(userData.id);
                if (result.success) {
                    setAssignments(result.assignments);
                }
            } catch (error) {
                console.error('Failed to load assignments:', error);
            } finally {
                setLoading(false);
            }
        }

        loadAssignments();
    }, [router]);

    const handleStartInterview = async (assignmentId: string) => {
        setStartingInterview(assignmentId);
        try {
            const result = await getOrCreateInviteToken(assignmentId, user.id);
            if (result.success && result.inviteToken) {
                router.push(`/interview/${result.inviteToken}`);
            } else {
                alert('Failed to start interview. Please try again.');
            }
        } catch (error) {
            console.error('Error starting interview:', error);
            alert('Failed to start interview. Please try again.');
        } finally {
            setStartingInterview(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            invited: 'bg-blue-100 text-blue-800',
            in_progress: 'bg-purple-100 text-purple-800',
            completed: 'bg-green-100 text-green-800',
            excused: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Loading your interviews...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">My Interviews</h1>
                <p className="text-muted-foreground">
                    Welcome back, {user?.name}! Here are your research interviews.
                </p>
            </div>

            {assignments.length === 0 ? (
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-muted-foreground">
                            No interviews assigned yet. Check back later!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {assignments.map((assignment) => (
                        <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl mb-2">
                                            {assignment.research_questions?.root_question || 'Research Interview'}
                                        </CardTitle>
                                        {assignment.research_questions?.specific_product && (
                                            <CardDescription className="text-sm">
                                                About: {assignment.research_questions.specific_product}
                                            </CardDescription>
                                        )}
                                    </div>
                                    {getStatusBadge(assignment.status)}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-muted-foreground">
                                        <p>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</p>
                                        {assignment.completed_at && (
                                            <p>Completed: {new Date(assignment.completed_at).toLocaleDateString()}</p>
                                        )}
                                    </div>
                                    {assignment.status !== 'completed' && assignment.status !== 'excused' && (
                                        <Button
                                            onClick={async () => {
                                                console.log('[Client] Starting interview for assignment:', assignment.id);
                                                console.log('[Client] User ID:', user.id);
                                                try {
                                                    const result = await startInterview(assignment.id, user.id);
                                                    console.log('[Client] startInterview result:', result);

                                                    if (result.success && result.sessionId) {
                                                        console.log('[Client] Navigating to:', `/interview-simple/${result.sessionId}`);
                                                        router.push(`/interview-simple/${result.sessionId}`);
                                                    } else {
                                                        console.error('[Client] Failed to start interview:', result);
                                                        alert(`Failed to start interview: ${result.error || 'Unknown error'}`);
                                                    }
                                                } catch (error) {
                                                    console.error('[Client] Exception starting interview:', error);
                                                    alert('Failed to start interview. Please try again.');
                                                }
                                            }}
                                        >
                                            {assignment.status === 'in_progress' ? 'Continue' : 'Start Interview'}
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
