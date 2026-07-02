import React, { useEffect, useRef, useState } from 'react';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  HelpCircle, 
  Volume2, 
  AlertTriangle,
  RotateCcw,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DeskConfig } from './OfficeScene';
import type { AvatarOutfit } from '../App';

interface DashboardProps {
  theme: 'day' | 'sunset' | 'night';
  setTheme: (theme: 'day' | 'sunset' | 'night') => void;
  desks: DeskConfig[];
  updateDesk: (deskId: number, updates: Partial<DeskConfig>) => void;
  activeDesk: number | null;
  outfit: AvatarOutfit;
  setOutfit: React.Dispatch<React.SetStateAction<AvatarOutfit>>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  theme,
  setTheme,
  desks,
  updateDesk,
  activeDesk,
  outfit,
  setOutfit
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

  const [showHelp, setShowHelp] = useState(true);
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

  // Tab controller for customization panel on the right
  const [activeTab, setActiveTab] = useState<'desk' | 'avatar'>('avatar');

  // Poll current volume numerical level for UI meter
  useEffect(() => {
    if (status !== 'connected') {
      setCurrentVolumeValue(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentVolumeValue(getVolume());
    }, 100);

    return () => clearInterval(interval);
  }, [status, getVolume]);

  // Real-time Canvas Audio Frequency Visualizer (16-band bar chart)
  useEffect(() => {
    if (status !== 'connected') return;

    const canvas = visualizerCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Cache dimensions to avoid layout thrashing (forced reflow) in requestAnimationFrame loop
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawVisualizer = () => {
      const data = getRawFrequencyData();
      if (!data) {
        animationFrameRef.current = requestAnimationFrame(drawVisualizer);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const numBars = 16;
      const gap = 3;
      const barWidth = (width - (numBars - 1) * gap) / numBars;

      // Group freq bins to draw 16 bands
      const step = Math.floor(data.length / numBars);

      for (let i = 0; i < numBars; i++) {
        // Average a small window of bins around index to make the movement smoother
        let sum = 0;
        const startBin = i * step;
        for (let j = 0; j < step; j++) {
          sum += data[startBin + j] || 0;
        }
        const val = sum / step;
        const normalizedVal = val / 255;
        // Scale with a curve to boost display of higher/lower ranges
        const scaleFactor = Math.pow(normalizedVal, 1.2);
        const barHeight = Math.max(4, scaleFactor * height * 0.9);

        // Gradient coloring
        const grad = ctx.createLinearGradient(0, height, 0, height - barHeight);
        grad.addColorStop(0, '#818cf8');   // indigo-400
        grad.addColorStop(0.4, '#a78bfa'); // violet-400
        grad.addColorStop(0.8, '#f472b6'); // pink-400
        grad.addColorStop(1, '#fb7185');   // rose-400

        ctx.fillStyle = grad;

        // X and Y positions
        const x = i * (barWidth + gap);
        const y = height - barHeight;
        const radius = Math.min(barWidth / 2, 3); // round the top of the bars

        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
        } else {
          ctx.rect(x, y, barWidth, barHeight);
        }
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(drawVisualizer);
    };

    drawVisualizer();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, getRawFrequencyData]);

  // Determine noise gauge color
  const getVolumeMeterColor = (val: number) => {
    if (val > 0.45) return 'bg-rose-500 shadow-rose-300';
    if (val > 0.15) return 'bg-purple-500 shadow-purple-300';
    return 'bg-emerald-500 shadow-emerald-300';
  };

  // Soundscape synthesizers using HTML5 Web Audio API
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const startRain = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brownian noise filter formula
      output[i] = (lastOut + (0.025 * white)) / 1.025;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    // Cozy lowpass filter to simulate rain hitting the roof/window
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start();
    rainSourceRef.current = source;
  };

  const startWind = (ctx: AudioContext) => {
    const bufferSize = 2 * ctx.sampleRate;
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
    if (rainSourceRef.current) {
      try { (rainSourceRef.current as any).stop(); } catch(e){}
      rainSourceRef.current = null;
    }
    if (windSourceRef.current) {
      try { (windSourceRef.current as any).stop(); } catch(e){}
      windSourceRef.current = null;
    }
    if (windLfoRef.current) {
      try { windLfoRef.current.stop(); } catch(e){}
      windLfoRef.current = null;
    }
    if (chimeIntervalRef.current) {
      clearInterval(chimeIntervalRef.current);
      chimeIntervalRef.current = null;
    }
    setActiveSoundscape(null);
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
      <div className="w-full flex justify-between items-start pointer-events-auto">
        {/* Title Badge and Theme Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3.5">
          <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center space-x-2.5 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping" />
            <h1 className="text-sm font-bold text-slate-800 tracking-wide font-sans">
              Virtual WFH Oasis
            </h1>
          </div>

          {/* Theme Selector (Pill Switcher) */}
          <div className="glass-panel p-1 rounded-2xl flex space-x-0.5 shadow-sm border border-white">
            {(['day', 'sunset', 'night'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 text-xs font-extrabold capitalize rounded-xl transition-all duration-300 cursor-pointer ${
                  theme === t
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/30'
                }`}
              >
                {t === 'day' ? '☀️ Day' : t === 'sunset' ? '🌅 Sunset' : '🌙 Night'}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons (Help & Audio Toggle) */}
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowHelp(!showHelp)}
            className={`glass-panel p-2.5 rounded-xl hover:bg-white transition-all duration-300 cursor-pointer ${showHelp ? 'text-indigo-600 bg-white ring-2 ring-indigo-200' : 'text-slate-600'}`}
            title="Show Guide"
          >
            <HelpCircle size={20} />
          </button>
          
          {status === 'connected' && (
            <>
              {/* Mute/Unmute Toggle Button */}
              <button 
                onClick={toggleMute}
                className={`glass-panel p-2.5 rounded-xl transition-all duration-300 flex items-center space-x-1.5 cursor-pointer ${isMuted ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-indigo-600 hover:bg-indigo-50'}`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff size={20} className="text-rose-500 animate-pulse" /> : <Mic size={20} />}
                <span className="text-xs font-semibold hidden sm:inline">{isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              {/* Leave/Disconnect Button */}
              <button 
                onClick={disconnectMicrophone}
                className="glass-panel p-2.5 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300 flex items-center space-x-1.5 cursor-pointer"
                title="Disconnect Microphone"
              >
                <LogOut size={20} />
                <span className="text-xs font-semibold hidden sm:inline">Leave</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------------- CENTER SCREEN OVERLAYS ---------------- */}
      <div className="flex-grow flex items-center justify-center pointer-events-none">
        <AnimatePresence mode="wait">
          
          {/* Onboarding Connect Screen */}
          {status === 'disconnected' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="glass-panel p-6 md:p-8 rounded-3xl text-center max-w-sm w-full mx-4 shadow-xl border border-white pointer-events-auto flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-5 ring-4 ring-indigo-100">
                <Mic className="text-indigo-600 animate-bounce" size={28} />
              </div>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Join Your Oasis</h2>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Connect your microphone to step inside your 3D interactive virtual office. The avatar bobs and emotes to the sound of your voice!
              </p>
              
              <button
                onClick={connectMicrophone}
                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide shadow-lg hover:shadow-indigo-200 transition-all duration-300 transform active:scale-95 cursor-pointer pulse-glow flex items-center justify-center space-x-2"
              >
                <Mic size={18} />
                <span>Connect Microphone</span>
              </button>
            </motion.div>
          )}

          {/* Connecting State */}
          {status === 'connecting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-6 rounded-3xl text-center max-w-xs w-full shadow-lg pointer-events-auto flex flex-col items-center"
            >
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-slate-700">Requesting microphone access...</p>
            </motion.div>
          )}

          {/* Error Screen */}
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-panel p-6 rounded-3xl text-center max-w-md w-full mx-4 shadow-xl border-l-4 border-l-rose-500 pointer-events-auto flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
                <AlertTriangle className="text-rose-500" size={24} />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1.5">Microphone Blocked</h2>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">
                {error || 'Microphone access is required. Please check system preferences or click the camera/microphone icon in the address bar.'}
              </p>
              <button
                onClick={connectMicrophone}
                className="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs tracking-wide shadow transition-all duration-200 cursor-pointer flex items-center space-x-1.5"
              >
                <RotateCcw size={14} />
                <span>Retry Connection</span>
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ---------------- CENTER RIGHT / DYNAMIC CUSTOMIZER ---------------- */}
      <div className="absolute right-4 top-24 pointer-events-auto flex flex-col items-end space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            className="glass-panel p-5 rounded-2.5xl shadow-lg border border-white max-w-[285px] w-full flex flex-col space-y-4"
          >
            {/* Tab Header (Only show tab switcher if seated) */}
            {activeDesk !== null ? (
              <div className="grid grid-cols-2 gap-1 bg-slate-900/5 p-0.5 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setActiveTab('desk')}
                  className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === 'desk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🪑 Desk
                </button>
                <button
                  onClick={() => setActiveTab('avatar')}
                  className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                    activeTab === 'avatar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👕 Avatar
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-indigo-700">
                <Sparkles size={16} className="animate-pulse" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Dress Up Sitter</h3>
              </div>
            )}

            {/* TAB CONTENT: DESK */}
            {activeDesk !== null && activeTab === 'desk' && (
              <div className="flex flex-col space-y-4">
                {/* Chair Color Picker */}
                <div className="flex flex-col space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Chair Cushion</span>
                  <div className="flex space-x-1.5">
                    {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateDesk(activeDesk, { chairColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                          desks[activeDesk]?.chairColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Lamp Color Picker */}
                <div className="flex flex-col space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Desk Lamp Glow</span>
                  <div className="flex space-x-1.5">
                    {['#f43f5e', '#06b6d4', '#eab308', '#22c55e', '#a855f7'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateDesk(activeDesk, { lampColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                          desks[activeDesk]?.lampColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Mug Color Picker */}
                <div className="flex flex-col space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Beverage Mug</span>
                  <div className="flex space-x-1.5">
                    {['#ef4444', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'].map((c) => (
                      <button
                        key={c}
                        onClick={() => updateDesk(activeDesk, { mugColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                          desks[activeDesk]?.mugColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 font-bold text-center leading-normal">
                  💡 Tip: Click your coffee mug to take a sip!
                </div>
              </div>
            )}

            {/* TAB CONTENT: AVATAR DRESS UP */}
            {(activeDesk === null || activeTab === 'avatar') && (
              <div className="flex flex-col space-y-4">
                {/* Character Class (Robot vs Human) */}
                <div className="flex flex-col space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Sitter Class</span>
                  <div className="grid grid-cols-2 gap-1 bg-slate-900/5 p-0.5 rounded-xl border border-slate-200/50">
                    <button
                      onClick={() => setOutfit((prev) => ({ ...prev, type: 'robot' }))}
                      className={`py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                        outfit.type === 'robot' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🤖 Robot
                    </button>
                    <button
                      onClick={() => setOutfit((prev) => ({ ...prev, type: 'human' }))}
                      className={`py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                        outfit.type === 'human' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🧑 Human
                    </button>
                  </div>
                </div>

                {/* Human Customization Options */}
                {outfit.type === 'human' && (
                  <>
                    {/* Hair Style */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Hair Style</span>
                      <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-900/5 rounded-xl">
                        {(['none', 'short', 'long', 'cap'] as const).map((style) => (
                          <button
                            key={style}
                            onClick={() => setOutfit((prev) => ({ ...prev, hairStyle: style }))}
                            className={`py-1 text-[9px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                              outfit.hairStyle === style ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {style === 'none' ? 'Bald' : style === 'short' ? 'Crop' : style === 'long' ? 'Locks' : 'Cap'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Hair Color */}
                    {outfit.hairStyle !== 'none' && outfit.hairStyle !== 'cap' && (
                      <div className="flex flex-col space-y-1.5">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Hair Color</span>
                        <div className="flex space-x-1.5">
                          {['#111827', '#ca8a04', '#3b2314', '#ec4899', '#84cc16'].map((c) => (
                            <button
                              key={c}
                              onClick={() => setOutfit((prev) => ({ ...prev, hairColor: c }))}
                              style={{ backgroundColor: c }}
                              className={`w-6.5 h-6.5 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                                outfit.hairColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skin Tone */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Skin Tone</span>
                      <div className="flex space-x-1.5">
                        {['#fed7aa', '#fbcfe8', '#d97706', '#ffedd5', '#ca8a04'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setOutfit((prev) => ({ ...prev, skinTone: c }))}
                            style={{ backgroundColor: c }}
                            className={`w-6.5 h-6.5 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                              outfit.skinTone === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Clothes Color */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Clothes Color</span>
                      <div className="flex space-x-1.5">
                        {['#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899'].map((c) => (
                          <button
                            key={c}
                            onClick={() => setOutfit((prev) => ({ ...prev, clothingColor: c }))}
                            style={{ backgroundColor: c }}
                            className={`w-6.5 h-6.5 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                              outfit.clothingColor === c ? 'border-indigo-600 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Accessories (Common to both) */}
                <div className="flex flex-col space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Accessories</span>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Classic Glasses</span>
                    <button
                      onClick={() => setOutfit((prev) => ({ ...prev, hasGlasses: !prev.hasGlasses }))}
                      className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-lg border transition-all duration-200 cursor-pointer ${
                        outfit.hasGlasses
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white'
                      }`}
                    >
                      {outfit.hasGlasses ? 'Equipped' : 'Equip'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">DJ Headphones</span>
                    <button
                      onClick={() => setOutfit((prev) => ({ ...prev, hasHeadphones: !prev.hasHeadphones }))}
                      className={`px-3 py-1 text-[9px] font-extrabold uppercase rounded-lg border transition-all duration-200 cursor-pointer ${
                        outfit.hasHeadphones
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                          : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white'
                      }`}
                    >
                      {outfit.hasHeadphones ? 'Equipped' : 'Equip'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ---------------- BOTTOM BAR / DASHBOARD OVERLAY ---------------- */}
      <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-end space-y-4 md:space-y-0 md:space-x-4 pointer-events-none">
        
        {/* Left column: Help and Focus Audio */}
        <div className="flex flex-col space-y-3.5 w-full max-w-sm">
          {/* Help/Guide Panel */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md pointer-events-auto border border-white"
              >
                <div className="flex items-center space-x-2 text-indigo-700 mb-2.5">
                  <Sparkles size={18} className="animate-pulse" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider">How to interact:</h3>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">🗣️</span>
                    <span>Speak normally to make the character's head bob and desk lamps pulse to your voice.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">🎉</span>
                    <span>Shout or clap loudly to launch floating emoji particles above their head!</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-500 mr-2">🪑</span>
                    <span>Click on any empty desk chair to sit and work. Click on your coffee mug to sip.</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Focus Soundscapes Panel */}
          <div className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md pointer-events-auto border border-white">
            <div className="flex items-center space-x-2 text-indigo-700 mb-2.5">
              <Volume2 size={18} className="animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">Focus Ambient Soundscapes</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'rain', label: '🌧️ Rain' },
                { id: 'wind', label: '🍃 Wind' },
                { id: 'bells', label: '🔔 Bells' }
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    const ctx = getAudioContext();
                    if (activeSoundscape === s.id) {
                      stopAllSoundscapes();
                    } else {
                      stopAllSoundscapes();
                      setActiveSoundscape(s.id);
                      if (s.id === 'rain') startRain(ctx);
                      else if (s.id === 'wind') startWind(ctx);
                      else if (s.id === 'bells') startBells(ctx);
                    }
                  }}
                  className={`py-2.5 px-1.5 text-xs font-extrabold rounded-xl transition-all duration-300 border cursor-pointer flex flex-col items-center justify-center space-y-1.5 ${
                    activeSoundscape === s.id
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-105'
                      : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <span>{s.label}</span>
                  <span className="text-[9px] font-bold opacity-80">
                    {activeSoundscape === s.id ? 'Playing' : 'Play'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Audio Visualizer Corner Console (Right Column) */}
        {status === 'connected' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 md:p-5 rounded-2xl max-w-xs w-full shadow-md pointer-events-auto flex flex-col space-y-3.5 border border-white"
          >
            {/* Visualizer Canvas */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center space-x-1.5 text-indigo-700">
                  <Volume2 size={16} />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Live Input</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">16-Band Frequency</span>
              </div>
              <canvas 
                ref={visualizerCanvasRef} 
                className="w-full h-14 bg-slate-900/5 rounded-xl border border-slate-200/50" 
              />
            </div>

            {/* Volume Decibel/RMS bar */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1">
                <span>Mic Level Gauge</span>
                <span className="font-mono">{Math.round(currentVolumeValue * 100)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/40">
                <div 
                  className={`h-full rounded-full transition-all duration-75 ${getVolumeMeterColor(currentVolumeValue)} shadow-sm`}
                  style={{ width: `${currentVolumeValue * 100}%` }}
                />
              </div>
            </div>

            {/* Micro Indicator of Shout Threshold */}
            <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" /> Talking Range
              </span>
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" /> Emoji Shout Trigger (&gt;45%)
              </span>
            </div>
          </motion.div>
        )}
      </div>

    </div>
  );
};
