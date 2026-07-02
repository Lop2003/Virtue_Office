import React, { useState } from 'react';
import { Minus, Square } from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isPlayer: boolean;
}

interface ChatBoxProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  setChatInput: (value: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  theme: 'day' | 'sunset' | 'night';
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  chatHistory,
  chatInput,
  setChatInput,
  handleSendMessage,
  theme
}) => {
  const isNight = theme === 'night';
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-[90px] left-4 z-50 w-72 backdrop-blur-md rounded-xl shadow-2xl flex flex-col overflow-hidden font-sans text-xs select-auto pointer-events-auto transition-all duration-300 border ${
        isNight 
          ? 'bg-slate-900/85 border-slate-700/80 text-white' 
          : 'bg-white/85 border-white/60 text-slate-800'
      } ${isMinimized ? 'h-10' : 'h-64'}`}
    >
      {/* Chat Header */}
      <div className={`px-3 py-2 border-b flex justify-between items-center select-none ${
        isNight ? 'bg-slate-800/80 border-slate-700/80 text-slate-100' : 'bg-slate-50/70 border-slate-200/60 text-slate-800'
      }`}>
        <span className="font-bold tracking-wide flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          ช่องแชทออฟฟิศ
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono ${isNight ? 'text-slate-400' : 'text-slate-500'}`}>Ufriend chat</span>
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className={`p-1 rounded-md transition-colors ${isNight ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
          >
            {isMinimized ? <Square size={12} /> : <Minus size={12} />}
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div 
        className={`flex-1 p-3 overflow-y-auto space-y-2 scrollbar-thin ${
          isNight ? 'scrollbar-thumb-slate-700' : 'scrollbar-thumb-slate-200'
        }`}
        ref={(el) => {
          if (el) el.scrollTop = el.scrollHeight;
        }}
      >
        {chatHistory.map((msg) => (
          <div key={msg.id} className="leading-relaxed">
            <span className={`text-[9px] font-mono mr-1.5 ${isNight ? 'text-slate-500' : 'text-slate-400'}`}>{msg.timestamp}</span>
            <span className={`font-bold mr-1 ${
              msg.isPlayer 
                ? (isNight ? 'text-cyan-400' : 'text-indigo-600') 
                : (isNight ? 'text-amber-400' : 'text-amber-600')
            }`}>
              {msg.sender}:
            </span>
            <span className={`${isNight ? 'text-slate-200' : 'text-slate-700'} selection:bg-indigo-200`}>{msg.text}</span>
          </div>
        ))}
      </div>

      {/* Chat Input Input Form */}
      <form onSubmit={handleSendMessage} className={`p-2 border-t flex gap-1.5 ${
        isNight ? 'border-slate-700/80 bg-slate-950/40' : 'border-slate-200/60 bg-slate-50/40'
      }`}>
        <input 
          type="text" 
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="พิมพ์ข้อความที่นี่... (Enter เพื่อส่ง)"
          className={`flex-1 border focus:outline-none rounded-lg px-2.5 py-1 text-xs transition-colors ${
            isNight 
              ? 'bg-slate-800/80 border-slate-700 focus:border-cyan-500 text-slate-100 placeholder-slate-500' 
              : 'bg-white/80 border-slate-200 focus:border-indigo-500 text-slate-800 placeholder-slate-400'
          }`}
        />
        <button 
          type="submit"
          className={`focus:outline-none px-3 py-1 rounded-lg font-semibold transition-colors shadow-md active:scale-95 cursor-pointer ${
            isNight 
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          ส่ง
        </button>
      </form>
    </div>
  );
};
