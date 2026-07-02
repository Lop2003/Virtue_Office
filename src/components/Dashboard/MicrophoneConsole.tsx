import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, AlertTriangle, RotateCcw } from 'lucide-react';

interface MicrophoneConsoleProps {
  status: string;
  error: string | null;
  connectMicrophone: () => void;
  currentVolumeValue: number;
  visualizerCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export const MicrophoneConsole: React.FC<MicrophoneConsoleProps> = ({
  status,
  error,
  connectMicrophone,
  currentVolumeValue,
  visualizerCanvasRef
}) => {
  const getVolumeMeterColor = (val: number) => {
    if (val > 0.45) return 'bg-rose-500 shadow-rose-300';
    if (val > 0.15) return 'bg-amber-500 shadow-amber-300';
    return 'bg-emerald-500 shadow-emerald-300';
  };

  return (
    <div className="w-full max-w-xs pointer-events-auto select-none">
      <AnimatePresence mode="wait">
        
        {/* Onboarding Connect Screen */}
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-panel p-6 rounded-3xl text-center shadow-lg border border-white flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Volume2 className="text-indigo-600 animate-pulse" size={24} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 mb-1.5">Interactive Audio Input</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Connect your microphone to control character animations and shoot emojis with your voice.
            </p>
            <button
              onClick={connectMicrophone}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider shadow transition-all duration-200 cursor-pointer"
            >
              Connect Microphone
            </button>
          </motion.div>
        )}

        {/* Loading Request Screen */}
        {status === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel p-6 rounded-3xl text-center shadow-md border border-white flex flex-col items-center"
          >
            <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin mb-4" />
            <p className="text-xs font-semibold text-slate-700">Requesting microphone access...</p>
          </motion.div>
        )}

        {/* Error Screen */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel p-6 rounded-3xl text-center shadow-xl border-l-4 border-l-rose-500 border border-white flex flex-col items-center"
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            <h2 className="text-sm font-bold text-slate-800 mb-1.5">Microphone Blocked</h2>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
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

        {/* Connected Visualizer Console */}
        {status === 'connected' && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md flex flex-col space-y-3.5 border border-white"
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

      </AnimatePresence>
    </div>
  );
};
