import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Mic, PartyPopper, Armchair } from 'lucide-react';

interface HelpPanelProps {
  showHelp: boolean;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ showHelp }) => {
  if (!showHelp) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="glass-panel p-4 md:p-5 rounded-2xl w-full shadow-md pointer-events-auto border border-white select-none"
    >
      <div className="flex items-center space-x-2 text-indigo-700 mb-2.5">
        <Sparkles size={18} className="animate-pulse" />
        <h3 className="text-xs font-extrabold uppercase tracking-wider">How to interact:</h3>
      </div>
      <ul className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed">
        <li className="flex items-start">
          <span className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0"><Mic size={14} /></span>
          <span>Speak normally to make the character's head bob and desk lamps pulse to your voice.</span>
        </li>
        <li className="flex items-start">
          <span className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0"><PartyPopper size={14} /></span>
          <span>Shout or clap loudly to launch floating emoji particles above their head!</span>
        </li>
        <li className="flex items-start">
          <span className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0"><Armchair size={14} /></span>
          <span>Click on any empty desk chair to sit and work. Press Spacebar or click on your coffee mug to sit/exit/sip.</span>
        </li>
      </ul>
    </motion.div>
  );
};
