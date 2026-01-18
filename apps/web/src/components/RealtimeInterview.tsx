'use client';

import { useEffect, useState } from 'react';
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface RealtimeInterviewProps {
  sessionId: string;
}

export function RealtimeInterview({ sessionId }: RealtimeInterviewProps) {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);

  const {
    isConnected,
    isInterviewActive,
    currentQuestion,
    startInterview,
    sendAudio,
    endInterview,
    error: interviewError,
  } = useRealtimeInterview({
    sessionId,
    onQuestion: (questionText) => {
      console.log('New question:', questionText);
      setTranscript(prev => [...prev, `Interviewer: ${questionText}`]);
    },
    onTranscript: (text) => {
      console.log('Participant response:', text);
      setTranscript(prev => [...prev, `You: ${text}`]);
      setIsListening(false);
    },
    onAudioDone: () => {
      console.log('Question audio finished playing');
      setIsListening(true);
    },
    onInterviewComplete: () => {
      console.log('Interview completed');
      setIsListening(false);
    },
    onError: (error) => {
      console.error('Interview error:', error);
    },
    onSpeechStarted: () => {
      console.log('Speech started');
      setIsSpeaking(true);
      setSilenceCountdown(null);
    },
    onSpeechStopped: () => {
      console.log('Speech stopped');
      setIsSpeaking(false);
      setSilenceCountdown(3); // Start 3 second countdown
    },
  });

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recorderError,
  } = useAudioRecorder({
    onAudioData: (audioData) => {
      if (isInterviewActive) {
        sendAudio(audioData);
      }
    },
    onError: (error) => {
      console.error('Recorder error:', error);
    },
  });

  // Countdown timer effect
  useEffect(() => {
    if (silenceCountdown === null || silenceCountdown === 0) return;

    const timer = setInterval(() => {
      setSilenceCountdown(prev => {
        if (prev === null || prev <= 1) return null;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [silenceCountdown]);

  // Auto-start recording when interview becomes active and we're listening
  useEffect(() => {
    if (isListening && !isRecording && isInterviewActive) {
      startRecording();
    } else if (!isListening && isRecording) {
      stopRecording();
    }
  }, [isListening, isRecording, isInterviewActive, startRecording, stopRecording]);

  const handleStart = async () => {
    try {
      await startInterview();
    } catch (err) {
      console.error('Failed to start interview:', err);
    }
  };

  const handleEnd = () => {
    stopRecording();
    endInterview();
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Realtime Voice Interview</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {isInterviewActive && (
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600">
                {isListening ? 'Listening...' : 'Processing...'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {(interviewError || recorderError) && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            {interviewError || recorderError}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex gap-4">
        {!isInterviewActive ? (
          <button
            onClick={handleStart}
            disabled={!isConnected}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Start Interview
          </button>
        ) : (
          <button
            onClick={handleEnd}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            End Interview
          </button>
        )}
      </div>

      {/* Voice Activity Detection UI */}
      {isInterviewActive && isListening && (
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            {/* Voice Detection Indicator */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isSpeaking
                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-gray-300'
                }`}>
                  <svg
                    className={`w-8 h-8 ${isSpeaking ? 'text-white' : 'text-gray-500'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                  </svg>
                </div>
                {isSpeaking && (
                  <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
                )}
              </div>
              <div>
                <p className={`font-bold text-lg transition-colors ${
                  isSpeaking ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {isSpeaking ? 'Listening to you...' : 'Speak your answer'}
                </p>
                <p className="text-sm text-gray-500">
                  {isSpeaking ? 'We can hear you!' : 'Start speaking to respond'}
                </p>
              </div>
            </div>

            {/* Countdown Timer */}
            {silenceCountdown !== null && (
              <div className="flex flex-col items-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#e5e7eb"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      stroke="#f59e0b"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - silenceCountdown / 3)}`}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600">{silenceCountdown}</span>
                  </div>
                </div>
                <p className="text-xs text-amber-600 font-medium mt-1">Processing...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Question */}
      {currentQuestion && (
        <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-sm font-semibold text-blue-800 mb-2">Current Question:</h2>
          <p className="text-lg text-blue-900">{currentQuestion}</p>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
            <span className="text-green-800 font-medium">Recording your response...</span>
          </div>
        </div>
      )}

      {/* Transcript */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-white">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Conversation</h2>
        {transcript.length === 0 ? (
          <p className="text-gray-500 italic">
            Interview hasn't started yet. Click "Start Interview" to begin.
          </p>
        ) : (
          <div className="space-y-4">
            {transcript.map((line, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  line.startsWith('Interviewer:')
                    ? 'bg-blue-50 border-l-4 border-blue-500'
                    : 'bg-gray-50 border-l-4 border-gray-500'
                }`}
              >
                <p className="text-sm text-gray-800">{line}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">How it works:</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Click "Start Interview" to begin the conversational interview</li>
          <li>The AI interviewer will ask you questions based on your research topic</li>
          <li>Speak your answers naturally - the system will automatically detect when you're done</li>
          <li>The conversation will continue until all questions are answered</li>
          <li>Click "End Interview" at any time to finish early</li>
        </ol>
      </div>
    </div>
  );
}
