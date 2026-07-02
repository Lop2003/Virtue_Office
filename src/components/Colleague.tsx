import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

// =====================================================
// SHARED GEOMETRIES & MATERIALS (created once, reused by all 19 colleagues)
// Per Three.js best practices: reuse = batched draw calls
// =====================================================
const COL_TORSO_GEO = new THREE.CylinderGeometry(0.24, 0.20, 0.55, 6);
const COL_NECK_GEO = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 6);
const COL_ARM_GEO = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 6);
const COL_HAND_GEO = new THREE.SphereGeometry(0.055, 6, 6);
const COL_HEAD_GEO = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const COL_EYE_GEO = new THREE.BoxGeometry(0.05, 0.06, 0.02);
const COL_HAIR_TOP_GEO = new THREE.BoxGeometry(0.52, 0.15, 0.45);
const COL_HAIR_BACK_GEO = new THREE.BoxGeometry(0.52, 0.52, 0.32);
const COL_GLASS_RIM_GEO = new THREE.TorusGeometry(0.08, 0.015, 4, 8);
const COL_GLASS_BRIDGE_GEO = new THREE.BoxGeometry(0.1, 0.02, 0.01);
const COL_HP_BAND_GEO = new THREE.TorusGeometry(0.26, 0.03, 6, 12, Math.PI);
const COL_HP_CUP_GEO = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 8);

const MAT_COL_EYE = new THREE.MeshBasicMaterial({ color: '#111827' });
const MAT_COL_GLASS = new THREE.MeshBasicMaterial({ color: '#111827' });
const MAT_COL_HP_BAND = new THREE.MeshLambertMaterial({ color: '#3b82f6' });
const MAT_COL_HP_CUP = new THREE.MeshLambertMaterial({ color: '#111827' });

// Cache for dynamic materials to avoid constant instantiation and memory pressure
const COL_MATERIAL_CACHE: Record<string, THREE.MeshStandardMaterial | THREE.MeshLambertMaterial> = {};

const getCachedLambertMaterial = (color: string) => {
  if (!COL_MATERIAL_CACHE[color]) {
    COL_MATERIAL_CACHE[color] = new THREE.MeshLambertMaterial({ color });
  }
  return COL_MATERIAL_CACHE[color];
};

const getCachedStandardMaterial = (color: string, roughness = 0.7) => {
  const key = `std_${color}_${roughness}`;
  if (!COL_MATERIAL_CACHE[key]) {
    COL_MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial({ color, roughness });
  }
  return COL_MATERIAL_CACHE[key];
};

interface ColleagueProps {
  id: number;
  position: [number, number, number];
  rotationY: number;
  activeChatMessage?: string | null;
}

export const Colleague: React.FC<ColleagueProps> = ({
  id,
  position,
  rotationY,
  activeChatMessage
}) => {
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Distinct randomized attributes based on ID
  const clothingColors = [
    '#3b82f6', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'
  ];
  const clothingColor = clothingColors[id % clothingColors.length];

  const skinTones = [
    '#fed7aa', '#fbcfe8', '#d97706', '#ffedd5', '#ca8a04'
  ];
  const skinTone = skinTones[(id * 3) % skinTones.length];

  const hairColors = [
    '#3b2314', '#111827', '#ca8a04', '#b45309'
  ];
  const hairColor = hairColors[(id * 7) % hairColors.length];

  const hasGlasses = id % 3 === 0;
  const hasHeadphones = id % 4 === 1;

  const phaseOffset = id * 0.72;
  const typingSpeed = 4.5 + (id % 3) * 1.2;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // 1. Idle head bobbing
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(time * 1.8 + phaseOffset) * 0.04;
      headRef.current.rotation.y = Math.cos(time * 1.1 + phaseOffset) * 0.05;
    }

    // 2. Typing arm swing
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = -Math.PI / 3 + Math.sin(time * typingSpeed + phaseOffset) * 0.06;
      leftArmRef.current.rotation.z = -0.1 + Math.cos(time * typingSpeed) * 0.02;

      rightArmRef.current.rotation.x = -Math.PI / 3 + Math.cos(time * typingSpeed + phaseOffset * 1.2) * 0.06;
      rightArmRef.current.rotation.z = 0.1 + Math.sin(time * typingSpeed) * 0.02;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chat Speech Bubble */}
      {activeChatMessage && (
        <Html position={[0, 1.7, 0]} center>
          <div className="relative flex flex-col items-center select-none pointer-events-none transition-all duration-300 transform scale-100 origin-bottom select-none">
            {/* Bubble Body */}
            <div className="bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-xl shadow-xl border border-slate-100 flex items-center justify-center text-xs font-semibold w-max max-w-[240px] text-center whitespace-normal break-words">
              {activeChatMessage}
            </div>
            {/* Tail triangle */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/95 drop-shadow-md -mt-0.5"></div>
          </div>
        </Html>
      )}
      
      {/* ---------------- CHARACTER ---------------- */}
      {/* Torso */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow geometry={COL_TORSO_GEO} material={getCachedStandardMaterial(clothingColor, 0.7)} />

      {/* Neck */}
      <mesh position={[0, 1.02, 0]} geometry={COL_NECK_GEO} material={getCachedLambertMaterial(skinTone)} />

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.29, 0.88, 0.02]} rotation={[-Math.PI / 3, 0, -0.1]}>
        <mesh geometry={COL_ARM_GEO} material={getCachedLambertMaterial(clothingColor)} />
        <mesh position={[0, -0.22, 0]} geometry={COL_HAND_GEO} material={getCachedLambertMaterial(skinTone)} />
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.29, 0.88, 0.02]} rotation={[-Math.PI / 3, 0, 0.1]}>
        <mesh geometry={COL_ARM_GEO} material={getCachedLambertMaterial(clothingColor)} />
        <mesh position={[0, -0.22, 0]} geometry={COL_HAND_GEO} material={getCachedLambertMaterial(skinTone)} />
      </group>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.32, 0]}>
        {/* Face */}
        <mesh castShadow geometry={COL_HEAD_GEO} material={getCachedStandardMaterial(skinTone, 0.5)} />

        {/* Eyes */}
        <mesh position={[-0.14, 0.04, 0.255]} geometry={COL_EYE_GEO} material={MAT_COL_EYE} />
        <mesh position={[0.14, 0.04, 0.255]} geometry={COL_EYE_GEO} material={MAT_COL_EYE} />

        {/* Hair */}
        <mesh position={[0, 0.2, 0.05]} geometry={COL_HAIR_TOP_GEO} material={getCachedLambertMaterial(hairColor)} />
        <mesh position={[0, -0.05, -0.1]} geometry={COL_HAIR_BACK_GEO} material={getCachedLambertMaterial(hairColor)} />

        {/* Optional Glasses */}
        {hasGlasses && (
          <group position={[0, 0.04, 0.26]}>
            <mesh position={[-0.14, 0, 0]} geometry={COL_GLASS_RIM_GEO} material={MAT_COL_GLASS} />
            <mesh position={[0.14, 0, 0]} geometry={COL_GLASS_RIM_GEO} material={MAT_COL_GLASS} />
            <mesh position={[0, 0, 0]} geometry={COL_GLASS_BRIDGE_GEO} material={MAT_COL_GLASS} />
          </group>
        )}

        {/* Optional Headphones */}
        {hasHeadphones && (
          <group position={[0, 0.04, 0]}>
            <mesh geometry={COL_HP_BAND_GEO} material={MAT_COL_HP_BAND} />
            <mesh position={[-0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]} geometry={COL_HP_CUP_GEO} material={MAT_COL_HP_CUP} />
            <mesh position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]} geometry={COL_HP_CUP_GEO} material={MAT_COL_HP_CUP} />
          </group>
        )}
      </group>

    </group>
  );
};
