import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ColleagueProps {
  id: number;
  position: [number, number, number];
  rotationY: number;
  chairColor: string;
}

export const Colleague: React.FC<ColleagueProps> = ({
  id,
  position,
  rotationY,
  chairColor
}) => {
  const headRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Distinct randomized attributes based on ID
  const clothingColors = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Teal
    '#14b8a6', // Turquoise
    '#6366f1'  // Indigo
  ];
  const clothingColor = clothingColors[id % clothingColors.length];

  const skinTones = [
    '#fed7aa', // Peach
    '#fbcfe8', // Pinkish
    '#d97706', // Brown
    '#ffedd5', // Light cream
    '#ca8a04'  // Golden brown
  ];
  const skinTone = skinTones[(id * 3) % skinTones.length];

  const hairColors = [
    '#3b2314', // Dark brown
    '#111827', // Black
    '#ca8a04', // Blonde
    '#b45309'  // Red/Ginger
  ];
  const hairColor = hairColors[(id * 7) % hairColors.length];

  // Optional glasses
  const hasGlasses = id % 3 === 0;
  // Optional headphones
  const hasHeadphones = id % 4 === 1;

  // Typing speed variance
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
      
      {/* ---------------- CHAIR ---------------- */}
      <group position={[0, 0, 0]}>
        {/* Base / Legs */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.035, 0.035, 0.4, 8]} />
          <meshStandardMaterial color="#2d3748" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.04, 0.45]} />
          <meshStandardMaterial color="#1a202c" roughness={0.6} />
        </mesh>
        {/* Seat Cushion */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.58, 0.07, 0.58]} />
          <meshStandardMaterial color={chairColor} roughness={0.7} />
        </mesh>
        {/* Backrest */}
        <mesh position={[0, 0.8, -0.25]} castShadow>
          <boxGeometry args={[0.5, 0.52, 0.07]} />
          <meshStandardMaterial color={chairColor} roughness={0.7} />
        </mesh>
      </group>

      {/* ---------------- CHARACTER ---------------- */}
      {/* Torso */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.20, 0.55, 8]} />
        <meshStandardMaterial color={clothingColor} roughness={0.7} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 1.02, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
        <meshStandardMaterial color={skinTone} roughness={0.6} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.29, 0.88, 0.02]} rotation={[-Math.PI / 3, 0, -0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
          <meshStandardMaterial color={clothingColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.6} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.29, 0.88, 0.02]} rotation={[-Math.PI / 3, 0, 0.1]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.4, 8]} />
          <meshStandardMaterial color={clothingColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color={skinTone} roughness={0.6} />
        </mesh>
      </group>

      {/* Head Group */}
      <group ref={headRef} position={[0, 1.32, 0]}>
        {/* Face */}
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>

        {/* Eyes (Simple dark squares) */}
        <mesh position={[-0.14, 0.04, 0.255]}>
          <boxGeometry args={[0.05, 0.06, 0.02]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        <mesh position={[0.14, 0.04, 0.255]}>
          <boxGeometry args={[0.05, 0.06, 0.02]} />
          <meshBasicMaterial color="#111827" />
        </mesh>

        {/* Hair Box */}
        <mesh position={[0, 0.2, 0.05]} castShadow>
          <boxGeometry args={[0.52, 0.15, 0.45]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.05, -0.1]} castShadow>
          <boxGeometry args={[0.52, 0.52, 0.32]} />
          <meshStandardMaterial color={hairColor} roughness={0.8} />
        </mesh>

        {/* Optional Glasses */}
        {hasGlasses && (
          <group position={[0, 0.04, 0.26]}>
            {/* Left rim */}
            <mesh position={[-0.14, 0, 0]}>
              <torusGeometry args={[0.08, 0.015, 4, 8]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            {/* Right rim */}
            <mesh position={[0.14, 0, 0]}>
              <torusGeometry args={[0.08, 0.015, 4, 8]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            {/* Center bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.1, 0.02, 0.01]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
          </group>
        )}

        {/* Optional Headphones */}
        {hasHeadphones && (
          <group position={[0, 0.04, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.26, 0.03, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#3b82f6" roughness={0.4} />
            </mesh>
            <mesh position={[-0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.06, 10]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
            <mesh position={[0.26, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.11, 0.11, 0.06, 10]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>

    </group>
  );
};
