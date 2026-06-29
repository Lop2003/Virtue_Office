import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import { Colleague } from './Colleague';
import type { DeskConfig } from './OfficeScene';

interface OfficeDeskProps {
  id: number;
  position: [number, number, number];
  rotationY?: number;
  hasLaptop?: boolean;
  hasLamp?: boolean;
  hasPlant?: boolean;
  hasMug?: boolean;
  hasChair?: boolean;
  chairColor?: string;
  lampColor?: string;
  mugColor?: string;
  deskColor?: string;
  laptopColor?: string;
  glowColor?: string;
  lightIntensity?: number;
  onSelect: (id: number) => void;
  // Creative properties
  activeDesk: number | null;
  triggerSip: (deskPosition: [number, number, number]) => void;
  theme: 'day' | 'sunset' | 'night';
}

// Reusable desk component with mouse hover effects, click-to-select interaction, and audio-reactivity
const OfficeDesk: React.FC<OfficeDeskProps> = ({
  id,
  position,
  rotationY = 0,
  hasLaptop = true,
  hasLamp = false,
  hasPlant = false,
  hasMug = false,
  hasChair = true,
  chairColor = '#cb8a58',
  lampColor = '#f43f5e',
  mugColor = '#06b6d4',
  deskColor = '#fadaaf',
  laptopColor = '#94a3b8',
  glowColor = '#bae6fd',
  lightIntensity = 3.2,
  onSelect,
  activeDesk,
  triggerSip,
  theme
}) => {
  const [hovered, setHovered] = useState(false);
  const analyzer = useAudioAnalyzer();

  // Dynamic light & material references
  const lampLightRef = useRef<THREE.PointLight>(null);
  const laptopLightRef = useRef<THREE.SpotLight>(null);
  const laptopMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  // Soft glow color when hover is active
  const activeDeskColor = hovered ? '#ffe4c4' : deskColor;

  // Real-time audio reactive animations
  useFrame(() => {
    const isActive = id === activeDesk;
    const rawVolume = (isActive && analyzer.status === 'connected') ? analyzer.getVolume() : 0;
    const volume = isNaN(rawVolume) || rawVolume === undefined ? 0 : rawVolume;

    // Smooth lerping of light intensity
    if (lampLightRef.current) {
      const targetIntensity = lightIntensity + volume * 5.5;
      lampLightRef.current.intensity = THREE.MathUtils.lerp(
        lampLightRef.current.intensity,
        targetIntensity,
        0.3
      );
    }

    if (laptopLightRef.current) {
      const targetIntensity = 0.8 + volume * 4.0;
      laptopLightRef.current.intensity = THREE.MathUtils.lerp(
        laptopLightRef.current.intensity,
        targetIntensity,
        0.3
      );
    }

    if (laptopMaterialRef.current) {
      const baseEmissiveIntensity = theme === 'night' ? 1.4 : 0.5;
      const targetEmissive = baseEmissiveIntensity + volume * 3.5;
      laptopMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        laptopMaterialRef.current.emissiveIntensity,
        targetEmissive,
        0.3
      );
    }
  });

  // Dynamic theme colors for lamps and screen glow
  const getDynamicGlowColor = () => {
    if (glowColor && glowColor !== '#bae6fd') return glowColor;
    switch (theme) {
      case 'sunset':
        return '#fecdd3'; // warm peach screen
      case 'night':
        return '#a78bfa'; // neon violet screen
      case 'day':
      default:
        return '#bae6fd'; // soft blue
    }
  };

  const getDynamicLampColor = () => {
    if (lampColor && lampColor !== '#f43f5e' && lampColor !== '#06b6d4') return lampColor;
    switch (theme) {
      case 'sunset':
        return '#f97316'; // warm orange lamp
      case 'night':
        return '#f43f5e'; // glowing rose lamp
      case 'day':
      default:
        return lampColor || '#f43f5e';
    }
  };

  const activeGlowColor = getDynamicGlowColor();
  const activeLampColor = getDynamicLampColor();

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      
      {/* ---------------- THE DESK ---------------- */}
      {/* Desk Top - Clickable and triggers pointer hover styles */}
      <mesh 
        position={[0, 0.82, 0]} 
        castShadow 
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(id);
        }}
      >
        <boxGeometry args={[1.8, 0.06, 1.0]} />
        <meshStandardMaterial color={activeDeskColor} roughness={0.4} />
      </mesh>

      {/* Desk Drawer cabinet under the desk */}
      <group position={[0.6, 0.41, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.36, 0.76, 0.75]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.22, 0.38]}>
          <boxGeometry args={[0.3, 0.2, 0.01]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.15, 0.38]}>
          <boxGeometry args={[0.3, 0.4, 0.01]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.22, 0.39]}>
          <boxGeometry args={[0.07, 0.02, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, -0.15, 0.39]}>
          <boxGeometry args={[0.07, 0.02, 0.02]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
      </group>

      {/* Desk Legs */}
      <group position={[-0.75, 0.39, 0]}>
        <mesh position={[0, 0, 0.4]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.78, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, -0.4]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.78, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} />
        </mesh>
      </group>

      {/* ---------------- LAPTOP ---------------- */}
      {hasLaptop && (
        <group position={[0, 0.85, -0.05]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.01, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.38, 0.015, 0.26]} />
            <meshStandardMaterial color={laptopColor} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.019, 0.01]}>
            <boxGeometry args={[0.33, 0.005, 0.14]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.019, 0.09]}>
            <boxGeometry args={[0.09, 0.002, 0.05]} />
            <meshStandardMaterial color="#78889b" roughness={0.5} />
          </mesh>
          <group position={[0, 0.015, -0.125]} rotation={[-0.3, 0, 0]}>
            <mesh position={[0, 0.12, -0.005]} castShadow>
              <boxGeometry args={[0.38, 0.25, 0.01]} />
              <meshStandardMaterial color={laptopColor} roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.12, 0.001]}>
              <boxGeometry args={[0.35, 0.22, 0.002]} />
              <meshStandardMaterial 
                ref={laptopMaterialRef}
                color={activeGlowColor} 
                emissive={activeGlowColor} 
                emissiveIntensity={theme === 'night' ? 1.4 : 0.5} 
                roughness={0.1} 
              />
            </mesh>
            <spotLight
              ref={laptopLightRef}
              position={[0, 0.12, 0.05]}
              angle={0.8}
              penumbra={0.5}
              intensity={0.8}
              distance={1.2}
              color={activeGlowColor}
              target-position={[0, 0.2, 0.4]}
            />
          </group>
        </group>
      )}

      {/* ---------------- GLOWING DESK LAMP ---------------- */}
      {hasLamp && (
        <group position={[-0.6, 0.85, -0.25]}>
          <mesh position={[0, 0.01, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
            <meshStandardMaterial color={activeLampColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.3} />
          </mesh>
          <group position={[0, 0.35, 0.06]} rotation={[0.4, 0, 0]}>
            <mesh castShadow>
              <coneGeometry args={[0.1, 0.16, 16]} />
              <meshStandardMaterial color={activeLampColor} roughness={0.4} />
            </mesh>
            <mesh position={[0, -0.05, 0]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color={theme === 'night' ? activeLampColor : '#fef08a'} />
            </mesh>
            <pointLight
              ref={lampLightRef}
              position={[0, -0.08, 0]}
              intensity={lightIntensity}
              distance={2.5}
              decay={1.8}
              color={theme === 'night' ? activeLampColor : '#fef08a'}
              castShadow
              shadow-bias={-0.001}
              shadow-mapSize-width={256}
              shadow-mapSize-height={256}
            />
          </group>
        </group>
      )}

      {/* ---------------- POTTED PLANT ---------------- */}
      {hasPlant && (
        <group position={[0.62, 0.85, -0.28]}>
          <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.09, 0.06, 0.16, 10]} />
            <meshStandardMaterial color="#ea580c" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.155, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.01, 8]} />
            <meshStandardMaterial color="#451a03" roughness={0.9} />
          </mesh>
          <group position={[0, 0.2, 0]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <sphereGeometry args={[0.11, 8, 8]} />
              <meshStandardMaterial color="#16a34a" roughness={0.9} />
            </mesh>
            <mesh position={[0.06, 0.04, 0.03]} castShadow>
              <sphereGeometry args={[0.09, 8, 8]} />
              <meshStandardMaterial color="#15803d" roughness={0.9} />
            </mesh>
            <mesh position={[-0.05, 0.05, -0.04]} castShadow>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshStandardMaterial color="#22c55e" roughness={0.9} />
            </mesh>
          </group>
        </group>
      )}

      {/* ---------------- BEVERAGE MUG ---------------- */}
      {hasMug && (
        <group 
          position={[-0.3, 0.85, -0.15]}
          onPointerOver={(e) => {
            if (id === activeDesk) {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }
          }}
          onPointerOut={(e) => {
            if (id === activeDesk) {
              e.stopPropagation();
              document.body.style.cursor = 'auto';
            }
          }}
          onClick={(e) => {
            if (id === activeDesk) {
              e.stopPropagation();
              triggerSip(position);
            }
          }}
        >
          <mesh position={[0, 0.05, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.045, 0.1, 10]} />
            <meshStandardMaterial color={mugColor} roughness={0.4} />
          </mesh>
          <mesh position={[0.035, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.025, 0.008, 6, 12, Math.PI]} />
            <meshStandardMaterial color={mugColor} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.095, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.004, 8]} />
            <meshStandardMaterial color="#7c2d12" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* ---------------- CHAIR (Empty decorative chair) ---------------- */}
      {hasChair && (
        <group position={[0, 0, -0.4]}>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.035, 0.035, 0.4, 8]} />
            <meshStandardMaterial color="#2d3748" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.45, 0.04, 0.45]} />
            <meshStandardMaterial color="#1a202c" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.58, 0.07, 0.58]} />
            <meshStandardMaterial color={chairColor} roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.8, -0.25]} castShadow>
            <boxGeometry args={[0.5, 0.52, 0.07]} />
            <meshStandardMaterial color={chairColor} roughness={0.7} />
          </mesh>
        </group>
      )}

    </group>
  );
};

interface IsometricRoomProps {
  activeDesk: number | null;
  onSelectDesk: (id: number) => void;
  onSelectFloor: (point: THREE.Vector3) => void;
  desks: DeskConfig[];
  theme: 'day' | 'sunset' | 'night';
  triggerSip: (deskPosition: [number, number, number]) => void;
}

export const IsometricRoom: React.FC<IsometricRoomProps> = ({ 
  activeDesk, 
  onSelectDesk, 
  onSelectFloor,
  desks,
  theme,
  triggerSip
}) => {
  // Theme-dependent plank palettes
  const getPlankPalette = () => {
    switch (theme) {
      case 'sunset':
        return [
          '#fda4af', // warm pink-rose
          '#fca5a5',
          '#fdba74', // warm orange
          '#fed7aa',
          '#ffe4e6',
        ];
      case 'night':
        return [
          '#1e293b', // dark slate
          '#334155',
          '#0f172a',
          '#1e1b4b', // deep neon-dark indigo
          '#111827',
        ];
      case 'day':
      default:
        return [
          '#fadaaf', // cream wood
          '#fedebb',
          '#f6d2a2',
          '#fadeb5',
          '#f5ce9f',
          '#fae1b9'
        ];
    }
  };

  const planksPalette = getPlankPalette();

  const getWallColor = () => {
    switch (theme) {
      case 'sunset':
        return '#fecdd3'; // warm sunset rose-200
      case 'night':
        return '#13132b'; // cyber night deep indigo
      case 'day':
      default:
        return '#ffffff';
    }
  };

  const wallColor = getWallColor();

  const getRugColor = () => {
    switch (theme) {
      case 'sunset':
        return '#fda4af';
      case 'night':
        return '#f43f5e'; // glowing red/pink
      case 'day':
      default:
        return '#e9d5ff';
    }
  };

  const rugColor = getRugColor();

  const getSkirtingColor = () => {
    switch (theme) {
      case 'sunset':
        return '#fda4af';
      case 'night':
        return '#0f172a';
      case 'day':
      default:
        return '#cbd5e1';
    }
  };

  const skirtingColor = getSkirtingColor();

  const getTextColor = () => {
    switch (theme) {
      case 'sunset':
        return '#831843';
      case 'night':
        return '#f472b6'; // glowing neon pink text
      case 'day':
      default:
        return '#312e81';
    }
  };

  const outlineColor = theme === 'night' ? '#1e1b4b' : '#ffffff';

  const totalPlanks = 37;
  const plankSpacing = 0.4;
  const plankWidth = 0.38;

  return (
    <group>
      {/* ---------------- FLOOR (Cream Wood Planks) ---------------- */}
      <group>
        {/* Sub-floor platform */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[14.8, 0.1, 8.4]} />
          <meshStandardMaterial color={theme === 'night' ? '#1e293b' : '#d1d5db'} roughness={1.0} />
        </mesh>

        {/* Floor Planks - Clickable to walk */}
        {Array.from({ length: totalPlanks }).map((_, i) => {
          const x = -7.4 + plankSpacing / 2 + i * plankSpacing;
          const color = planksPalette[i % planksPalette.length];
          return (
            <mesh 
              key={i} 
              position={[x, 0.005, 0]} 
              receiveShadow 
              castShadow
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'auto';
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectFloor(e.point);
              }}
            >
              <boxGeometry args={[plankWidth, 0.01, 8.4]} />
              <meshStandardMaterial color={color} roughness={0.75} />
            </mesh>
          );
        })}
      </group>

      {/* Rug under the main player's starting area - Clickable to walk */}
      <mesh 
        position={[0, 0.01, 0]} 
        receiveShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFloor(e.point);
        }}
      >
        <cylinderGeometry args={[1.4, 1.4, 0.01, 30]} />
        <meshStandardMaterial color={rugColor} roughness={1.0} />
      </mesh>

      {/* Skirting board */}
      <mesh position={[-7.38, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.04, 0.16, 8.4]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, -4.18]} castShadow receiveShadow>
        <boxGeometry args={[14.8, 0.16, 0.04]} />
        <meshStandardMaterial color={skirtingColor} roughness={0.7} />
      </mesh>

      {/* ---------------- WALLS (Extended for 14.8x8.4 Room) ---------------- */}
      <mesh position={[-7.42, 1.25, 0]} receiveShadow>
        <boxGeometry args={[0.04, 2.5, 8.4]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      <mesh position={[0, 1.25, -4.22]} receiveShadow>
        <boxGeometry args={[14.8, 2.5, 0.04]} />
        <meshStandardMaterial color={wallColor} roughness={0.8} />
      </mesh>

      {/* ---------------- FLOATING WALL TEXT ---------------- */}
      <group position={[0, 1.75, -4.19]} rotation={[0, 0, 0]}>
        <Text
          fontSize={0.32}
          color={getTextColor()}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          letterSpacing={0.02}
          outlineWidth={0.02}
          outlineColor={outlineColor}
        >
          Ufriend Virtual Office
        </Text>
      </group>

      {/* Minimalist shelf */}
      <group position={[-7.38, 1.4, 0.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.04, 1.4]} />
          <meshStandardMaterial color="#d97706" roughness={0.6} />
        </mesh>
        <mesh position={[-0.01, 0.12, -0.3]} rotation={[0, 0, 0.05]} castShadow>
          <boxGeometry args={[0.06, 0.2, 0.15]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.7} />
        </mesh>
        <mesh position={[-0.01, 0.12, -0.12]} castShadow>
          <boxGeometry args={[0.06, 0.22, 0.14]} />
          <meshStandardMaterial color="#ef4444" roughness={0.7} />
        </mesh>
        <mesh position={[-0.01, 0.1, 0.02]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.12]} />
          <meshStandardMaterial color="#10b981" roughness={0.7} />
        </mesh>
        <group position={[-0.01, 0.08, 0.4]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.05, 0.04, 0.1, 8]} />
            <meshStandardMaterial color="#475569" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.09, 0]} castShadow>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color="#84cc16" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Window */}
      <group position={[3.5, 1.4, -4.19]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.1, 0.02]} />
          <meshStandardMaterial color={theme === 'night' ? '#334155' : '#ffffff'} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[1.3, 1.0, 0.005]} />
          <meshStandardMaterial 
            color={theme === 'night' ? '#1e1b4b' : theme === 'sunset' ? '#fdba74' : '#e0f2fe'} 
            transparent 
            opacity={0.6} 
            roughness={0.1} 
          />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[0.03, 1.0, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0, 0, 0.015]}>
          <boxGeometry args={[1.3, 0.03, 0.01]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* ---------------- POPULATED DESKS (Dynamic Desks and Sitter Swap) ---------------- */}
      {desks.map((desk) => {
        // Calculate empty colleague chair position based on desk rotation
        const rotY = desk.rotationY || 0;
        const offsetZ = -0.4 * Math.cos(rotY);
        const offsetX = -0.4 * Math.sin(rotY);
        const chairPos: [number, number, number] = [
          desk.position[0] + offsetX,
          0,
          desk.position[2] + offsetZ
        ];

        return (
          <group key={desk.id}>
            {/* Render the desk itself - always hasChair={false} because chair is part of Avatar or Colleague */}
            <OfficeDesk 
              id={desk.id}
              position={desk.position} 
              rotationY={desk.rotationY}
              hasLaptop={desk.hasLaptop}
              hasLamp={desk.hasLamp}
              hasPlant={desk.hasPlant}
              hasMug={desk.hasMug}
              chairColor={desk.chairColor}
              lampColor={desk.lampColor}
              mugColor={desk.mugColor}
              glowColor={desk.glowColor}
              lightIntensity={desk.lightIntensity}
              hasChair={false}
              onSelect={onSelectDesk}
              activeDesk={activeDesk}
              triggerSip={triggerSip}
              theme={theme}
            />

            {/* If not active player desk, render a colleague typing and bobbing */}
            {desk.id !== activeDesk && (
              <Colleague 
                id={desk.id}
                position={chairPos}
                rotationY={rotY}
                chairColor={desk.chairColor || '#cb8a58'}
              />
            )}
          </group>
        );
      })}

    </group>
  );
};
