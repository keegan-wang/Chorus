'use client';

import { useState, useEffect } from 'react';
import { getTestData } from './actions';

// Types
interface Participant {
    id: string;
    full_name: string;
    email: string;
}

interface ResearchQuestion {
    id: string;
    root_question: string;
}

interface ChatTurn {
    id: string;
    role: 'agent' | 'user';
    text: string;
    payload?: any;
}

export default function TestAgentPage() {
    // const supabase = createClient();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [questions, setQuestions] = useState<ResearchQuestion[]>([]);

    const [selectedParticipant, setSelectedParticipant] = useState<string>('');
    const [selectedQuestion, setSelectedQuestion] = useState<string>('');
    const [sessionId, setSessionId] = useState<string>('');

    const [history, setHistory] = useState<ChatTurn[]>([]);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [studyId] = useState(crypto.randomUUID()); // Mock Study ID

    // Load Initial Data
    useEffect(() => {
        const fetchData = async () => {
            console.log("Client: Fetching test data...");
            try {
                const { participants, questions, error } = await getTestData();
                console.log("Client: Received data", { participants, questions, error });

                if (error) {
                    console.error("Client: Failed to load data:", error);
                    return;
                }

                if (participants) {
                    console.log(`Client: Setting ${participants.length} participants`);
                    setParticipants(participants);
                }
                if (questions) {
                    console.log(`Client: Setting ${questions.length} questions`);
                    setQuestions(questions);
                }

                setSessionId(crypto.randomUUID());
            } catch (err) {
                console.error("Client: Critical error in fetchData", err);
            }
        };
        fetchData();
    }, []);

    const addToHistory = (role: 'agent' | 'user', text: string) => {
        setHistory(prev => [...prev, { id: crypto.randomUUID(), role, text }]);
    };

    const generateNextQuestion = async (existingHistory: any[]) => {
        if (!selectedParticipant || !selectedQuestion) {
            alert("Select a participant and a question first.");
            return;
        }

        setLoading(true);
        try {
            // Format history for API
            // API expects: List[ConversationTurn] where ConversationTurn = { question: str, answer: str }
            // We need to pair them up.
            const conversationHistory = [];
            for (let i = 0; i < existingHistory.length; i += 2) {
                if (existingHistory[i].role === 'agent' && existingHistory[i + 1]?.role === 'user') {
                    conversationHistory.push({
                        question: existingHistory[i].text,
                        answer: existingHistory[i + 1].text
                    });
                }
            }

            const res = await fetch('http://localhost:8000/api/agents/question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: sessionId,
                    studyId: studyId,
                    questionId: selectedQuestion,
                    participantId: selectedParticipant,
                    conversationHistory: conversationHistory
                })
            });

            const data = await res.json();
            if (data.text) {
                addToHistory('agent', data.text);
            } else {
                console.error("No text in response", data);
            }
        } catch (e) {
            console.error(e);
            alert("Error generating question");
        } finally {
            setLoading(false);
        }
    };

    const handleStart = () => {
        generateNextQuestion([]);
    };

    const handleReply = () => {
        if (!userInput.trim()) return;

        // Add user reply locally
        const newTurn: ChatTurn = { id: crypto.randomUUID(), role: 'user', text: userInput };
        setHistory(prev => [...prev, newTurn]);
        setUserInput('');

        // Immediately trigger next agent question with updated history
        // We pass the new history including this turn to the function
        const updatedHistory = [...history, newTurn];
        generateNextQuestion(updatedHistory);
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Debug Banner */}
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    <strong className="font-bold">Debug Mode Active:</strong>
                    <span className="block sm:inline"> Checking database connection... (If you see this, HMR is working)</span>
                    <div className="text-xs mt-1">
                        Participants Found: {participants.length} | Questions Found: {questions.length}
                    </div>
                </div>

                {/* Header Config */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold mb-4">Agent Playground</h1>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Participant</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={selectedParticipant}
                                onChange={e => setSelectedParticipant(e.target.value)}
                            >
                                <option value="">Select Participant...</option>
                                {participants.map(p => (
                                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Root Research Question</label>
                            <select
                                className="w-full p-2 border rounded-md"
                                value={selectedQuestion}
                                onChange={e => setSelectedQuestion(e.target.value)}
                            >
                                <option value="">Select Question...</option>
                                {questions.map(q => (
                                    <option key={q.id} value={q.id}>{q.root_question}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {history.length === 0 && (
                        <button
                            onClick={handleStart}
                            disabled={!selectedParticipant || !selectedQuestion || loading}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
                        >
                            {loading ? 'Starting...' : 'Start Interview'}
                        </button>
                    )}

                    <div className="mt-2 text-xs text-gray-500">Session ID: {sessionId}</div>
                </div>

                {/* Chat Interface */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex flex-col">
                    <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[600px]">
                        {history.map(turn => (
                            <div key={turn.id} className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-4 rounded-lg ${turn.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                    }`}>
                                    <div className="text-xs opacity-70 mb-1 uppercase tracking-wider">{turn.role}</div>
                                    <p className="whitespace-pre-wrap">{turn.text}</p>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-50 p-4 rounded-lg text-gray-500 animate-pulse">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t bg-gray-50 rounded-b-xl flex gap-3">
                        <input
                            type="text"
                            className="flex-1 p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            placeholder="Type your answer..."
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleReply()}
                            disabled={loading || history.length === 0}
                        />
                        <button
                            onClick={handleReply}
                            disabled={!userInput.trim() || loading || history.length === 0}
                            className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium disabled:opacity-50 hover:bg-blue-700 transition"
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
