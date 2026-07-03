import React, { useEffect, useRef, useState } from 'react';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import { AnimatePresence } from 'framer-motion';

// Import refactored dashboard sub-components
import { DashboardHeader } from './Dashboard/DashboardHeader';
import { HelpPanel } from './Dashboard/HelpPanel';
import { FocusSoundscapes } from './Dashboard/FocusSoundscapes';
import { MicrophoneConsole } from './Dashboard/MicrophoneConsole';
import { CustomizerPanel } from './Dashboard/CustomizerPanel';

import type { DeskConfig } from './OfficeScene';
import type { AvatarOutfit } from '../App';

interface DashboardProps {
  theme: 'day' | 'sunset' | 'night';
  setTheme: (theme: 'day' | 'sunset' | 'night') => void;
  environmentType: 'nature' | 'city';
  setEnvironmentType: (env: 'nature' | 'city') => void;
  desks: DeskConfig[];
  updateDesk: (deskId: number, updates: Partial<DeskConfig>) => void;
  activeDesk: number | null;
  outfit: AvatarOutfit;
  setOutfit: React.Dispatch<React.SetStateAction<AvatarOutfit>>;
  sunIntensityMulti: number;
  setSunIntensityMulti: (val: number) => void;
  ambientIntensityMulti: number;
  setAmbientIntensityMulti: (val: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  theme,
  setTheme,
  environmentType,
  setEnvironmentType,
  desks,
  updateDesk,
  activeDesk,
  outfit,
  setOutfit,
  sunIntensityMulti,
  setSunIntensityMulti,
  ambientIntensityMulti,
  setAmbientIntensityMulti
}) => {
  const {
    status,
    error,
    connectMicrophone,
    disconnectMicrophone,
    getVolume,
    getRawFrequencyData,
    isMuted,
    toggleMute
  } = useAudioAnalyzer();

  const [showHelp, setShowHelp] = useState(false);
  const [currentVolumeValue, setCurrentVolumeValue] = useState(0);
  const visualizerCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Soundscape Synthesizer Ref States
  const [activeSoundscape, setActiveSoundscape] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rainSourceRef = useRef<AudioNode | null>(null);
  const windSourceRef = useRef<AudioNode | null>(null);
  const windLfoRef = useRef<OscillatorNode | null>(null);
  const chimeIntervalRef = useRef<any>(null);

  // YouTube player states
  const [ytUrl, setYtUrl] = useState<string>('');
  const [ytVolume, setYtVolume] = useState<number>(50);
  const [isYtPlaying, setIsYtPlaying] = useState<boolean>(false);
  const ytPlayerRef = useRef<any>(null);

  // Playlist queue manager states
  const [playlist, setPlaylist] = useState<{ id: string; title: string }[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);

  const playlistRef = useRef(playlist);
  const currentTrackIndexRef = useRef(currentTrackIndex);
  const playNextTrackRef = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  useEffect(() => {
    currentTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex]);

  // Load YouTube Iframe API once
  useEffect(() => {
    if ((window as any).YT && (window as any).YT.Player) return;

    // Avoid duplicating script tags
    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const playYoutubeVideo = (videoId: string) => {
    stopAllSoundscapes();
    setActiveSoundscape('youtube');

    if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
      try {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.setVolume(ytVolume);
        ytPlayerRef.current.playVideo();
        setIsYtPlaying(true);
      } catch (err) {
        console.error('Failed to load video on existing player', err);
      }
    } else {
      try {
        ytPlayerRef.current = new (window as any).YT.Player('yt-player-placeholder', {
          height: '1',
          width: '1',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
          },
          events: {
            onReady: (event: any) => {
              event.target.setVolume(ytVolume);
              event.target.playVideo();
              setIsYtPlaying(true);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setIsYtPlaying(true);
              } else if (event.data === 2) {
                setIsYtPlaying(false);
              } else if (event.data === 0) {
                setIsYtPlaying(false);
                playNextTrackRef.current?.();
              }
            }
          }
        });
      } catch (err) {
        console.error('Failed to create YT player', err);
      }
    }
  };

  const handleToggleYtPlay = () => {
    if (!ytPlayerRef.current) return;
    try {
      if (isYtPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsYtPlaying(false);
      } else {
        stopAllSoundscapes();
        setActiveSoundscape('youtube');
        ytPlayerRef.current.playVideo();
        setIsYtPlaying(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleYtVolumeChange = (vol: number) => {
    setYtVolume(vol);
    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      try {
        ytPlayerRef.current.setVolume(vol);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const playTrack = (index: number) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentTrackIndex(index);
    playYoutubeVideo(playlist[index].id);
  };

  const playNextTrack = () => {
    const nextIndex = currentTrackIndexRef.current + 1;
    if (nextIndex < playlistRef.current.length) {
      playTrack(nextIndex);
    } else {
      stopAllSoundscapes();
    }
  };

  useEffect(() => {
    playNextTrackRef.current = playNextTrack;
  });

  const handleAddTrack = (url: string, playNow = false) => {
    const id = getYouTubeId(url);
    if (!id) {
      alert('ลิงก์ YouTube ไม่ถูกต้องครับ');
      return;
    }

    const title = `Song #${playlist.length + 1} (${id})`;
    const newTrack = { id, title };
    const newPlaylist = [...playlist, newTrack];
    setPlaylist(newPlaylist);

    if (playNow || newPlaylist.length === 1) {
      const targetIndex = playNow ? newPlaylist.length - 1 : 0;
      setCurrentTrackIndex(targetIndex);
      playYoutubeVideo(id);
    }
    setYtUrl('');
  };

  const handleRemoveTrack = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(newPlaylist);

    if (index === currentTrackIndex) {
      if (newPlaylist.length === 0) {
        stopAllSoundscapes();
      } else {
        const nextIndex = Math.min(index, newPlaylist.length - 1);
        setCurrentTrackIndex(nextIndex);
        playYoutubeVideo(newPlaylist[nextIndex].id);
      }
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleSkipTrack = () => {
    playNextTrack();
  };

  // Poll current volume numerical level for UI meter
  useEffect(() => {
    if (status !== 'connected') {
      setCurrentVolumeValue(0);
      return;
    }
    const update = () => {
      setCurrentVolumeValue(getVolume());
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, getVolume]);

  // Audio Canvas visualizer loop
  useEffect(() => {
    if (status !== 'connected') return;

    let visualizerFrameId: number;
    let lastWidth = 0;
    let lastHeight = 0;

    const draw = () => {
      visualizerFrameId = requestAnimationFrame(draw);

      // Canvas may not be mounted yet (AnimatePresence transition)
      const canvas = visualizerCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Recalculate dimensions each frame so it works even if the
      // element starts at 0×0 (e.g. during framer-motion entry).
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;

      if (cw !== lastWidth || ch !== lastHeight) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastWidth = cw;
        lastHeight = ch;
      }

      const freqs = getRawFrequencyData();
      if (!freqs) return;
      ctx.clearRect(0, 0, cw, ch);

      // Render 16-band gradient visualizer bar charts
      const barCount = 16;
      const gap = 3.5;
      const barWidth = (cw - (barCount - 1) * gap) / barCount;

      for (let i = 0; i < barCount; i++) {
        // Map frequency bands
        const freqIndex = Math.floor((i / barCount) * freqs.length);
        const rawValue = freqs[freqIndex] || 0; // value from 0 to 255

        // Normalize value with custom exponential scale to look responsive
        const percent = Math.pow(rawValue / 255, 1.25);
        const barHeight = Math.max(3, percent * (ch - 8));

        // Rounded vertical pill lines
        ctx.fillStyle = `rgba(99, 102, 241, ${0.15 + percent * 0.85})`;
        const x = i * (barWidth + gap);
        const y = ch - barHeight - 4;

        ctx.beginPath();
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, barWidth, barHeight, 2.5);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(visualizerFrameId);
    };
  }, [status, getRawFrequencyData]);

  // Get or initialize AudioContext
  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(console.error);
    }
    return audioCtxRef.current;
  };

  // SOUND GENERATORS
  const startRain = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter white noise to sound like rain (lowpass/bandpass combo)
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.24, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();
    rainSourceRef.current = whiteNoise;
  };

  const startWind = (ctx: AudioContext) => {
    // Generate pink noise for a more natural rustling sound
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Wind filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    filter.Q.value = 2.5;

    // LFO to slowly sweep the wind frequency
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08; // slow gusts

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 200; // range +/- 200Hz

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    lfo.start();

    windSourceRef.current = source;
    windLfoRef.current = lfo;
  };

  const startBells = (ctx: AudioContext) => {
    // Pentatonic scale frequencies
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];

    const playBell = () => {
      if (audioCtxRef.current?.state === 'suspended') return;
      const note = scale[Math.floor(Math.random() * scale.length)];

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.value = 750;

      gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 5.5);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 5.6);
    };

    playBell();

    chimeIntervalRef.current = setInterval(() => {
      playBell();
    }, 4500 + Math.random() * 4500);
  };

  const stopAllSoundscapes = () => {
    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
        setIsYtPlaying(false);
      } catch (e) { }
    }
    if (rainSourceRef.current) {
      try { (rainSourceRef.current as any).stop(); } catch (e) { }
      rainSourceRef.current = null;
    }
    if (windSourceRef.current) {
      try { (windSourceRef.current as any).stop(); } catch (e) { }
      windSourceRef.current = null;
    }
    if (windLfoRef.current) {
      try { windLfoRef.current.stop(); } catch (e) { }
      windLfoRef.current = null;
    }
    if (chimeIntervalRef.current) {
      clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = null;
    }
    setActiveSoundscape(null);
  };

  const handleToggleSoundscape = (id: string) => {
    const ctx = getAudioContext();
    if (activeSoundscape === id) {
      stopAllSoundscapes();
    } else {
      stopAllSoundscapes();
      setActiveSoundscape(id);
      if (id === 'rain') startRain(ctx);
      else if (id === 'wind') startWind(ctx);
      else if (id === 'bells') startBells(ctx);
    }
  };

  // Clean up Web Audio nodes on unmount
  useEffect(() => {
    return () => {
      stopAllSoundscapes();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
        audioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6">

      {/* ---------------- TOP BAR ---------------- */}
      <DashboardHeader
        theme={theme}
        setTheme={setTheme}
        environmentType={environmentType}
        setEnvironmentType={setEnvironmentType}
        showHelp={showHelp}
        setShowHelp={setShowHelp}
        status={status}
        isMuted={isMuted}
        toggleMute={toggleMute}
        disconnectMicrophone={disconnectMicrophone}
      />

      {/* ---------------- CENTER RIGHT / DYNAMIC CUSTOMIZER ---------------- */}
      <CustomizerPanel
        activeDesk={activeDesk}
        desks={desks}
        updateDesk={updateDesk}
        outfit={outfit}
        setOutfit={setOutfit}
        sunIntensityMulti={sunIntensityMulti}
        setSunIntensityMulti={setSunIntensityMulti}
        ambientIntensityMulti={ambientIntensityMulti}
        setAmbientIntensityMulti={setAmbientIntensityMulti}
      />

      {/* ---------------- BOTTOM BAR / DASHBOARD OVERLAY ---------------- */}
      <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-end space-y-4 md:space-y-0 md:space-x-4 pointer-events-none">

        {/* Left column: Focus Audio */}
        <div className="flex flex-col space-y-3.5 w-full max-w-sm">
          {/* Focus Soundscapes Panel */}
          <FocusSoundscapes
            activeSoundscape={activeSoundscape}
            onToggleSoundscape={handleToggleSoundscape}
            ytUrl={ytUrl}
            setYtUrl={setYtUrl}
            ytVolume={ytVolume}
            onYtVolumeChange={handleYtVolumeChange}
            isYtPlaying={isYtPlaying}
            onToggleYtPlay={handleToggleYtPlay}
            onAddTrack={handleAddTrack}
            playlist={playlist}
            currentTrackIndex={currentTrackIndex}
            onRemoveTrack={handleRemoveTrack}
            onPlayTrack={playTrack}
            onSkipTrack={handleSkipTrack}
          />
        </div>

        {/* Right column: Help/Guide and Live Audio Visualizer */}
        <div className="flex flex-col space-y-3.5 w-full max-w-sm">
          {/* Help/Guide Panel */}
          <AnimatePresence>
            <HelpPanel showHelp={showHelp} />
          </AnimatePresence>

          {/* Live Audio Visualizer Corner Console */}
          <MicrophoneConsole
            status={status}
            error={error}
            connectMicrophone={connectMicrophone}
            currentVolumeValue={currentVolumeValue}
            visualizerCanvasRef={visualizerCanvasRef}
          />
        </div>
      </div>

      {/* Hidden container for YouTube Player API iframe */}
      <div id="yt-player-placeholder" className="absolute w-[1px] h-[1px] opacity-0 pointer-events-none" />
    </div>
  );
};
