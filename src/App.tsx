import { useRef, useState } from 'react';
import { AudioAnalyzerProvider } from './context/AudioAnalyzerContext';
import { OfficeScene, DESK_CONFIGS } from './components/OfficeScene';
import { Dashboard } from './components/Dashboard';
import type { EmojiParticlesHandle } from './components/EmojiParticles';
import type { DeskConfig } from './components/OfficeScene';

export interface AvatarOutfit {
  type: 'robot' | 'human';
  hairStyle: 'short' | 'long' | 'cap' | 'none';
  hairColor: string;
  clothingStyle: 'shirt' | 'hoodie' | 'suit';
  clothingColor: string;
  skinTone: string;
  hasGlasses: boolean;
  hasHeadphones: boolean;
}

function App() {
  // Reference to trigger 3D emoji spawning from volume events
  const emojiParticlesRef = useRef<EmojiParticlesHandle>(null);

  // Creative features state lifting
  const [theme, setTheme] = useState<'day' | 'sunset' | 'night'>('day');
  const [environmentType, setEnvironmentType] = useState<'nature' | 'city'>('nature');
  const [desks, setDesks] = useState<DeskConfig[]>(DESK_CONFIGS);
  const [sipTrigger, setSipTrigger] = useState<number>(0);
  const [activeDesk, setActiveDesk] = useState<number | null>(null);
  const [outfit, setOutfit] = useState<AvatarOutfit>({
    type: 'robot',
    hairStyle: 'short',
    hairColor: '#ca8a04',
    clothingStyle: 'hoodie',
    clothingColor: '#3b82f6',
    skinTone: '#fed7aa',
    hasGlasses: false,
    hasHeadphones: false
  });

  const updateDesk = (deskId: number, updates: Partial<DeskConfig>) => {
    setDesks((prev) =>
      prev.map((d) => (d.id === deskId ? { ...d, ...updates } : d))
    );
  };

  const triggerSip = (deskPosition: [number, number, number]) => {
    setSipTrigger((prev) => prev + 1);
    if (emojiParticlesRef.current) {
      // Mug is offset [-0.3, 0.85, -0.15] relative to the desk center
      const mugPos: [number, number, number] = [
        deskPosition[0] - 0.3,
        deskPosition[1] + 0.95,
        deskPosition[2] - 0.15
      ];
      emojiParticlesRef.current.spawn('♨️', mugPos);
      setTimeout(() => {
        emojiParticlesRef.current?.spawn('💨', [
          mugPos[0] + (Math.random() - 0.5) * 0.1,
          mugPos[1] + 0.2,
          mugPos[2] + (Math.random() - 0.5) * 0.1
        ]);
      }, 150);
      setTimeout(() => {
        emojiParticlesRef.current?.spawn('✨', [
          mugPos[0] + (Math.random() - 0.5) * 0.1,
          mugPos[1] + 0.4,
          mugPos[2] + (Math.random() - 0.5) * 0.1
        ]);
      }, 300);
    }
  };

  const getThemeBgClass = () => {
    switch (theme) {
      case 'sunset':
        return 'from-orange-100 via-rose-100 to-indigo-100';
      case 'night':
        return 'from-[#0b0f19] via-[#1a1b35] to-[#05060b]';
      case 'day':
      default:
        return 'from-amber-50 via-indigo-50 to-cyan-50';
    }
  };

  const getThemeOrbClasses = () => {
    switch (theme) {
      case 'sunset':
        return {
          orb1: 'bg-orange-300/30',
          orb2: 'bg-rose-300/20',
        };
      case 'night':
        return {
          orb1: 'bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.2)]',
          orb2: 'bg-fuchsia-500/10 shadow-[0_0_50px_rgba(217,70,239,0.1)]',
        };
      case 'day':
      default:
        return {
          orb1: 'bg-purple-200/40',
          orb2: 'bg-cyan-200/30',
        };
    }
  };

  const orbs = getThemeOrbClasses();

  return (
    <AudioAnalyzerProvider>
      {/* 
        Container with a soothing pastel mesh/linear gradient.
        Transitioning dynamically between Day, Sunset, and Cyber-Night.
      */}
      <main className={`relative w-full h-full min-h-screen overflow-hidden bg-gradient-to-tr ${getThemeBgClass()} flex items-center justify-center select-none transition-colors duration-1000`}>
        
        {/* Floating background decorative glowing orbs */}
        <div className={`absolute top-1/4 left-1/4 w-80 h-80 ${orbs.orb1} rounded-full filter blur-3xl pointer-events-none animate-pulse transition-colors duration-1000`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 ${orbs.orb2} rounded-full filter blur-3xl pointer-events-none animate-pulse delay-1000 transition-colors duration-1000`} />
        
        {/* 3D R3F Canvas Container */}
        <div className="w-full h-full z-0">
          <OfficeScene 
            emojiParticlesRef={emojiParticlesRef} 
            theme={theme}
            environmentType={environmentType}
            desks={desks}
            sipTrigger={sipTrigger}
            triggerSip={triggerSip}
            activeDesk={activeDesk}
            setActiveDesk={setActiveDesk}
            outfit={outfit}
          />
        </div>

        {/* Dashboard UI layer (Buttons, Visualizer, Onboarding, Instructions) */}
        <Dashboard 
          theme={theme}
          setTheme={setTheme}
          environmentType={environmentType}
          setEnvironmentType={setEnvironmentType}
          desks={desks}
          updateDesk={updateDesk}
          activeDesk={activeDesk}
          outfit={outfit}
          setOutfit={setOutfit}
        />
        
      </main>
    </AudioAnalyzerProvider>
  );
}

export default App;

