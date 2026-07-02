import React from 'react';
import { Volume1, Volume2, Music, Play, Pause, SkipForward, Trash2, CloudRain, Wind, Bell } from 'lucide-react';

interface FocusSoundscapesProps {
  activeSoundscape: string | null;
  onToggleSoundscape: (id: string) => void;
  ytUrl: string;
  setYtUrl: (url: string) => void;
  ytVolume: number;
  onYtVolumeChange: (vol: number) => void;
  isYtPlaying: boolean;
  onToggleYtPlay: () => void;
  onAddTrack: (url: string, playNow: boolean) => void;
  playlist: { id: string; title: string }[];
  currentTrackIndex: number;
  onRemoveTrack: (index: number) => void;
  onPlayTrack: (index: number) => void;
  onSkipTrack: () => void;
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
  onAddTrack,
  playlist,
  currentTrackIndex,
  onRemoveTrack,
  onPlayTrack,
  onSkipTrack
}) => {
  return (
    <div className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md pointer-events-auto border border-white select-none">
      <div className="flex items-center space-x-2 text-indigo-700 mb-2.5">
        <Volume2 size={18} className="animate-pulse" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider">Focus Ambient Soundscapes</h3>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'rain', label: 'Rain', icon: <CloudRain size={16} /> },
          { id: 'wind', label: 'Wind', icon: <Wind size={16} /> },
          { id: 'bells', label: 'Bells', icon: <Bell size={16} /> }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => onToggleSoundscape(s.id)}
            className={`py-2 px-1 text-xs font-extrabold rounded-xl transition-all duration-300 border cursor-pointer flex flex-col items-center justify-center space-y-1 ${
              activeSoundscape === s.id
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md transform scale-105'
                : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white hover:border-slate-300'
            }`}
          >
            {s.icon}
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
        
        <div className="flex flex-col gap-1.5">
          <input 
            type="text" 
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            placeholder="วางลิงก์ YouTube ที่นี่..."
            className="w-full bg-white/80 border border-slate-200 focus:border-indigo-500 focus:outline-none rounded-lg px-2.5 py-1 text-[11px] text-slate-800 placeholder-slate-400 transition-colors"
          />
          <div className="flex gap-1.5">
            <button 
              onClick={() => onAddTrack(ytUrl, true)}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-extrabold py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm text-center"
            >
              เล่นเลย
            </button>
            <button 
              onClick={() => onAddTrack(ytUrl, false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-extrabold py-1.5 rounded-lg transition-colors cursor-pointer active:scale-95 shadow-sm text-center"
            >
              เพิ่มคิว
            </button>
          </div>
        </div>

        {/* Playlist Queue */}
        {playlist.length > 0 && (
          <div className="flex flex-col space-y-1 mt-1 bg-slate-900/5 p-2 rounded-xl border border-slate-200/50 max-h-24 overflow-y-auto no-scrollbar">
            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">คิวเพลง ({playlist.length})</span>
            <div className="flex flex-col space-y-0.5">
              {playlist.map((track, index) => {
                const isCurrent = index === currentTrackIndex && activeSoundscape === 'youtube';
                return (
                  <div 
                    key={track.id + '-' + index} 
                    className={`flex items-center justify-between text-[10px] p-1 rounded-md transition-colors ${
                      isCurrent 
                        ? 'bg-indigo-100 text-indigo-700 font-bold' 
                        : 'hover:bg-slate-200/50 text-slate-600'
                    }`}
                  >
                    <button 
                      onClick={() => onPlayTrack(index)}
                      className="flex-1 text-left truncate pr-2 cursor-pointer font-sans"
                      title="เล่นเพลงนี้"
                    >
                      <span className="flex items-center space-x-1 inline-flex max-w-full">
                        {isCurrent && isYtPlaying && <Volume2 size={12} className="text-indigo-600 animate-pulse flex-shrink-0" />}
                        <span className="truncate">{track.title}</span>
                      </span>
                    </button>
                    <button 
                      onClick={() => onRemoveTrack(index)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 cursor-pointer"
                      title="ลบออกจากคิว"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeSoundscape === 'youtube' && playlist.length > 0 && (
          <div className="flex flex-col space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1 truncate max-w-[180px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0"></span>
                <span className="truncate">เล่นอยู่: {playlist[currentTrackIndex]?.title}</span>
              </span>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={onToggleYtPlay}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1.5 transition-colors cursor-pointer text-slate-600 active:scale-90"
                  title={isYtPlaying ? 'หยุด' : 'เล่น'}
                >
                  {isYtPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button 
                  onClick={onSkipTrack}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg p-1.5 transition-colors cursor-pointer text-slate-600 active:scale-90"
                  title="ข้ามเพลง"
                >
                  <SkipForward size={12} />
                </button>
              </div>
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
