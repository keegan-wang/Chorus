'use client';

import { useEffect, useState, useRef } from 'react';
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface RealtimeInterviewProps {
  sessionId: string;
}

export function RealtimeInterview({ sessionId }: RealtimeInterviewProps) {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [audioReceived, setAudioReceived] = useState(false);
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);

  const aiIsSpeakingRef = useRef(false);

  const {
    isConnected,
    isInterviewActive,
    currentQuestion,
    startInterview,
    sendAudio,
    stopListening,
    endInterview,
    error: interviewError,
  } = useRealtimeInterview({
    sessionId,
    onQuestion: (questionText) => {
      console.log('[Question] New question:', questionText);
      console.log('[UI] Setting isGeneratingQuestion = false, aiIsSpeaking = true');
      setTranscript(prev => [...prev, `Interviewer: ${questionText}`]);
      aiIsSpeakingRef.current = true;
      setAiIsSpeaking(true);
      setAudioReceived(false);
      setIsGeneratingQuestion(false);
    },
    onTranscript: (text) => {
      console.log('[Transcript] Your response:', text);
      setTranscript(prev => [...prev, `You: ${text}`]);
    },
    onAudioComplete: (audioData) => {
      console.log(`[Audio] ✅ Complete audio received (${audioData.length} bytes base64) - WILL START PLAYING NOW`);
      setAudioReceived(true);

      // Base64 to bytes: divide by 4/3 (base64 encoding overhead)
      // PCM16: 2 bytes per sample
      // Sample rate: 24000 Hz
      const bytesDecoded = (audioData.length * 3) / 4;
      const numSamples = bytesDecoded / 2;
      const durationSeconds = numSamples / 24000;

      console.log(`[Audio] Question will play for ~${durationSeconds.toFixed(2)}s`);
    },
    onAudioPlaybackFinished: () => {
      console.log('[Audio] ✅ Playback finished - NOW starting recording for your answer');
      console.log('[Audio] State check: isInterviewActive =', isInterviewActive, ', isRecording =', isRecording);
      aiIsSpeakingRef.current = false;
      setAiIsSpeaking(false);

      // Automatically start recording after question finishes playing
      if (isInterviewActive && !isRecording) {
        console.log('[Audio] ✅ Auto-starting recording for user response');
        startRecording();
      } else {
        console.log('[Audio] ❌ NOT starting recording: isInterviewActive =', isInterviewActive, ', isRecording =', isRecording);
      }
    },
    onInterviewComplete: () => {
      console.log('Interview completed');
    },
    onError: (error) => {
      console.error('Interview error:', error);
    },
  });

  const {
    isRecording,
    startRecording,
    stopRecording,
    error: recorderError,
    isSpeechDetected,
  } = useAudioRecorder({
    onRecordingComplete: (audioData) => {
      console.log('[Recorder] ✅ Recording complete, sending to backend');
      console.log('[UI] Setting isGeneratingQuestion = true');
      setIsGeneratingQuestion(true);
      sendAudio(audioData);
      stopListening();
    },
    onError: (error) => {
      console.error('Recorder error:', error);
    },
    onSpeechDetected: (detected) => {
      // Visual feedback for speech detection
      console.log(`[Speech] ${detected ? 'Started' : 'Stopped'} speaking`);
    },
    // Keep speech detection active for visual feedback, but disable auto-stop
    silenceThreshold: 0.015, // Detect speech
    silenceDuration: 999999, // Never auto-stop (very long duration)
  });

  // No useEffect needed - explicit control only

  const handleStart = async () => {
    try {
      console.log('[Interview] Starting interview');
      await startInterview();
    } catch (err) {
      console.error('Failed to start interview:', err);
    }
  };

  const handleEnd = () => {
    stopRecording();
    endInterview();
  };

  const handleTestAudio = () => {
    // Play a simple beep to test audio output
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.3;

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audioContext.close();
    }, 200);

    console.log('[Audio Test] Played test beep');
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
          {isRecording && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-gray-600">Recording</span>
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

      {/* Debug State Display */}
      {isInterviewActive && (
        <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
          <div className="font-bold mb-1">Debug State:</div>
          <div>isGeneratingQuestion: {isGeneratingQuestion ? '✅ true' : '❌ false'}</div>
          <div>aiIsSpeaking: {aiIsSpeaking ? '✅ true' : '❌ false'}</div>
          <div>isRecording: {isRecording ? '✅ true' : '❌ false'}</div>
          <div>audioReceived: {audioReceived ? '✅ true' : '❌ false'}</div>
        </div>
      )}

      {/* Controls */}
      <div className="mb-6 flex gap-4">
        {!isInterviewActive ? (
          <>
            <button
              onClick={handleStart}
              disabled={!isConnected}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Start Interview
            </button>
            <button
              onClick={handleTestAudio}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              🔊 Test Audio
            </button>
          </>
        ) : (
          <button
            onClick={handleEnd}
            className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            End Interview
          </button>
        )}
      </div>

      {/* Generating Question Indicator */}
      {isInterviewActive && isGeneratingQuestion && !aiIsSpeaking && (
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg shadow-md">
          {console.log('[UI] Rendering "Thinking of next question" indicator')}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-purple-500 animate-spin shadow-lg shadow-purple-500/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-purple-700">
                🤔 Thinking of next question...
              </p>
              <p className="text-sm text-purple-600">
                AI is analyzing your response
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Speaking Indicator */}
      {isInterviewActive && aiIsSpeaking && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg text-blue-700">
                {audioReceived ? '🔊 Playing audio...' : 'Loading question...'}
              </p>
              <p className="text-sm text-blue-600">
                {audioReceived ? 'Listen to the question' : 'Please wait'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Controls */}
      {isInterviewActive && !aiIsSpeaking && !isGeneratingQuestion && (
        <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isRecording && (
                <div className={`w-4 h-4 rounded-full ${isSpeechDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
              )}
              <div>
                <p className="font-bold text-lg text-gray-700">
                  {isRecording ? '🎤 Recording your answer...' : 'Ready to record'}
                </p>
                <p className="text-sm text-gray-500">
                  {isRecording ? 'Click "Stop Recording" when you finish speaking' : 'Recording will start automatically after question'}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              {!isRecording ? (
                <>
                  <button
                    onClick={startRecording}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                      <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                    </svg>
                    Start Recording
                  </button>
                  <button
                    onClick={() => {
                      console.log('[Manual] Requesting next question');
                      // Send empty audio to trigger next question
                      sendAudio('');
                    }}
                    className="px-4 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
                  >
                    ⏭️ Skip / Next Question
                  </button>
                </>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <rect x="6" y="6" width="8" height="8" rx="1" />
                  </svg>
                  Stop Recording
                </button>
              )}
            </div>
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
          <li>Click "Start Interview" to begin</li>
          <li>Listen to the question</li>
          <li>Click "Start Recording" when ready to answer</li>
          <li>Speak your answer</li>
          <li>Click "Stop Recording" when done</li>
          <li>Wait for the next question - repeat steps 2-5</li>
        </ol>
      </div>
    </div>
  );
}
