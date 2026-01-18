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
  onAudioComplete?: (audioData: string) => void;
  onAudioPlaybackFinished?: () => void;
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
  stopListening: () => void;
  endInterview: () => void;
  error: string | null;
}

export function useRealtimeInterview({
  sessionId,
  onQuestion,
  onTranscript,
  onAudioComplete,
  onAudioPlaybackFinished,
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
  const audioSentCountRef = useRef<number>(0);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const handleRealtimeMessageRef = useRef<(message: RealtimeMessage) => void>();
  const onErrorRef = useRef<((error: string) => void) | undefined>();
  const onAudioPlaybackFinishedRef = useRef<(() => void) | undefined>();

  // Keep refs updated
  useEffect(() => {
    onErrorRef.current = onError;
    onAudioPlaybackFinishedRef.current = onAudioPlaybackFinished;
  }, [onError, onAudioPlaybackFinished]);

  // Define audio playback function
  const playCompleteAudio = useCallback(async (base64Audio: string, format?: string) => {
    if (!audioContextRef.current) {
      console.error('[Audio] AudioContext not initialized');
      return;
    }

    if (!base64Audio) {
      console.warn('[Audio] No audio data to play');
      return;
    }

    try {
      // Stop any currently playing audio
      if (currentAudioSourceRef.current) {
        console.log('[Audio] Stopping previous audio');
        try {
          currentAudioSourceRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
        currentAudioSourceRef.current = null;
      }

      const audioContext = audioContextRef.current;

      // Check if audio context is suspended and resume it
      if (audioContext.state === 'suspended') {
        console.log('[Audio] AudioContext suspended, resuming...');
        await audioContext.resume();
        console.log(`[Audio] AudioContext resumed (state: ${audioContext.state})`);
      }

      console.log(`[Audio] Decoding complete audio (${base64Audio.length} bytes base64, format: ${format || 'pcm16'})`);

      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log(`[Audio] Decoded ${bytes.length} bytes`);

      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(bytes.buffer);

      console.log(`[Audio] Decoded audio buffer (duration: ${audioBuffer.duration.toFixed(2)}s, channels: ${audioBuffer.numberOfChannels}, rate: ${audioBuffer.sampleRate})`);

      // Play the complete audio
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);

      // Store reference to current audio source
      currentAudioSourceRef.current = source;

      // Add event listener for when audio finishes
      source.onended = () => {
        console.log('[Audio] ✅ Playback finished completely');
        currentAudioSourceRef.current = null;
        onAudioPlaybackFinishedRef.current?.();
      };

      source.start(0);

      console.log(`[Audio] ✅ Started playing audio`);
    } catch (err) {
      console.error('[Audio] ❌ Error playing audio:', err);
    }
  }, []); // Empty dependency array since we use refs

  // Define message handler
  const handleRealtimeMessage = useCallback((message: RealtimeMessage) => {
    switch (message.type) {
      case 'question':
        if (message.text) {
          setCurrentQuestion(message.text);
          onQuestion?.(message.text);
        }
        break;

      case 'transcript':
        if (message.text) {
          onTranscript?.(message.text);
        }
        break;

      case 'audio_complete':
        if (message.data) {
          console.log(`[Audio] Received complete audio (${message.data.length} bytes, format: ${(message as any).format || 'unknown'})`);
          onAudioComplete?.(message.data);
          playCompleteAudio(message.data, (message as any).format);
        } else {
          console.warn('[Audio] Received audio_complete with no data');
        }
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
  }, [onQuestion, onTranscript, onAudioComplete, onInterviewComplete, onError, onSpeechStarted, onSpeechStopped, playCompleteAudio]);

  // Update the ref when the callback changes
  useEffect(() => {
    handleRealtimeMessageRef.current = handleRealtimeMessage;
  }, [handleRealtimeMessage]);

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
      handleRealtimeMessageRef.current?.(message);
    });

    socket.on('realtime-error', (data: { message: string }) => {
      const errorMsg = data.message || 'Unknown error';
      setError(errorMsg);
      onErrorRef.current?.(errorMsg);
    });

    socket.on('realtime-closed', () => {
      setIsInterviewActive(false);
    });

    return () => {
      socket.emit('leave-session', { sessionId });
      socket.disconnect();
    };
  }, [sessionId]); // Only depend on sessionId

  const startInterview = useCallback(async () => {
    console.log('[Interview Hook] startInterview called');

    if (!socketRef.current) {
      setError('Socket not connected');
      console.error('[Interview Hook] Socket not connected');
      return;
    }

    try {
      // Initialize audio context with default sample rate (48000 Hz is standard for most browsers)
      audioContextRef.current = new AudioContext();
      console.log(`[Audio] AudioContext initialized (state: ${audioContextRef.current.state}, sampleRate: ${audioContextRef.current.sampleRate})`);

      // Try to resume the audio context immediately (needed for some browsers)
      if (audioContextRef.current.state === 'suspended') {
        console.log('[Audio] AudioContext is suspended, attempting to resume...');
        await audioContextRef.current.resume();
        console.log(`[Audio] AudioContext resumed (state: ${audioContextRef.current.state})`);
      }

      audioSentCountRef.current = 0; // Reset audio sent counter

      // Emit start event
      console.log('[Interview Hook] Emitting start-realtime-interview event');
      socketRef.current.emit('start-realtime-interview', { sessionId });

      console.log('[Interview Hook] Setting isInterviewActive to true');
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

    console.log(`[Interview] Sending complete audio (${audioData.length} bytes base64)`);
    socketRef.current.emit('realtime-audio', { sessionId, audio: audioData });
  }, [sessionId, isInterviewActive]);

  const stopListening = useCallback(() => {
    // No longer needed - audio is sent as one complete message
    console.log('[Interview] Audio sent (no stop_listening signal needed)');
  }, []);

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

  return {
    isConnected,
    isInterviewActive,
    currentQuestion,
    startInterview,
    sendAudio,
    stopListening,
    endInterview,
    error,
  };
}
