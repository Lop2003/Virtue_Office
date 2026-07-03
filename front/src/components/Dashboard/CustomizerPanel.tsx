import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Armchair, Shirt, Minus, Square } from 'lucide-react';
import type { DeskConfig } from '../OfficeScene';
import type { AvatarOutfit } from '../../App';
import { CHARACTER_OPTIONS, type CharacterOption } from '../../utils/avatarCharacters';

interface CustomizerPanelProps {
  activeDesk: number | null;
  desks: DeskConfig[];
  updateDesk: (deskId: number, updates: Partial<DeskConfig>) => void;
  outfit: AvatarOutfit;
  setOutfit: React.Dispatch<React.SetStateAction<AvatarOutfit>>;
}

export const CustomizerPanel: React.FC<CustomizerPanelProps> = ({
  activeDesk,
  desks,
  updateDesk,
  outfit,
  setOutfit
}) => {
  const [activeTab, setActiveTab] = useState<'desk' | 'avatar'>('avatar');
  const [isMinimized, setIsMinimized] = useState(false);
  
  const selectCharacter = (character: CharacterOption) => {
    setOutfit((prev) => ({
      ...prev,
      type: character.type,
      characterId: character.id,
      modelUrl: character.modelUrl,
      modelScale: character.modelScale,
      modelYOffset: character.modelYOffset,
      modelRotationY: character.modelRotationY,
    }));
  };

  return (
    <div className="absolute right-4 top-24 pointer-events-auto flex flex-col items-end space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          className={`glass-panel p-5 rounded-2.5xl shadow-lg border border-white max-w-[285px] w-full flex flex-col space-y-4 transition-all duration-300 ${isMinimized ? 'h-14 overflow-hidden' : ''}`}
        >
          {/* Header with Minimize Toggle */}
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center space-x-2 text-indigo-700">
              <Sparkles size={16} className="animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">Customizer</h3>
            </div>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-md transition-colors hover:bg-white/50 text-indigo-700 cursor-pointer"
            >
              {isMinimized ? <Square size={14} /> : <Minus size={14} />}
            </button>
          </div>

          {!isMinimized && (
            <>
          {/* Tab Header (Only show tab switcher if seated) */}
          {activeDesk !== null && (
            <div className="grid grid-cols-2 gap-1 bg-slate-900/5 p-0.5 rounded-xl border border-slate-200/50">
              <button
                onClick={() => setActiveTab('desk')}
                className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 ${
                  activeTab === 'desk' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Armchair size={12} />
                <span>Desk</span>
              </button>
              <button
                onClick={() => setActiveTab('avatar')}
                className={`py-1.5 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-1 ${
                  activeTab === 'avatar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Shirt size={12} />
                <span>Avatar</span>
              </button>
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
            </div>
          )}

          {/* TAB CONTENT: AVATAR */}
          {(activeDesk === null || activeTab === 'avatar') && (
            <div className="flex flex-col space-y-4">
              
              {/* Character Selector */}
              <div className="flex flex-col space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Character</span>
                <div className="grid grid-cols-2 gap-1 bg-slate-900/5 p-0.5 rounded-xl border border-slate-200/50">
                  {CHARACTER_OPTIONS.map((character) => (
                    <button
                      key={character.id}
                      onClick={() => selectCharacter(character)}
                      className={`py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all duration-200 cursor-pointer ${
                        outfit.characterId === character.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {character.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit color & accessories selectors (Only show for Humans) */}
              {outfit.type === 'human' && (
                <>
                  {/* Skin Tone */}
                  <div className="flex flex-col space-y-1.5">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wide">Skin Tone</span>
                    <div className="flex space-x-1.5">
                      {['#ffd1b3', '#fcd5b5', '#e0ac69', '#c68642', '#8d5524'].map((c) => (
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

                  {/* Accessories */}
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
                </>
              )}
            </div>
          )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
