import React from 'react';
import * as THREE from 'three';
import type { AvatarOutfit } from '../../App';

interface HumanMeshProps {
  outfit: AvatarOutfit;
  isSeated: boolean;
  humanTorsoRef: React.RefObject<THREE.Mesh | null>;
  humanLeftArmRef: React.RefObject<THREE.Group | null>;
  humanRightArmRef: React.RefObject<THREE.Group | null>;
  humanLeftLegRef: React.RefObject<THREE.Group | null>;
  humanRightLegRef: React.RefObject<THREE.Group | null>;
  humanHeadRef: React.RefObject<THREE.Group | null>;
}

export const HumanMesh: React.FC<HumanMeshProps> = ({
  outfit,
  isSeated,
  humanTorsoRef,
  humanLeftArmRef,
  humanRightArmRef,
  humanLeftLegRef,
  humanRightLegRef,
  humanHeadRef
}) => {
  return (
    <group scale={0.88}>
      {/* Torso */}
      <mesh ref={humanTorsoRef as any} position={[0, 0.45, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.5, 8]} />
        <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, 0.74, 0]} castShadow>
        <cylinderGeometry args={[0.065, 0.065, 0.1, 8]} />
        <meshStandardMaterial color={outfit.skinTone} roughness={0.6} />
      </mesh>

      {/* Left Arm */}
      <group ref={humanLeftArmRef as any} position={[-0.26, 0.62, 0.01]} rotation={isSeated ? [-Math.PI / 3.2, 0, -0.15] : [0, 0, -0.05]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.045, 0.38, 8]} />
          <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={outfit.skinTone} roughness={0.6} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={humanRightArmRef as any} position={[0.26, 0.62, 0.01]} rotation={isSeated ? [-Math.PI / 3.2, 0, 0.15] : [0, 0, 0.05]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.055, 0.045, 0.38, 8]} />
          <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.2, 0]} castShadow>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial color={outfit.skinTone} roughness={0.6} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={humanLeftLegRef as any} position={isSeated ? [-0.1, 0.22, 0.18] : [-0.1, 0.15, 0]} rotation={isSeated ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.44, 8]} />
          <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={humanRightLegRef as any} position={isSeated ? [0.1, 0.22, 0.18] : [0.1, 0.15, 0]} rotation={isSeated ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.065, 0.055, 0.44, 8]} />
          <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
        </mesh>
      </group>

      {/* Head Group */}
      <group ref={humanHeadRef as any} position={[0, 1.02, 0]}>
        {/* Face */}
        <mesh castShadow>
          <boxGeometry args={[0.44, 0.44, 0.44]} />
          <meshStandardMaterial color={outfit.skinTone} roughness={0.5} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.12, 0.03, 0.225]}>
          <boxGeometry args={[0.04, 0.05, 0.02]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        <mesh position={[0.12, 0.03, 0.225]}>
          <boxGeometry args={[0.04, 0.05, 0.02]} />
          <meshBasicMaterial color="#111827" />
        </mesh>

        {/* Hair Crop */}
        {outfit.hairStyle === 'short' && (
          <>
            <mesh position={[0, 0.18, 0.04]} castShadow>
              <boxGeometry args={[0.46, 0.12, 0.4]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.05, -0.09]} castShadow>
              <boxGeometry args={[0.46, 0.46, 0.28]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* Hair Long */}
        {outfit.hairStyle === 'long' && (
          <>
            <mesh position={[0, 0.18, 0.04]} castShadow>
              <boxGeometry args={[0.46, 0.12, 0.4]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.15, -0.09]} castShadow>
              <boxGeometry args={[0.46, 0.65, 0.28]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[-0.21, -0.2, 0.1]} castShadow>
              <boxGeometry args={[0.05, 0.4, 0.1]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
            <mesh position={[0.21, -0.2, 0.1]} castShadow>
              <boxGeometry args={[0.05, 0.4, 0.1]} />
              <meshStandardMaterial color={outfit.hairColor} roughness={0.8} />
            </mesh>
          </>
        )}

        {/* Hair Cap */}
        {outfit.hairStyle === 'cap' && (
          <mesh position={[0, 0.21, 0]} castShadow>
            <boxGeometry args={[0.48, 0.15, 0.48]} />
            <meshStandardMaterial color={outfit.clothingColor} roughness={0.7} />
          </mesh>
        )}

        {/* Glasses */}
        {outfit.hasGlasses && (
          <group position={[0, 0.03, 0.23]}>
            <mesh position={[-0.12, 0, 0]}>
              <torusGeometry args={[0.07, 0.012, 4, 8]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            <mesh position={[0.12, 0, 0]}>
              <torusGeometry args={[0.07, 0.012, 4, 8]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.08, 0.015, 0.01]} />
              <meshBasicMaterial color="#111827" />
            </mesh>
          </group>
        )}

        {/* Headphones */}
        {outfit.hasHeadphones && (
          <group position={[0, 0.03, 0]}>
            <mesh castShadow>
              <torusGeometry args={[0.23, 0.025, 8, 16, Math.PI]} />
              <meshStandardMaterial color="#3b82f6" roughness={0.4} />
            </mesh>
            <mesh position={[-0.23, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.05, 10]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
            <mesh position={[0.23, 0, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.05, 10]} />
              <meshStandardMaterial color="#111827" roughness={0.5} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
