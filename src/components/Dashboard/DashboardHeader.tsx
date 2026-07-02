import React from 'react';
import { HelpCircle, Mic, MicOff, LogOut } from 'lucide-react';

interface DashboardHeaderProps {
  theme: 'day' | 'sunset' | 'night';
  setTheme: (theme: 'day' | 'sunset' | 'night') => void;
  showHelp: boolean;
  setShowHelp: (show: boolean) => void;
  status: string;
  isMuted: boolean;
  toggleMute: () => void;
  disconnectMicrophone: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  theme,
  setTheme,
  showHelp,
  setShowHelp,
  status,
  isMuted,
  toggleMute,
  disconnectMicrophone
}) => {
  return (
    <div className="w-full flex justify-between items-start pointer-events-auto select-none">
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
  );
};
