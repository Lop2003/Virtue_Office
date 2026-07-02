import React from 'react';
import { Volume1, Volume2, Music, Play, Pause } from 'lucide-react';

interface FocusSoundscapesProps {
  activeSoundscape: string | null;
  onToggleSoundscape: (id: string) => void;
  ytUrl: string;
  setYtUrl: (url: string) => void;
  ytVolume: number;
  onYtVolumeChange: (vol: number) => void;
  isYtPlaying: boolean;
  onToggleYtPlay: () => void;
  onPlayYoutube: () => void;
}

export const FocusSoundscapes: React.FC<FocusSoundscapesProps> = ({
  activeSoundscape,
  onToggleSoundscape,
  ytUrl,
  setYtUrl,
  ytVolume,
  onYtVolumeChange,
  isYtPlaying,
  onToggleYtPlay,
  onPlayYoutube
}) => {
  return (
    <div className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md pointer-events-auto border border-white select-none">
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
            onClick={() => onToggleSoundscape(s.id)}
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

      {/* YouTube Audio Stream Section */}
      <div className="h-px bg-slate-200/50 my-3" />
      <div className="flex flex-col space-y-2 text-slate-700">
        <div className="flex items-center space-x-1.5 text-indigo-700">
          <Music size={14} />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">YouTube Background Music</span>
        </div>
        
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            onPlayYoutube();
          }}
          className="flex gap-1.5"
        >
          <input 
            type="text" 
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="วางลิงก์ YouTube ที่นี่..."
            className="flex-1 bg-white/80 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 text-[11px] text-slate-800 placeholder-slate-400 transition-colors"
          />
          <button 
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm"
          >
            เล่น
          </button>
        </form>

        {activeSoundscape === 'youtube' && (
          <div className="flex flex-col space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                กำลังเล่นเพลงจาก YouTube
              </span>
              <button 
                onClick={onToggleYtPlay}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1.5 transition-colors cursor-pointer text-slate-600 active:scale-90"
              >
                {isYtPlaying ? <Pause size={12} /> : <Play size={12} />}
              </button>
            </div>

            {/* Volume Controller Slider */}
            <div className="flex items-center space-x-2 bg-slate-900/5 p-2 rounded-xl border border-slate-200/50">
              <Volume1 size={13} className="text-slate-400" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={ytVolume} 
                onChange={(e) => onYtVolumeChange(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <Volume2 size={13} className="text-indigo-600" />
              <span className="text-[10px] font-mono text-slate-600 font-bold min-w-[24px] text-right">{ytVolume}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
