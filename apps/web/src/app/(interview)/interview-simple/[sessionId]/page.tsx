'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Mic, MicOff, Volume2, Send, StopCircle } from 'lucide-react';
import { getInterviewSession, saveQATurn, getResearchQuestionsByStudy } from './actions';

export default function InterviewSimplePage() {
    const params = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [conversationHistory, setConversationHistory] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [researchQuestionId, setResearchQuestionId] = useState<string | null>(null);

    const sessionId = params.sessionId as string;

    // Speak function for TTS
    const speak = (text: string) => {
        if (!isTtsEnabled) return;
        if (typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        async function loadSession() {
            // Use server action to fetch session (bypasses RLS)
            const result = await getInterviewSession(sessionId);

            if (!result.success || !result.session) {
                console.error('Failed to load session:', result.error);
                setLoading(false);
                return;
            }

            const sessionData = result.session;
            setSession(sessionData);

            // Fetch the correct research question ID for this study
            let rqId = null;
            const rqResult = await getResearchQuestionsByStudy(sessionData.study_id);
            if (rqResult.success && rqResult.questions && rqResult.questions.length > 0) {
                rqId = rqResult.questions[0].id;
                setResearchQuestionId(rqId);
                console.log('[Client] Found research question ID:', rqId);
            }

            // Load existing Q&A turns (client-side is OK for qa_turns)
            const supabase = createClient();
            const { data: turns } = await supabase
                .from('qa_turns')
                .select('*')
                .eq('session_id', sessionId)
                .order('created_at', { ascending: true });

            if (turns && turns.length > 0) {
                const history = turns.map(t => ({
                    question: t.question_text,
                    answer: t.answer_transcript
                }));
                setConversationHistory(history);
            }

            // Get first question from Question Agent
            if (!turns || turns.length === 0) {
                await getNextQuestion([], sessionData, rqId);
            } else {
                // Continue from where we left off
                await getNextQuestion(turns.map(t => ({
                    question: t.question_text,
                    answer: t.answer_transcript
                })), sessionData, rqId);
            }

            setLoading(false);
        }

        loadSession();
    }, [sessionId]);

    async function getNextQuestion(history: any[], sessionData?: any, rqId?: string) {
        const currentSession = sessionData || session;
        const currentRqId = rqId || researchQuestionId;

        try {
            console.log('[Client] Calling Question Agent with rqId:', currentRqId);
            // Call Question Agent
            const response = await fetch('http://localhost:8000/api/agents/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId: currentSession?.participant_id,
                    questionId: currentRqId, // Pass the correct research question ID
                    sessionId: sessionId,
                    conversationHistory: history
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get question');
            }

            const data = await response.json();
            const question = data.text || data.question;
            setCurrentQuestion(question);

            // Auto-speak the question
            speak(question);
        } catch (error) {
            console.error('Error getting question:', error);
            // Fallback question
            if (history.length === 0) {
                const fallback = `Tell me about your experience with ${currentSession?.assignment?.study?.title || 'this product'}.`;
                setCurrentQuestion(fallback);
                speak(fallback);
            } else {
                const finish = 'Thank you for your responses. Is there anything else you\'d like to share?';
                setCurrentQuestion(finish);
                speak(finish);
            }
        }
    }

    async function handleStartRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            const chunks: Blob[] = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            recorder.onstop = async () => {
                const audioBlob = new Blob(chunks, { type: 'audio/webm' });
                setIsSubmitting(true);

                try {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'response.webm');

                    const response = await fetch('http://localhost:8000/api/agents/transcribe/upload', {
                        method: 'POST',
                        body: formData
                    });

                    if (!response.ok) throw new Error('Transcription failed');

                    const data = await response.json();
                    setAnswer(data.text);
                } catch (error) {
                    console.error('Transcription error:', error);
                    alert('Failed to transcribe audio. Please try typing your answer.');
                } finally {
                    setIsSubmitting(false);
                }
            };

            recorder.start();
            setMediaRecorder(recorder);
            setIsRecording(true);
        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Could not access microphone');
        }
    }

    async function handleStopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
    }

    async function handleSubmitAnswer() {
        if (!answer.trim() || !session) return;

        setIsSubmitting(true);

        try {
            // Use server action to save turn (bypasses RLS)
            const result = await saveQATurn(
                sessionId,
                currentQuestion,
                answer,
                conversationHistory.length + 1
            );

            if (!result.success) throw new Error(result.error);

            const newHistory = [
                ...conversationHistory,
                { question: currentQuestion, answer: answer }
            ];
            setConversationHistory(newHistory);
            setAnswer('');

            // Check if we should continue (limit to 10 questions for now)
            if (newHistory.length >= 10) {
                setIsCompleted(true);
                // Update session status (use supabase client here or another server action)
                const supabase = createClient();
                await supabase
                    .from('interview_sessions')
                    .update({ status: 'completed', completed_at: new Date().toISOString() })
                    .eq('id', sessionId);
            } else {
                // Get next question
                await getNextQuestion(newHistory);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            alert('Failed to submit answer. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-muted-foreground">Loading interview...</p>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Session Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">This interview session could not be found.</p>
                        <Button onClick={() => router.push('/my-interviews')} className="mt-4">
                            Back to My Interviews
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isCompleted) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Interview Completed!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            Thank you for completing this interview. Your responses have been recorded.
                        </p>
                        <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium">Summary</p>
                            <p className="text-sm text-muted-foreground">
                                Questions answered: {conversationHistory.length}
                            </p>
                        </div>
                        <Button onClick={() => router.push('/my-interviews')} className="w-full">
                            Back to My Interviews
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="border-b bg-background">
                <div className="container flex h-16 items-center justify-between">
                    <div>
                        <h1 className="text-lg font-semibold">
                            {session.assignment?.study?.title || 'Research Interview'}
                        </h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            Question {conversationHistory.length + 1}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                            >
                                <Volume2 className={`h-4 w-4 ${isTtsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex bg-muted p-1 rounded-md">
                            <Button
                                variant={inputMode === 'text' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setInputMode('text')}
                                className="h-7"
                            >
                                Text
                            </Button>
                            <Button
                                variant={inputMode === 'audio' ? 'secondary' : 'ghost'}
                                size="sm"
                                onClick={() => setInputMode('audio')}
                                className="h-7"
                            >
                                Audio
                            </Button>
                        </div>
                        <Button variant="ghost" onClick={() => router.push('/my-interviews')}>
                            Exit
                        </Button>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-xl font-medium">{currentQuestion}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-4 pt-6">
                            {inputMode === 'text' ? (
                                <textarea
                                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Type your answer here..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    disabled={isSubmitting}
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center space-y-4 py-8">
                                    <div className={`h-20 w-20 rounded-full flex items-center justify-center border-4 ${isRecording ? 'border-red-500 animate-pulse' : 'border-muted'}`}>
                                        {isRecording ? <StopCircle className="h-10 w-10 text-red-500" /> : <Mic className="h-10 w-10 text-muted-foreground" />}
                                    </div>
                                    <p className="text-sm font-medium">
                                        {isRecording ? 'Recording...' : 'Click start to record response'}
                                    </p>
                                    {!isRecording ? (
                                        <Button onClick={handleStartRecording} variant="outline">
                                            Start Recording
                                        </Button>
                                    ) : (
                                        <Button onClick={handleStopRecording} variant="destructive">
                                            Stop Recording
                                        </Button>
                                    )}

                                    {answer && !isRecording && (
                                        <div className="w-full p-4 bg-muted rounded-md italic text-sm">
                                            "{answer}"
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setAnswer('')}
                                    disabled={!answer.trim() || isSubmitting || isRecording}
                                >
                                    Clear
                                </Button>
                                <Button
                                    onClick={handleSubmitAnswer}
                                    disabled={!answer.trim() || isSubmitting || isRecording}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Answer'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {conversationHistory.length > 0 && (
                        <div className="text-center text-sm text-muted-foreground">
                            {conversationHistory.length} question{conversationHistory.length !== 1 ? 's' : ''} answered
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
