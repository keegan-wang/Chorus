import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAudioRecorderOptions {
  onRecordingComplete?: (audioData: string) => void;
  onSpeechDetected?: () => void;
  onError?: (error: string) => void;
  silenceThreshold?: number;
  silenceDuration?: number;
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  error: string | null;
  isSpeechDetected: boolean;
}

export function useAudioRecorder({
  onRecordingComplete,
  onSpeechDetected,
  onError,
  silenceThreshold = 0.01,
  silenceDuration = 2000, // 2 seconds of silence
}: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeechDetected, setIsSpeechDetected] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Int16Array[]>([]);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const silenceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpeechRef = useRef<boolean>(false);
  const lastSpeechStateRef = useRef<boolean>(false);

  const startRecording = useCallback(async () => {
    try {
      // Reset state
      audioChunksRef.current = [];
      hasSpeechRef.current = false;
      lastSpeechStateRef.current = false;

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 24000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log('[Recorder] Microphone access granted, starting recording');
      mediaStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);

        // Calculate RMS (root mean square) to detect sound level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);

        // Check if there's sound above threshold
        if (rms > silenceThreshold) {
          lastSoundTimeRef.current = Date.now();
          if (!hasSpeechRef.current) {
            hasSpeechRef.current = true;
            console.log('[Recorder] 🎤 Speech detected - started recording audio');
          }
          // Trigger speech detected callback on every frame with speech
          if (!lastSpeechStateRef.current) {
            lastSpeechStateRef.current = true;
            console.log('[Recorder] 🟢 Speech state: ACTIVE');
            setIsSpeechDetected(true);
            onSpeechDetected?.();
          }
        } else {
          // No speech in this frame
          if (lastSpeechStateRef.current) {
            lastSpeechStateRef.current = false;
            console.log('[Recorder] ⚪ Speech state: INACTIVE (silence)');
            setIsSpeechDetected(false);
          }
        }

        // Convert float32 to PCM16 and store
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        // Store the chunk in memory
        audioChunksRef.current.push(pcm16);
      };

      // Start silence detection interval
      silenceCheckIntervalRef.current = setInterval(() => {
        const timeSinceLastSound = Date.now() - lastSoundTimeRef.current;

        // Update speech state based on recent activity
        const isSpeaking = timeSinceLastSound < 200; // Consider speaking if sound within last 200ms
        if (isSpeaking !== lastSpeechStateRef.current) {
          lastSpeechStateRef.current = isSpeaking;
          if (isSpeaking) {
            onSpeechDetected?.();
          }
        }

        // Check for silence after speech
        if (hasSpeechRef.current && timeSinceLastSound > silenceDuration) {
          console.log(`[Recorder] 🔇 Silence detected after speech (${(silenceDuration/1000).toFixed(1)}s) - processing complete recording`);
          hasSpeechRef.current = false;
          lastSpeechStateRef.current = false;
          setIsSpeechDetected(false);

          // Combine all chunks and send
          const totalLength = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.length, 0);
          const combinedAudio = new Int16Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunksRef.current) {
            combinedAudio.set(chunk, offset);
            offset += chunk.length;
          }

          // Convert to base64
          const base64Audio = arrayBufferToBase64(combinedAudio.buffer);
          console.log(`[Recorder] ✅ Complete recording: ${combinedAudio.length} samples (${(combinedAudio.length / 24000).toFixed(2)}s)`);

          // Clear chunks for next recording
          audioChunksRef.current = [];

          // Send complete recording
          onRecordingComplete?.(base64Audio);
        }
      }, 100); // Check every 100ms for more responsive UI

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMsg);
      onError?.(errorMsg);
    }
  }, [silenceThreshold, silenceDuration, onSpeechDetected, onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    // Clear silence detection interval
    if (silenceCheckIntervalRef.current) {
      clearInterval(silenceCheckIntervalRef.current);
      silenceCheckIntervalRef.current = null;
    }

    // Clean up processor
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Reset refs
    hasSpeechRef.current = false;
    lastSpeechStateRef.current = false;
    lastSoundTimeRef.current = Date.now();

    setIsRecording(false);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    startRecording,
    stopRecording,
    error,
    isSpeechDetected,
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
