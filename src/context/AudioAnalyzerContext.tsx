import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

export type AudioStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface AudioAnalyzerContextType {
  status: AudioStatus;
  error: string | null;
  connectMicrophone: () => Promise<void>;
  disconnectMicrophone: () => void;
  getVolume: () => number; // Returns float 0 to 1
  getNormalizedFrequency: (lowBin?: number, highBin?: number) => number; // Returns average normalized level 0 to 1
  getRawFrequencyData: () => Uint8Array | null;
  fftSize: number;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioAnalyzerContext = createContext<AudioAnalyzerContextType | null>(null);

export const useAudioAnalyzer = () => {
  const context = useContext(AudioAnalyzerContext);
  if (!context) {
    throw new Error('useAudioAnalyzer must be used within an AudioAnalyzerProvider');
  }
  return context;
};

interface ProviderProps {
  children: React.ReactNode;
}

export const AudioAnalyzerProvider: React.FC<ProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<AudioStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  // Sync mute state to the audio tracks
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const fftSize = 256;
  const timeDataRef = useRef<Uint8Array | null>(null);
  const freqDataRef = useRef<Uint8Array | null>(null);

  const connectMicrophone = async () => {
    if (status === 'connected' || status === 'connecting') return;
    
    setStatus('connecting');
    setError(null);

    try {
      // 1. Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      // 2. Initialize AudioContext (handle browser autoplay policy)
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // 3. Create AnalyserNode
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      // 4. Create buffers
      timeDataRef.current = new Uint8Array(analyser.fftSize);
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      // 5. Connect stream to analyzer
      const source = audioCtx.createMediaStreamSource(stream);
      sourceRef.current = source;
      source.connect(analyser);

      // Node: We do NOT connect analyser to audioCtx.destination to prevent speaker feedback!

      // Resume context if suspended (autoplay security)
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      setStatus('connected');
    } catch (err: any) {
      console.error('Error connecting microphone:', err);
      setStatus('error');
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission was denied. Please click the microphone icon in your address bar to allow access.');
      } else {
        setError(err.message || 'Could not connect to microphone. Please verify it is connected and enabled.');
      }
    }
  };

  const disconnectMicrophone = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    timeDataRef.current = null;
    freqDataRef.current = null;
    setStatus('disconnected');
    setError(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectMicrophone();
    };
  }, []);

  const getVolume = () => {
    if (!analyserRef.current || !timeDataRef.current) return 0;
    
    analyserRef.current.getByteTimeDomainData(timeDataRef.current as any);
    
    let sum = 0;
    const length = timeDataRef.current.length;
    for (let i = 0; i < length; i++) {
      // Byte values are 0-255, 128 is silence (DC offset)
      const val = (timeDataRef.current[i] - 128) / 128;
      sum += val * val;
    }
    
    // RMS (Root Mean Square) volume
    const rms = Math.sqrt(sum / length);
    // Multiply by a factor to make typical speech map nicely up to ~1.0
    return Math.min(1, rms * 4);
  };

  const getNormalizedFrequency = (lowBin = 0, highBin = 30) => {
    if (!analyserRef.current || !freqDataRef.current) return 0;
    
    analyserRef.current.getByteFrequencyData(freqDataRef.current as any);
    
    // Average values in specified frequency range
    let sum = 0;
    const start = Math.max(0, lowBin);
    const end = Math.min(freqDataRef.current.length - 1, highBin);
    const range = end - start + 1;
    
    for (let i = start; i <= end; i++) {
      sum += freqDataRef.current[i];
    }
    
    const avg = sum / range;
    return avg / 255; // Normalize to 0..1
  };

  const getRawFrequencyData = () => {
    if (!analyserRef.current || !freqDataRef.current) return null;
    analyserRef.current.getByteFrequencyData(freqDataRef.current as any);
    return freqDataRef.current;
  };

  return (
    <AudioAnalyzerContext.Provider
      value={{
        status,
        error,
        connectMicrophone,
        disconnectMicrophone,
        getVolume,
        getNormalizedFrequency,
        getRawFrequencyData,
        fftSize,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioAnalyzerContext.Provider>
  );
};
