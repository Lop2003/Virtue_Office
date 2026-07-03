import { useRef, useState } from "react";
import { AudioAnalyzerProvider } from "./context/AudioAnalyzerContext";
import { MultiplayerProvider } from "./context/MultiplayerContext";
import { OfficeScene, DESK_CONFIGS } from "./components/OfficeScene";
import { Dashboard } from "./components/Dashboard";
import type { EmojiParticlesHandle } from "./components/EmojiParticles";
import type { DeskConfig } from "./components/OfficeScene";
import {
  CHARACTER_OPTIONS,
  type AvatarType,
  type CharacterOption,
} from "./utils/avatarCharacters";

export interface AvatarOutfit {
  type: AvatarType;
  characterId: string;
  modelUrl?: string;
  modelScale?: number;
  modelYOffset?: number;
  modelRotationY?: number;
  hairStyle: "short" | "long" | "cap" | "none";
  hairColor: string;
  clothingStyle: "shirt" | "hoodie" | "suit";
  clothingColor: string;
  skinTone: string;
  hasGlasses: boolean;
  hasHeadphones: boolean;
}

function App() {
  // Reference to trigger 3D emoji spawning from volume events
  const emojiParticlesRef = useRef<EmojiParticlesHandle>(null);

  // Creative features state lifting
  const [theme, setTheme] = useState<"day" | "sunset" | "night">("day");
  const [environmentType, setEnvironmentType] = useState<"nature" | "city">(
    "nature",
  );
  const [desks, setDesks] = useState<DeskConfig[]>(DESK_CONFIGS);
  const [sipTrigger, setSipTrigger] = useState<number>(0);
  const [activeDesk, setActiveDesk] = useState<number | null>(null);
  const [hasEnteredOffice, setHasEnteredOffice] = useState<boolean>(false);
  const [playerName, setPlayerName] = useState<string>("");
  const [outfit, setOutfit] = useState<AvatarOutfit>({
    type: "robot",
    characterId: "robot",
    hairStyle: "short",
    hairColor: "#ca8a04",
    clothingStyle: "hoodie",
    clothingColor: "#3b82f6",
    skinTone: "#fed7aa",
    hasGlasses: false,
    hasHeadphones: false,
  });

  const [sunIntensityMulti, setSunIntensityMulti] = useState<number>(1.0);
  const [ambientIntensityMulti, setAmbientIntensityMulti] = useState<number>(1.0);

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

  const updateDesk = (deskId: number, updates: Partial<DeskConfig>) => {
    setDesks((prev) =>
      prev.map((d) => (d.id === deskId ? { ...d, ...updates } : d)),
    );
  };

  const triggerSip = (deskPosition: [number, number, number]) => {
    setSipTrigger((prev) => prev + 1);
    if (emojiParticlesRef.current) {
      // Mug is offset [-0.3, 0.85, -0.15] relative to the desk center
      const mugPos: [number, number, number] = [
        deskPosition[0] - 0.3,
        deskPosition[1] + 0.95,
        deskPosition[2] - 0.15,
      ];
      emojiParticlesRef.current.spawn("♨️", mugPos);
      setTimeout(() => {
        emojiParticlesRef.current?.spawn("💨", [
          mugPos[0] + (Math.random() - 0.5) * 0.1,
          mugPos[1] + 0.2,
          mugPos[2] + (Math.random() - 0.5) * 0.1,
        ]);
      }, 150);
      setTimeout(() => {
        emojiParticlesRef.current?.spawn("✨", [
          mugPos[0] + (Math.random() - 0.5) * 0.1,
          mugPos[1] + 0.4,
          mugPos[2] + (Math.random() - 0.5) * 0.1,
        ]);
      }, 300);
    }
  };

  const getThemeBgClass = () => {
    switch (theme) {
      case "sunset":
        return "from-[#211006] via-[#5a3414] to-[#0f0905]";
      case "night":
        return "from-[#0b0f19] via-[#1a1b35] to-[#05060b]";
      case "day":
      default:
        return "from-[#f7fbff] via-[#eef8ff] to-[#eefcf7]";
    }
  };

  return (
    <MultiplayerProvider>
      <AudioAnalyzerProvider>
        {/*
        Container with a soothing pastel mesh/linear gradient.
        Transitioning dynamically between Day, Sunset, and Cyber-Night.
      */}
        <main
          className={`relative w-full h-full min-h-screen overflow-hidden bg-gradient-to-br ${getThemeBgClass()} flex items-center justify-center select-none transition-colors duration-700`}
        >
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${
              theme === "day"
                ? "bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.95),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(191,219,254,0.55),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.28),rgba(255,255,255,0.02))]"
                : theme === "sunset"
                  ? "bg-[radial-gradient(circle_at_18%_14%,rgba(251,191,36,0.42),transparent_30%),radial-gradient(circle_at_82%_22%,rgba(251,146,60,0.26),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.14))]"
                  : "bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.22),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.2))]"
            }`}
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_35%,rgba(0,0,0,0.07)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(15,23,42,0.08)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/20 to-transparent" />

          {!hasEnteredOffice ? (
            <section className="relative z-10 w-full max-w-5xl px-6 py-8">
              <div className="mb-7 max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">
                  Virtual Office
                </p>
                <h1 className="mt-2 text-4xl md:text-6xl font-black text-slate-950 leading-none">
                  Choose your sitter.
                </h1>
                <p className="mt-4 text-sm md:text-base font-semibold text-slate-600 max-w-xl">
                  Pick a character before entering the workspace. You can still
                  change it later from the avatar panel.
                </p>
                <div className="mt-5">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5">
                    Your name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && playerName.trim())
                        setHasEnteredOffice(true);
                    }}
                    placeholder="e.g. Alex, ท็อป, Rin..."
                    maxLength={20}
                    className="w-72 rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {CHARACTER_OPTIONS.map((character) => {
                  const isSelected = outfit.characterId === character.id;
                  return (
                    <button
                      key={character.id}
                      onClick={() => selectCharacter(character)}
                      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-slate-950 bg-white shadow-2xl -translate-y-1"
                          : "border-white/70 bg-white/55 hover:bg-white/85 hover:-translate-y-0.5 shadow-lg"
                      }`}
                    >
                      <div
                        className="absolute inset-x-0 top-0 h-1.5"
                        style={{ backgroundColor: character.accent }}
                      />
                      <div
                        className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-white shadow-lg"
                        style={{ backgroundColor: character.accent }}
                      >
                        {character.name.slice(0, 1)}
                      </div>
                      <h2 className="text-lg font-black text-slate-950">
                        {character.name}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {character.subtitle}
                      </p>
                      <div
                        className={`mt-5 h-1.5 rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-slate-950"
                            : "bg-slate-200 group-hover:bg-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setHasEnteredOffice(true)}
                disabled={!playerName.trim()}
                className="mt-7 rounded-2xl bg-slate-950 px-7 py-3 text-sm font-black text-white shadow-2xl transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                Enter Office
              </button>
            </section>
          ) : (
            <>
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
                  playerName={playerName.trim() || "Player"}
                  sunIntensityMulti={sunIntensityMulti}
                  ambientIntensityMulti={ambientIntensityMulti}
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
                sunIntensityMulti={sunIntensityMulti}
                setSunIntensityMulti={setSunIntensityMulti}
                ambientIntensityMulti={ambientIntensityMulti}
                setAmbientIntensityMulti={setAmbientIntensityMulti}
              />
            </>
          )}
        </main>
      </AudioAnalyzerProvider>
    </MultiplayerProvider>
  );
}

export default App;
