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
        return 'from-[#211006] via-[#5a3414] to-[#0f0905]';
      case 'night':
        return 'from-[#0b0f19] via-[#1a1b35] to-[#05060b]';
      case 'day':
      default:
        return 'from-[#f7fbff] via-[#eef8ff] to-[#eefcf7]';
    }
  };

  return (
    <AudioAnalyzerProvider>
      {/* 
        Container with a soothing pastel mesh/linear gradient.
        Transitioning dynamically between Day, Sunset, and Cyber-Night.
      */}
      <main className={`relative w-full h-full min-h-screen overflow-hidden bg-gradient-to-br ${getThemeBgClass()} flex items-center justify-center select-none transition-colors duration-700`}>
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
            theme === 'day'
              ? 'bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.95),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(191,219,254,0.55),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.02))]'
              : theme === 'sunset'
                ? 'bg-[radial-gradient(circle_at_18%_14%,rgba(251,191,36,0.42),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(251,146,60,0.26),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.14))]'
                : 'bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.22),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.2))]'
          }`}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_35%,rgba(0,0,0,0.07)_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(15,23,42,0.08)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/20 to-transparent" />
        
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
