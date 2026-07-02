import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, useGLTF } from '@react-three/drei';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';

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
  return <primitive object={clone} scale={[0.06, 0.06, 0.06]} position={[0, 0, 0]} />;
};

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
const MAT_DESK_LEG = new THREE.MeshLambertMaterial({ color: '#1e293b' });
const MAT_DRAWER_BODY = new THREE.MeshLambertMaterial({ color: '#f8fafc' });
const MAT_DRAWER_FACE = new THREE.MeshLambertMaterial({ color: '#e2e8f0' });
const MAT_DRAWER_HANDLE = new THREE.MeshBasicMaterial({ color: '#1e293b' });
const MAT_LAPTOP_KEYBOARD = new THREE.MeshLambertMaterial({ color: '#1e293b' });
const MAT_LAPTOP_TRACKPAD = new THREE.MeshLambertMaterial({ color: '#78889b' });
const MAT_CHAIR_STEM = new THREE.MeshLambertMaterial({ color: '#2d3748' });
const MAT_CHAIR_BASE = new THREE.MeshLambertMaterial({ color: '#1a202c' });

const MATERIAL_CACHE: Record<string, THREE.MeshStandardMaterial> = {};
const getCachedMaterial = (color: string, roughness = 0.75, metalness = 0.0) => {
  const key = `${color}_${roughness}_${metalness}`;
  if (!MATERIAL_CACHE[key]) {
    MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  }
  return MATERIAL_CACHE[key];
};

export interface OfficeDeskProps {
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
  activeDesk: number | null;
  triggerSip: (deskPosition: [number, number, number]) => void;
  theme: 'day' | 'sunset' | 'night';
}

export const OfficeDesk: React.FC<OfficeDeskProps> = ({
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
  deskColor = '#e2e8f0',
  laptopColor = '#94a3b8',
  onSelect,
  activeDesk,
  triggerSip,
  theme
}) => {
  const [hovered, setHovered] = React.useState(false);
  const isSelected = activeDesk === id;
  const pointLightRef = React.useRef<THREE.PointLight>(null);
  
  const { getVolume, status } = useAudioAnalyzer();

  // Pulse the desk lamp dynamically to the volume level
  useFrame((state) => {
    if (pointLightRef.current) {
      if (status === 'connected') {
        const volume = getVolume();
        const audioPulse = volume * 4.2;
        pointLightRef.current.intensity = (isSelected ? 1.4 : 0.6) + audioPulse;
      } else {
        const osc = 0.2 * Math.sin(state.clock.elapsedTime * 2);
        pointLightRef.current.intensity = (isSelected ? 1.4 : 0.6) + osc;
      }
    }
  });

  const getThemeLaptopScreenColor = () => {
    switch (theme) {
      case 'sunset': return '#fb7185';
      case 'night': return '#06b6d4';
      default: return '#e0f2fe';
    }
  };

  return (
    <group 
      position={position} 
      rotation={[0, rotationY, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      {/* ---------------- TABLE TOP ---------------- */}
      <mesh 
        castShadow 
        receiveShadow 
        geometry={DESK_TOP_GEO} 
        material={getCachedMaterial(hovered ? '#cbd5e1' : deskColor, 0.45, 0.1)} 
        position={[0, 0.74, 0]}
      />

      {/* ---------------- DRAWERS ---------------- */}
      <group position={[0.56, 0.38, 0]}>
        <mesh castShadow receiveShadow geometry={DRAWER_BOX_GEO} material={MAT_DRAWER_BODY} />
        <mesh castShadow receiveShadow geometry={DRAWER_FACE_UPPER_GEO} material={MAT_DRAWER_FACE} position={[0, 0.22, 0.38]} />
        <mesh castShadow receiveShadow geometry={DRAWER_HANDLE_GEO} material={MAT_DRAWER_HANDLE} position={[0, 0.22, 0.39]} />
        <mesh castShadow receiveShadow geometry={DRAWER_FACE_LOWER_GEO} material={MAT_DRAWER_FACE} position={[0, -0.12, 0.38]} />
        <mesh castShadow receiveShadow geometry={DRAWER_HANDLE_GEO} material={MAT_DRAWER_HANDLE} position={[0, -0.05, 0.39]} />
      </group>

      {/* ---------------- LEGS ---------------- */}
      <mesh castShadow geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} position={[-0.76, 0.36, -0.38]} />
      <mesh castShadow geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} position={[-0.76, 0.36, 0.38]} />
      <mesh castShadow geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} position={[0.76, 0.36, -0.38]} />
      <mesh castShadow geometry={DESK_LEG_GEO} material={MAT_DESK_LEG} position={[0.76, 0.36, 0.38]} />
      <mesh castShadow geometry={DESK_LEG_BAR_GEO} material={MAT_DESK_LEG} position={[0, 0.16, -0.38]} rotation={[0, 0, Math.PI / 2]} />
      <mesh castShadow geometry={DESK_LEG_BAR_GEO} material={MAT_DESK_LEG} position={[0, 0.16, 0.38]} rotation={[0, 0, Math.PI / 2]} />

      {/* ---------------- LAPTOP ---------------- */}
      {hasLaptop && (
        <group position={[-0.15, 0.77, -0.08]} rotation={[0, Math.PI + Math.PI / 8, 0]}>
          <mesh castShadow receiveShadow geometry={LAPTOP_BASE_GEO} material={getCachedMaterial(laptopColor, 0.5, 0.75)} />
          <mesh geometry={LAPTOP_KEYBOARD_GEO} material={MAT_LAPTOP_KEYBOARD} position={[0, 0.01, 0.04]} />
          <mesh geometry={LAPTOP_TRACKPAD_GEO} material={MAT_LAPTOP_TRACKPAD} position={[0, 0.009, 0.1]} />
          <group position={[0, 0.01, -0.125]} rotation={[-Math.PI / 3, 0, 0]}>
            <mesh castShadow geometry={LAPTOP_LID_GEO} material={getCachedMaterial(laptopColor, 0.5, 0.75)} position={[0, 0.125, 0.005]} />
            <mesh geometry={LAPTOP_SCREEN_GEO} material={new THREE.MeshBasicMaterial({ color: getThemeLaptopScreenColor() })} position={[0, 0.125, 0.013]} />
          </group>
        </group>
      )}

      {/* ---------------- LAMP (Glows and pulses to microphone volume) ---------------- */}
      {hasLamp && (
        <group position={[-0.6, 0.77, -0.3]}>
          <LanternModel />
          <pointLight 
            ref={pointLightRef}
            color={lampColor} 
            distance={5} 
            decay={1.8}
          />
          {/* Volumetric glow cone under desk lamp */}
          {(theme === 'night' || theme === 'sunset') && (
            <mesh position={[0, 0.08, 0]}>
              <cylinderGeometry args={[0.02, 0.22, 0.45, 12, 1, true]} />
              <meshBasicMaterial 
                color={lampColor} 
                transparent 
                opacity={theme === 'night' ? 0.15 : 0.08} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}
        </group>
      )}

      {/* ---------------- PLANT ---------------- */}
      {hasPlant && (
        <group position={[0.62, 0.77, -0.3]}>
          <AvocadoModel />
        </group>
      )}

      {/* ---------------- COFFEE MUG ---------------- */}
      {hasMug && (
        <group 
          position={[0.26, 0.77, -0.15]} 
          onClick={(e) => {
            if (isSelected) {
              e.stopPropagation();
              triggerSip(position);
            }
          }}
          onPointerOver={(e) => {
            if (isSelected) {
              e.stopPropagation();
              document.body.style.cursor = 'pointer';
            }
          }}
        >
          <DuckModel />
          {isSelected && (
            <React.Suspense fallback={null}>
              <Text
                position={[0, 0.38, 0]}
                fontSize={0.08}
                color={theme === 'night' ? '#67e8f9' : '#4f46e5'}
                font="https://fonts.gstatic.com/s/outfit/v11/Q3pwU5thAf2G72K4469pp5_6bWp3W9n067Z9.woff"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.008}
                outlineColor={theme === 'night' ? '#0f172a' : '#ffffff'}
              >
                🥛 Sip
              </Text>
            </React.Suspense>
          )}
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
