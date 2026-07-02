import React from 'react';
import * as THREE from 'three';
import { Colleague } from './Colleague';
import { OfficeDesk } from './OfficeDesk';
import type { DeskConfig } from './OfficeScene';

// --- Shared Floor / Wall Geometries ---
const SUB_FLOOR_GEO = new THREE.BoxGeometry(14.8, 0.1, 8.4);
const FLOOR_PLANK_GEO = new THREE.BoxGeometry(0.38, 0.01, 8.4);
const RUG_GEO = new THREE.CylinderGeometry(1.4, 1.4, 0.01, 16); // 16 segments is enough
const SKIRTING_LEFT_GEO = new THREE.BoxGeometry(0.04, 0.16, 8.4);
const SKIRTING_BACK_GEO = new THREE.BoxGeometry(14.8, 0.16, 0.04);
const WALL_LEFT_GEO = new THREE.BoxGeometry(0.04, 2.5, 8.4);
const WALL_BACK_GEO = new THREE.BoxGeometry(14.8, 2.5, 0.04);

const HangingLamp: React.FC<{ position: [number, number, number]; theme: string }> = ({ position, theme }) => {
  const isNight = theme === 'night';
  const isSunset = theme === 'sunset';

  let bulbColor = '#475569';
  if (isNight) bulbColor = '#fef08a';
  else if (isSunset) bulbColor = '#fdba74';

  return (
    <group position={position}>
      {/* Cord */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.6, 4]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 0.02, 0]}>
        <coneGeometry args={[0.2, 0.12, 8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.4} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, -0.06, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshBasicMaterial color={bulbColor} />
      </mesh>
    </group>
  );
};

const WallLamp: React.FC<{ position: [number, number, number]; rotationY?: number; theme: string }> = ({ position, rotationY = 0, theme }) => {
  const isNight = theme === 'night';
  const isSunset = theme === 'sunset';

  let tubeColor = '#475569';
  if (isNight) tubeColor = '#fef08a';
  else if (isSunset) tubeColor = '#fdba74';

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Backplate mount */}
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.06, 0.04]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Horizontal Fluorescent/LED Light Tube */}
      <mesh position={[0, 0, 0.035]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.016, 0.016, 0.82, 8]} />
        <meshBasicMaterial color={tubeColor} />
      </mesh>
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
  npcChatMessages: Record<number, string | null>;
}

export const IsometricRoom: React.FC<IsometricRoomProps> = ({ 
  activeDesk, 
  onSelectDesk, 
  onSelectFloor,
  desks,
  theme,
  triggerSip,
  npcChatMessages
}) => {
  // Theme-dependent plank palettes
  const getPlankPalette = () => {
    switch (theme) {
      case 'sunset':
        return ['#cb8a58', '#b57c5d', '#8c583c', '#dca87a', '#704028'];
      case 'night':
        return ['#1e293b', '#0f172a', '#334155', '#475569', '#020617'];
      default: // day
        return ['#e2e8f0', '#cbd5e1', '#94a3b8', '#f1f5f9', '#64748b'];
    }
  };

  const getThemeRugColor = () => {
    switch (theme) {
      case 'sunset': return '#be123c';
      case 'night': return '#1e1b4b';
      default: return '#3b82f6';
    }
  };

  const getThemeWallColor = () => {
    switch (theme) {
      case 'sunset': return '#fda4af';
      case 'night': return '#312e81';
      default: return '#f1f5f9';
    }
  };

  const getThemeSkirtingColor = () => {
    switch (theme) {
      case 'sunset': return '#e11d48';
      case 'night': return '#4338ca';
      default: return '#64748b';
    }
  };

  const getThemePlantPotColor = () => {
    switch (theme) {
      case 'sunset': return '#b57c5d';
      case 'night': return '#1e293b';
      default: return '#b57c5d';
    }
  };

  const getThemePlantLeafColor = () => {
    switch (theme) {
      case 'sunset': return '#2e7d32';
      case 'night': return '#065f46';
      default: return '#2e7d32';
    }
  };

  const palette = getPlankPalette();
  const wallColor = getThemeWallColor();
  const skirtingColor = getThemeSkirtingColor();

  return (
    <group>
      {/* ---------------- SUB-FLOOR (Holds shadows and serves as base) ---------------- */}
      <mesh receiveShadow position={[0, -0.05, 0]} geometry={SUB_FLOOR_GEO}>
        <meshStandardMaterial color={theme === 'night' ? '#090d16' : '#d1d5db'} roughness={0.9} />
      </mesh>

      {/* ---------------- FLOOR PLANKS ---------------- */}
      {Array.from({ length: 39 }).map((_, index) => {
        const xOffset = -7.22 + index * 0.38;
        const color = palette[index % palette.length];
        return (
          <mesh 
            key={index}
            receiveShadow 
            position={[xOffset, 0.005, 0]} 
            geometry={FLOOR_PLANK_GEO}
          >
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
        );
      })}

      {/* ---------------- RUG (Centered visual element) ---------------- */}
      <mesh receiveShadow position={[0, 0.012, 0]} rotation={[0, 0, 0]} geometry={RUG_GEO}>
        <meshStandardMaterial color={getThemeRugColor()} roughness={0.95} />
      </mesh>

      {/* ---------------- WALLS & SKIRTING ---------------- */}
      {/* Left Wall */}
      <mesh castShadow receiveShadow position={[-7.42, 1.25, 0]} geometry={WALL_LEFT_GEO}>
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Left Skirting */}
      <mesh castShadow position={[-7.4, 0.08, 0]} geometry={SKIRTING_LEFT_GEO}>
        <meshStandardMaterial color={skirtingColor} roughness={0.7} />
      </mesh>

      {/* Back Wall */}
      <mesh castShadow receiveShadow position={[0, 1.25, -4.22]} geometry={WALL_BACK_GEO}>
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Back Skirting */}
      <mesh castShadow position={[0, 0.08, -4.2]} geometry={SKIRTING_BACK_GEO}>
        <meshStandardMaterial color={skirtingColor} roughness={0.7} />
      </mesh>

      {/* ---------------- DOORWAY ---------------- */}
      <group position={[-7.41, 1.05, 2.2]} rotation={[0, Math.PI / 2, 0]}>
        {/* Frame */}
        <mesh castShadow position={[0, 0, 0]}>
          <boxGeometry args={[0.9, 2.1, 0.08]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {/* Door (Open slightly) */}
        <mesh castShadow position={[-0.32, 0, -0.22]} rotation={[0, -Math.PI / 4, 0]}>
          <boxGeometry args={[0.76, 2.02, 0.04]} />
          <meshStandardMaterial color="#cb8a58" roughness={0.7} />
        </mesh>
      </group>

      {/* ---------------- WINDOWS (Glows based on theme time) ---------------- */}
      <group position={[3.2, 1.45, -4.21]}>
        {/* Frame */}
        <mesh castShadow>
          <boxGeometry args={[2.5, 1.3, 0.06]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
        {/* Glass Glow */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[2.3, 1.1, 0.01]} />
          <meshBasicMaterial 
            color={theme === 'day' ? '#bae6fd' : theme === 'sunset' ? '#fecdd3' : '#1e1b4b'} 
          />
        </mesh>
      </group>

      {/* ---------------- DECORATIVE OFFICE PLANTS ---------------- */}
      {/* Left Back Corner Plant */}
      <group position={[-6.5, 0.01, -3.4]}>
        {/* Pot */}
        <mesh castShadow position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.26, 0.18, 0.56, 12]} />
          <meshStandardMaterial color={getThemePlantPotColor()} roughness={0.8} />
        </mesh>
        {/* Plant Base Dirt */}
        <mesh position={[0, 0.56, 0]}>
          <cylinderGeometry args={[0.24, 0.24, 0.02, 12]} />
          <meshStandardMaterial color="#332211" roughness={0.9} />
        </mesh>
        {/* Leaves */}
        <mesh castShadow position={[0, 0.85, 0]}>
          <sphereGeometry args={[0.42, 12, 12]} />
          <meshStandardMaterial color={getThemePlantLeafColor()} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[-0.15, 1.15, 0.15]}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshStandardMaterial color={getThemePlantLeafColor()} roughness={0.9} />
        </mesh>
        <mesh castShadow position={[0.18, 1.25, -0.1]}>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshStandardMaterial color={getThemePlantLeafColor()} roughness={0.9} />
        </mesh>
      </group>

      {/* ---------------- HANGING CEILING LAMPS ---------------- */}
      <HangingLamp position={[-3.5, 1.9, -0.5]} theme={theme} />
      <HangingLamp position={[3.5, 1.9, 0.5]} theme={theme} />

      {/* ---------------- WALL MOUNTED LAMPS ---------------- */}
      {/* Left Wall Lamp */}
      <WallLamp position={[-7.38, 1.6, -1.5]} rotationY={Math.PI / 2} theme={theme} />
      {/* Back Wall Lamps */}
      <WallLamp position={[-3.5, 1.6, -4.18]} rotationY={0} theme={theme} />
      <WallLamp position={[0.5, 1.6, -4.18]} rotationY={0} theme={theme} />

      {/* ---------------- CLICKABLE FLOORS (For Pathfinding triggers) ---------------- */}
      <mesh 
        visible={false}
        position={[0, 0.02, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFloor(e.point);
        }}
      >
        <planeGeometry args={[14.8, 8.4]} />
      </mesh>

      {/* ---------------- OFFICE DESKS RIG ---------------- */}
      {desks.map((desk) => {
        const deskX = desk.position[0];
        const deskY = desk.position[1];
        const deskZ = desk.position[2];

        // Desk properties
        const isDeskActive = activeDesk === desk.id;
        const colorPalette = ['#e2e8f0', '#94a3b8', '#cb8a58', '#475569'];
        const deskCol = colorPalette[desk.id % colorPalette.length];
        
        // Laptop base color
        const laptopCol = isDeskActive ? '#3b82f6' : '#cbd5e1';

        // Desk rotation
        const rotY = desk.rotationY || 0;
        const offsetX = -0.65 * Math.sin(rotY);
        const offsetZ = -0.65 * Math.cos(rotY);

        // NPC Sit placement
        const chairPos: [number, number, number] = [
          deskX + offsetX,
          deskY,
          deskZ + offsetZ
        ];

        return (
          <group key={desk.id}>
            {/* Desktop Object */}
            <OfficeDesk 
              id={desk.id}
              position={desk.position}
              rotationY={rotY}
              hasLaptop={desk.hasLaptop}
              hasLamp={desk.hasLamp}
              hasPlant={desk.hasPlant}
              hasMug={desk.hasMug}
              hasChair={true}
              chairColor={desk.chairColor || '#cb8a58'}
              lampColor={desk.lampColor || '#f43f5e'}
              deskColor={deskCol}
              laptopColor={laptopCol}
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
                activeChatMessage={npcChatMessages[desk.id]}
              />
            )}
          </group>
        );
      })}

    </group>
  );
};
