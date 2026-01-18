'use client';

import { useEffect, useState, useRef } from 'react';
import { useRealtimeInterview } from '@/hooks/useRealtimeInterview';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

interface RealtimeInterviewProps {
  sessionId: string;
}

export function RealtimeInterview({ sessionId }: RealtimeInterviewProps) {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceCountdown, setSilenceCountdown] = useState<number | null>(null);
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [audioReceived, setAudioReceived] = useState(false);

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
      console.log('[Question] New question received:', questionText);
      setTranscript(prev => [...prev, `Interviewer: ${questionText}`]);
      aiIsSpeakingRef.current = true;
      setAiIsSpeaking(true);
      setIsSpeaking(false);
      setSilenceCountdown(null);
      setAudioReceived(false);

      // Make sure recording is stopped while AI speaks
      if (isRecording) {
        console.log('[Question] Stopping recording - AI is about to speak');
        stopRecording();
      }
    },
    onTranscript: (text) => {
      console.log('Participant response:', text);
      setTranscript(prev => [...prev, `You: ${text}`]);
      setIsSpeaking(false);
      setSilenceCountdown(null);

      // Stop recording while waiting for next question
      console.log('[Interview] Stopping recording after transcript received');
      stopRecording();
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
      console.log('[Audio] ✅ Playback COMPLETELY finished - NOW you can speak');
      aiIsSpeakingRef.current = false;
      setAiIsSpeaking(false);

      // Restart recording for next answer
      if (isInterviewActive && !isRecording) {
        console.log('[Audio] Starting recording NOW - your turn to speak!');
        startRecording();
      }
    },
    onInterviewComplete: () => {
      console.log('Interview completed');
    },
    onError: (error) => {
      console.error('Interview error:', error);
    },
    onSpeechStarted: () => {
      // Ignore VAD events while AI is speaking (prevents feedback loop)
      if (aiIsSpeakingRef.current) {
        console.log('[VAD] Ignoring speech_started - AI is speaking');
        return;
      }
      console.log('Speech started');
      setIsSpeaking(true);
      setSilenceCountdown(null);
    },
    onSpeechStopped: () => {
      // Ignore VAD events while AI is speaking (prevents feedback loop)
      if (aiIsSpeakingRef.current) {
        console.log('[VAD] Ignoring speech_stopped - AI is speaking');
        return;
      }
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
    isSpeechDetected,
  } = useAudioRecorder({
    onRecordingComplete: (audioData) => {
      if (isInterviewActive && !aiIsSpeaking) {
        console.log('[Recorder] Sending complete recording to backend');
        setIsSpeaking(false);
        setSilenceCountdown(null);
        // Send the complete audio as one message
        sendAudio(audioData);
        // Signal that we're done
        stopListening();
        // Stop recording until next question
        stopRecording();
      }
    },
    onSpeechDetected: () => {
      if (isInterviewActive && !aiIsSpeaking && isRecording) {
        console.log('[UI] User is speaking - updating visual indicator');
        setIsSpeaking(true);
        setSilenceCountdown(null);
      }
    },
    onError: (error) => {
      console.error('Recorder error:', error);
    },
    silenceThreshold: 0.015, // Lower threshold = more sensitive to detect silence
    silenceDuration: 3000, // 3 seconds of silence before considering speech done
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

  // Start recording when interview starts, stop when it ends
  // Don't auto-restart - only restart after AI finishes speaking
  useEffect(() => {
    console.log(`[Interview] State check - isInterviewActive: ${isInterviewActive}, isRecording: ${isRecording}, aiIsSpeaking: ${aiIsSpeaking}`);

    if (isInterviewActive && !isRecording && !aiIsSpeaking) {
      console.log('[Interview] Starting recording (interview active, not recording, AI not speaking)...');
      startRecording();
    } else if (!isInterviewActive && isRecording) {
      console.log('[Interview] Stopping recording (interview ended)...');
      stopRecording();
    }
  }, [isInterviewActive, isRecording, aiIsSpeaking, startRecording, stopRecording]);

  const handleStart = async () => {
    try {
      console.log('[Interview] handleStart called');
      await startInterview();
      console.log('[Interview] startInterview completed');
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

      {/* Voice Activity Detection UI */}
      {isInterviewActive && !aiIsSpeaking && (
        <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            {/* Voice Detection Indicator */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isSpeechDetected
                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-gray-300'
                }`}>
                  <svg
                    className={`w-8 h-8 ${isSpeechDetected ? 'text-white' : 'text-gray-500'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
                    <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
                  </svg>
                </div>
                {isSpeechDetected && (
                  <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping" />
                )}
              </div>
              <div>
                <p className={`font-bold text-lg transition-colors ${
                  isSpeechDetected ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {isSpeechDetected ? 'Listening to you...' : 'Speak your answer'}
                </p>
                <p className="text-sm text-gray-500">
                  {isSpeechDetected ? 'We can hear you!' : 'Start speaking to respond'}
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
