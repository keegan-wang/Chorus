import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface RealtimeMessage {
  type: string;
  text?: string;
  data?: string;
  message?: string;
}

interface UseRealtimeInterviewOptions {
  sessionId: string;
  onQuestion?: (questionText: string) => void;
  onTranscript?: (transcript: string) => void;
  onAudioDelta?: (audioData: string) => void;
  onAudioDone?: () => void;
  onInterviewComplete?: () => void;
  onError?: (error: string) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
}

interface UseRealtimeInterviewReturn {
  isConnected: boolean;
  isInterviewActive: boolean;
  currentQuestion: string | null;
  startInterview: () => Promise<void>;
  sendAudio: (audioData: string) => void;
  endInterview: () => void;
  error: string | null;
}

export function useRealtimeInterview({
  sessionId,
  onQuestion,
  onTranscript,
  onAudioDelta,
  onAudioDone,
  onInterviewComplete,
  onError,
  onSpeechStarted,
  onSpeechStopped,
}: UseRealtimeInterviewOptions): UseRealtimeInterviewReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);
  const audioSentCountRef = useRef<number>(0);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO connected');
      setIsConnected(true);
      socket.emit('join-session', { sessionId });
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setIsConnected(false);
      setIsInterviewActive(false);
    });

    socket.on('realtime-message', (message: RealtimeMessage) => {
      handleRealtimeMessage(message);
    });

    socket.on('realtime-error', (data: { message: string }) => {
      const errorMsg = data.message || 'Unknown error';
      setError(errorMsg);
      onError?.(errorMsg);
    });

    socket.on('realtime-closed', () => {
      setIsInterviewActive(false);
    });

    return () => {
      socket.emit('leave-session', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]);

  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    switch (message.type) {
      case 'question':
        if (message.text) {
          setCurrentQuestion(message.text);
          nextPlayTimeRef.current = 0; // Reset audio queue for new question
          onQuestion?.(message.text);
        }
        break;

      case 'transcript':
        if (message.text) {
          onTranscript?.(message.text);
        }
        break;

      case 'audio_delta':
        if (message.data) {
          onAudioDelta?.(message.data);
          playAudioChunk(message.data);
        }
        break;

      case 'audio_done':
        onAudioDone?.();
        break;

      case 'interview_complete':
        setIsInterviewActive(false);
        onInterviewComplete?.();
        break;

      case 'speech_started':
        onSpeechStarted?.();
        break;

      case 'speech_stopped':
        onSpeechStopped?.();
        break;

      case 'error':
        const errorMsg = message.message || 'Unknown error';
        setError(errorMsg);
        onError?.(errorMsg);
        break;
    }
  }, [onQuestion, onTranscript, onAudioDelta, onAudioDone, onInterviewComplete, onError, onSpeechStarted, onSpeechStopped]);

  const startInterview = useCallback(async () => {
    if (!socketRef.current) {
      setError('Socket not connected');
      return;
    }

    try {
      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      nextPlayTimeRef.current = 0; // Reset audio scheduling
      audioSentCountRef.current = 0; // Reset audio sent counter

      // Emit start event
      socketRef.current.emit('start-realtime-interview', { sessionId });
      setIsInterviewActive(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start interview';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [sessionId, onError]);

  const sendAudio = useCallback((audioData: string) => {
    if (!socketRef.current || !isInterviewActive) {
      console.warn('Cannot send audio: interview not active');
      return;
    }

    // Log first audio sent
    if (audioSentCountRef.current === 0) {
      console.log('[Interview] Sending first audio chunk to server');
    }
    audioSentCountRef.current++;

    // Log every 100 chunks
    if (audioSentCountRef.current % 100 === 0) {
      console.log(`[Interview] Sent ${audioSentCountRef.current} audio chunks to server`);
    }

    socketRef.current.emit('realtime-audio', { sessionId, audio: audioData });
  }, [sessionId, isInterviewActive]);

  const endInterview = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('end-realtime-interview', { sessionId });
    setIsInterviewActive(false);

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, [sessionId]);

  const playAudioChunk = useCallback((base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to AudioBuffer
      const audioContext = audioContextRef.current;
      const audioBuffer = audioContext.createBuffer(1, bytes.length / 2, 24000);
      const channelData = audioBuffer.getChannelData(0);

      // Convert PCM16 to float32 (little-endian)
      for (let i = 0; i < channelData.length; i++) {
        const int16 = (bytes[i * 2] | (bytes[i * 2 + 1] << 8)) << 16 >> 16; // Read as signed int16
        channelData[i] = int16 / 32768.0;
      }

      // Schedule audio to play sequentially
      const currentTime = audioContext.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(startTime);

      // Update next play time
      nextPlayTimeRef.current = startTime + audioBuffer.duration;
    } catch (err) {
      console.error('Error playing audio chunk:', err);
    }
  }, []);

  return {
    isConnected,
    isInterviewActive,
    currentQuestion,
    startInterview,
    sendAudio,
    endInterview,
    error,
  };
}
