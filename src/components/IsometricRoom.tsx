import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import { Colleague } from './Colleague';
import type { DeskConfig } from './OfficeScene';

// Pre-preload models for instant rendering
useGLTF.preload('/Avocado.glb');
useGLTF.preload('/Duck.glb');
useGLTF.preload('/Lantern.glb');

// Avocado model component to replace potted plant
const AvocadoModel: React.FC = () => {
  const { scene } = useGLTF('/Avocado.glb');
  const clone = React.useMemo(() => {
    const cl = scene.clone();
    cl.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cl;
  }, [scene]);
  return <primitive object={clone} scale={[4.0, 4.0, 4.0]} position={[0, -0.01, 0]} />;
};

// Duck model component to replace beverage mug
const DuckModel: React.FC = () => {
  const { scene } = useGLTF('/Duck.glb');
  const clone = React.useMemo(() => {
    const cl = scene.clone();
    cl.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cl;
  }, [scene]);
  return <primitive object={clone} scale={[0.18, 0.18, 0.18]} position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]} />;
};

// Lantern model component to replace desk lamp
const LanternModel: React.FC = () => {
  const { scene } = useGLTF('/Lantern.glb');
  const clone = React.useMemo(() => {
    const cl = scene.clone();
    cl.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cl;
  }, [scene]);
  // The lantern model is quite large, scaled down to 0.06 fits the desk well
  return <primitive object={clone} scale={[0.06, 0.06, 0.06]} position={[0, 0, 0]} />;
};

// =====================================================
// SHARED MATERIALS & GEOMETRIES (created once, reused by all 20 desks)
// Per Three.js best practices: "Reuse materials = batched draw calls"
// =====================================================

// --- Shared Geometries ---
const DESK_TOP_GEO = new THREE.BoxGeometry(1.8, 0.06, 1.0);
const DESK_LEG_GEO = new THREE.CylinderGeometry(0.025, 0.025, 0.78, 6);
const DESK_LEG_BAR_GEO = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 6);
const DRAWER_BOX_GEO = new THREE.BoxGeometry(0.36, 0.76, 0.75);
const DRAWER_FACE_UPPER_GEO = new THREE.BoxGeometry(0.3, 0.2, 0.01);
const DRAWER_FACE_LOWER_GEO = new THREE.BoxGeometry(0.3, 0.4, 0.01);
const DRAWER_HANDLE_GEO = new THREE.BoxGeometry(0.07, 0.02, 0.02);
const LAPTOP_BASE_GEO = new THREE.BoxGeometry(0.38, 0.015, 0.26);
const LAPTOP_KEYBOARD_GEO = new THREE.BoxGeometry(0.33, 0.005, 0.14);
const LAPTOP_TRACKPAD_GEO = new THREE.BoxGeometry(0.09, 0.002, 0.05);
const LAPTOP_LID_GEO = new THREE.BoxGeometry(0.38, 0.25, 0.01);
const LAPTOP_SCREEN_GEO = new THREE.BoxGeometry(0.35, 0.22, 0.002);
const CHAIR_STEM_GEO = new THREE.CylinderGeometry(0.035, 0.035, 0.4, 6);
const CHAIR_BASE_GEO = new THREE.BoxGeometry(0.45, 0.04, 0.45);
const CHAIR_SEAT_GEO = new THREE.BoxGeometry(0.58, 0.07, 0.58);
const CHAIR_BACK_GEO = new THREE.BoxGeometry(0.5, 0.52, 0.07);

// --- Shared Materials (non-dynamic, static colors) ---
// Using MeshLambertMaterial for non-reflective small parts (cheaper than PBR)
const MAT_DESK_LEG = new THREE.MeshLambertMaterial({ color: '#1e293b' });
const MAT_DRAWER_BODY = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
const MAT_DRAWER_FACE = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
const MAT_DRAWER_HANDLE = new THREE.MeshBasicMaterial({ color: '#1e293b' });
const MAT_LAPTOP_KEYBOARD = new THREE.MeshLambertMaterial({ color: '#1e293b' });
const MAT_LAPTOP_TRACKPAD = new THREE.MeshLambertMaterial({ color: '#78889b' });
const MAT_CHAIR_STEM = new THREE.MeshLambertMaterial({ color: '#2d3748' });
const MAT_CHAIR_BASE = new THREE.MeshLambertMaterial({ color: '#1a202c' });

// Cache for materials to avoid recreating them on every render
const MATERIAL_CACHE: Record<string, THREE.MeshStandardMaterial> = {};
const getCachedMaterial = (color: string, roughness = 0.75, metalness = 0.0) => {
  const key = `${color}_${roughness}_${metalness}`;
  if (!MATERIAL_CACHE[key]) {
    MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }
  return MATERIAL_CACHE[key];
};

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

  // Soft glow color when hover is active
  const activeDeskColor = hovered ? '#ffe4c4' : deskColor;

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

  // Unique screen material per desk so emissive intensity animations are instance-specific
  const screenMaterial = React.useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: activeGlowColor,
      emissive: activeGlowColor,
      emissiveIntensity: theme === 'night' ? 1.4 : 0.5,
      roughness: 0.1
    });
  }, [activeGlowColor, theme]);

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

    if (screenMaterial) {
      const baseEmissiveIntensity = theme === 'night' ? 1.4 : 0.5;
      const targetEmissive = baseEmissiveIntensity + volume * 3.5;
      screenMaterial.emissiveIntensity = THREE.MathUtils.lerp(
        screenMaterial.emissiveIntensity,
        targetEmissive,
        0.3
      );
    }
  });

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
        material={getCachedMaterial(activeDeskColor, 0.4)}
      >
        <primitive object={DESK_TOP_GEO} attach="geometry" />
      </mesh>

      {/* Desk Drawer cabinet under the desk */}
      <group position={[0.6, 0.41, 0.05]}>
        <mesh castShadow receiveShadow geometry={DRAWER_BOX_GEO} material={MAT_DRAWER_BODY} />
        <mesh position={[0, 0.22, 0.38]} geometry={DRAWER_FACE_UPPER_GEO} material={MAT_DRAWER_FACE} />
        <mesh position={[0, -0.15, 0.38]} geometry={DRAWER_FACE_LOWER_GEO} material={MAT_DRAWER_FACE} />
        <mesh position={[0, 0.22, 0.39]} geometry={DRAWER_HANDLE_GEO} material={MAT_DRAWER_HANDLE} />
        <mesh position={[0, -0.15, 0.39]} geometry={DRAWER_HANDLE_GEO} material={MAT_DRAWER_HANDLE} />
      </group>

      {/* Desk Legs */}
      <group position={[-0.75, 0.39, 0]}>
        <mesh position={[0, 0, 0.4]} geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} />
        <mesh position={[0, 0, -0.4]} geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} />
        <mesh position={[0, 0.37, 0]} rotation={[Math.PI / 2, 0, 0]} geometry={DESK_LEG_BAR_GEO} material={MAT_DESK_LEG} />
      </group>

      {/* ---------------- LAPTOP ---------------- */}
      {hasLaptop && (
        <group position={[0, 0.85, -0.28]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.01, 0]} castShadow receiveShadow geometry={LAPTOP_BASE_GEO} material={getCachedMaterial(laptopColor, 0.3, 0.8)} />
          <mesh position={[0, 0.019, 0.01]} geometry={LAPTOP_KEYBOARD_GEO} material={MAT_LAPTOP_KEYBOARD} />
          <mesh position={[0, 0.019, 0.09]} geometry={LAPTOP_TRACKPAD_GEO} material={MAT_LAPTOP_TRACKPAD} />
          <group position={[0, 0.015, -0.125]} rotation={[-0.3, 0, 0]}>
            <mesh position={[0, 0.12, -0.005]} castShadow geometry={LAPTOP_LID_GEO} material={getCachedMaterial(laptopColor, 0.3, 0.8)} />
            <mesh position={[0, 0.12, 0.001]} geometry={LAPTOP_SCREEN_GEO} material={screenMaterial} />
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

      {/* ---------------- GLOWING DESK LAMP (Lantern 3D Model) ---------------- */}
      {hasLamp && (
        <group position={[-0.6, 0.85, -0.25]}>
          <LanternModel />
          <pointLight
            ref={lampLightRef}
            position={[0, 0.22, 0]}
            intensity={lightIntensity}
            distance={2.5}
            decay={2}
            color={theme === 'night' ? activeLampColor : '#fef08a'}
          />
        </group>
      )}

      {/* ---------------- POTTED PLANT (Avocado 3D Model) ---------------- */}
      {hasPlant && (
        <group position={[0.62, 0.85, -0.28]}>
          <AvocadoModel />
        </group>
      )}

      {/* ---------------- BEVERAGE MUG (Duck 3D Model) ---------------- */}
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
          <DuckModel />
        </group>
      )}

      {/* ---------------- CHAIR (Empty decorative chair) ---------------- */}
      {hasChair && (
        <group position={[0, 0, -0.65]}>
          <mesh position={[0, 0.2, 0]} geometry={CHAIR_STEM_GEO} material={MAT_CHAIR_STEM} />
          <mesh position={[0, 0.02, 0]} geometry={CHAIR_BASE_GEO} material={MAT_CHAIR_BASE} />
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow geometry={CHAIR_SEAT_GEO} material={getCachedMaterial(chairColor, 0.7)} />
          <mesh position={[0, 0.8, -0.25]} castShadow geometry={CHAIR_BACK_GEO} material={getCachedMaterial(chairColor, 0.7)} />
        </group>
      )}

    </group>
  );
};

// --- Shared Floor / Wall Geometries ---
const SUB_FLOOR_GEO = new THREE.BoxGeometry(14.8, 0.1, 8.4);
const FLOOR_PLANK_GEO = new THREE.BoxGeometry(0.38, 0.01, 8.4);
const RUG_GEO = new THREE.CylinderGeometry(1.4, 1.4, 0.01, 16); // 16 segments is enough
const SKIRTING_LEFT_GEO = new THREE.BoxGeometry(0.04, 0.16, 8.4);
const SKIRTING_BACK_GEO = new THREE.BoxGeometry(14.8, 0.16, 0.04);
const WALL_LEFT_GEO = new THREE.BoxGeometry(0.04, 2.5, 8.4);
const WALL_BACK_GEO = new THREE.BoxGeometry(14.8, 2.5, 0.04);

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
          '#1e1b4b', // deep violet-indigo
          '#312e81',
          '#111827', // dark slate
          '#0f172a',
          '#020617',
        ];
      case 'day':
      default:
        return [
          '#fdfcfa', // cream wood tones
          '#fafaf9',
          '#f5f5f4',
          '#e7e5e4',
          '#e2e8f0',
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

  const subFloorColor = theme === 'night' ? '#1e293b' : '#d1d5db';
  const subFloorMat = getCachedMaterial(subFloorColor, 1.0);
  const wallMat = getCachedMaterial(wallColor, 0.8);
  const skirtingMat = getCachedMaterial(skirtingColor, 0.7);
  const rugMat = getCachedMaterial(rugColor, 1.0);

  const planksRef = useRef<THREE.InstancedMesh>(null);

  React.useEffect(() => {
    if (!planksRef.current) return;
    const mesh = planksRef.current;
    const tempObject = new THREE.Object3D();
    const tempColor = new THREE.Color();

    for (let i = 0; i < totalPlanks; i++) {
      const x = -7.4 + plankSpacing / 2 + i * plankSpacing;
      tempObject.position.set(x, 0.005, 0);
      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      const colorStr = planksPalette[i % planksPalette.length];
      tempColor.set(colorStr);
      mesh.setColorAt(i, tempColor);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [planksPalette]);

  return (
    <group>
      {/* ---------------- FLOOR (Cream Wood Planks) ---------------- */}
      <group>
        {/* Sub-floor platform - Acts as single simple raycast collision mesh for walk input */}
        <mesh 
          position={[0, -0.05, 0]} 
          receiveShadow
          geometry={SUB_FLOOR_GEO}
          material={subFloorMat}
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
        />

        {/* Floor Planks - Rendered as a single instanced mesh to reduce draw calls from 37 to 1 */}
        <instancedMesh
          ref={planksRef}
          args={[FLOOR_PLANK_GEO, undefined, totalPlanks]}
          receiveShadow
        >
          <meshStandardMaterial roughness={0.75} />
        </instancedMesh>
      </group>

      {/* Rug under the main player's starting area */}
      <mesh 
        position={[0, 0.01, 0]} 
        receiveShadow
        geometry={RUG_GEO}
        material={rugMat}
      />

      {/* Skirting board */}
      <mesh position={[-7.38, 0.08, 0]} castShadow receiveShadow geometry={SKIRTING_LEFT_GEO} material={skirtingMat} />
      <mesh position={[0, 0.08, -4.18]} castShadow receiveShadow geometry={SKIRTING_BACK_GEO} material={skirtingMat} />

      {/* ---------------- WALLS (Extended for 14.8x8.4 Room) ---------------- */}
      <mesh position={[-7.42, 1.25, 0]} receiveShadow geometry={WALL_LEFT_GEO} material={wallMat} />
      <mesh position={[0, 1.25, -4.22]} receiveShadow geometry={WALL_BACK_GEO} material={wallMat} />

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
        const offsetZ = -0.65 * Math.cos(rotY);
        const offsetX = -0.65 * Math.sin(rotY);
        const chairPos: [number, number, number] = [
          desk.position[0] + offsetX,
          0,
          desk.position[2] + offsetZ
        ];

        return (
          <group key={desk.id}>
            {/* Render the desk itself - show chair only for the active player (Colleague renders its own chair) */}
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
              glowColor={desk.glowColor}
              lightIntensity={desk.lightIntensity}
              hasChair={true}
              onSelect={onSelectDesk}
              activeDesk={activeDesk}
              triggerSip={triggerSip}
              theme={theme}
            />

            {/* If not active player desk, render a colleague typing and bobbing */}
            {desk.id !== activeDesk && desk.hasColleague !== false && (
              <Colleague 
                id={desk.id}
                position={chairPos}
                rotationY={rotY}
              />
            )}
          </group>
        );
      })}

    </group>
  );
};
