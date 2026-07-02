import React from 'react';
import * as THREE from 'three';
import { Colleague } from './Colleague';
import { OfficeDesk } from './OfficeDesk';
import type { DeskConfig } from './OfficeScene';

// --- Shared Floor / Wall Geometries ---
const SUB_FLOOR_GEO = new THREE.BoxGeometry(14.8, 0.1, 10.4);
const FLOOR_PLANK_GEO = new THREE.BoxGeometry(0.38, 0.01, 10.4);
const RUG_GEO = new THREE.CylinderGeometry(1.4, 1.4, 0.01, 16); // 16 segments is enough
const SKIRTING_LEFT_GEO = new THREE.BoxGeometry(0.04, 0.16, 10.4);
const SKIRTING_BACK_GEO = new THREE.BoxGeometry(14.8, 0.16, 0.04);
const WALL_LEFT_GEO = new THREE.BoxGeometry(0.04, 2.5, 10.4);
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

      {/* Volumetric Light Beam Cone */}
      {(isNight || isSunset) && (
        <mesh position={[0, -0.96, 0]}>
          <cylinderGeometry args={[0.04, 1.1, 1.8, 16, 1, true]} />
          <meshBasicMaterial 
            color={isNight ? '#ffedd5' : '#fed7aa'} 
            transparent 
            opacity={isNight ? 0.09 : 0.05} 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
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

      {/* Volumetric light wash effect on wall */}
      {(isNight || isSunset) && (
        <mesh position={[0, -0.7, -0.015]}>
          <planeGeometry args={[1.3, 1.4]} />
          <meshBasicMaterial 
            color={isNight ? '#fef08a' : '#fdba74'} 
            transparent 
            opacity={isNight ? 0.08 : 0.04} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
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
      <mesh castShadow receiveShadow position={[0, 1.25, -5.22]} geometry={WALL_BACK_GEO}>
        <meshStandardMaterial color={wallColor} roughness={0.9} />
      </mesh>
      {/* Back Skirting */}
      <mesh castShadow position={[0, 0.08, -5.2]} geometry={SKIRTING_BACK_GEO}>
        <meshStandardMaterial color={skirtingColor} roughness={0.7} />
      </mesh>

      {/* ---------------- WALL DECOR ---------------- */}
      <group position={[-2.0, 1.55, -5.16]}>
        {/* Whiteboard */}
        <mesh castShadow position={[0, 0, -0.01]}>
          <boxGeometry args={[2.5, 0.9, 0.018]} />
          <meshStandardMaterial color="#475569" roughness={0.55} />
        </mesh>
        <mesh castShadow position={[0, 0, 0.018]}>
          <boxGeometry args={[2.35, 0.78, 0.035]} />
          <meshStandardMaterial color={theme === 'night' ? '#dbeafe' : '#f8fafc'} roughness={0.35} />
        </mesh>
        <mesh position={[-0.62, 0.16, 0.05]}>
          <boxGeometry args={[0.46, 0.05, 0.012]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <mesh position={[0.05, 0.02, 0.05]}>
          <boxGeometry args={[0.72, 0.05, 0.012]} />
          <meshBasicMaterial color="#22c55e" />
        </mesh>
        <mesh position={[0.58, -0.16, 0.05]}>
          <boxGeometry args={[0.42, 0.05, 0.012]} />
          <meshBasicMaterial color="#f97316" />
        </mesh>
      </group>

      <group position={[-5.25, 1.42, -5.16]}>
        {/* Wall shelf */}
        <mesh castShadow>
          <boxGeometry args={[1.35, 0.08, 0.18]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.65} />
        </mesh>
        {['#2563eb', '#f97316', '#10b981', '#e11d48', '#facc15'].map((color, index) => (
          <mesh key={color} castShadow position={[-0.45 + index * 0.22, 0.18, 0.02]}>
            <boxGeometry args={[0.13, 0.38 + (index % 2) * 0.08, 0.12]} />
            <meshStandardMaterial color={color} roughness={0.55} />
          </mesh>
        ))}
        <mesh castShadow position={[0.54, 0.18, 0.02]}>
          <boxGeometry args={[0.28, 0.28, 0.12]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.45} />
        </mesh>
      </group>

      <group position={[5.65, 1.65, -5.16]}>
        {/* Framed wall art */}
        <mesh castShadow>
          <boxGeometry args={[0.86, 1.05, 0.035]} />
          <meshStandardMaterial color="#334155" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0, 0.025]}>
          <boxGeometry args={[0.68, 0.86, 0.014]} />
          <meshBasicMaterial color={theme === 'sunset' ? '#fbbf24' : theme === 'night' ? '#38bdf8' : '#93c5fd'} />
        </mesh>
        <mesh position={[-0.13, 0.06, 0.04]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.38, 0.18, 0.012]} />
          <meshBasicMaterial color={theme === 'sunset' ? '#ea580c' : '#10b981'} />
        </mesh>
      </group>

      <group position={[-7.35, 1.82, -2.75]} rotation={[0, Math.PI / 2, 0]}>
        {/* Clock */}
        <mesh castShadow>
          <circleGeometry args={[0.38, 28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.018]}>
          <ringGeometry args={[0.34, 0.39, 28]} />
          <meshStandardMaterial color="#475569" roughness={0.5} />
        </mesh>
        <mesh position={[0.04, 0.08, 0.03]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.035, 0.26, 0.012]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0.08, -0.03, 0.03]} rotation={[0, 0, -1.35]}>
          <boxGeometry args={[0.03, 0.2, 0.012]} />
          <meshBasicMaterial color="#0f172a" />
        </mesh>
      </group>

      <group position={[-7.35, 1.36, 0.35]} rotation={[0, Math.PI / 2, 0]}>
        {/* Sticky note board */}
        <mesh castShadow>
          <boxGeometry args={[1.05, 0.72, 0.035]} />
          <meshStandardMaterial color="#92400e" roughness={0.75} />
        </mesh>
        {[
          ['#fef08a', -0.28, 0.16],
          ['#bfdbfe', 0.18, 0.12],
          ['#bbf7d0', -0.06, -0.18],
        ].map(([color, x, y]) => (
          <mesh key={`${color}-${x}`} position={[Number(x), Number(y), 0.03]}>
            <boxGeometry args={[0.28, 0.22, 0.012]} />
            <meshBasicMaterial color={String(color)} />
          </mesh>
        ))}
      </group>

      {/* ---------------- DOORWAY ---------------- */}
      <group position={[-7.41, 1.05, 2.2]} rotation={[0, Math.PI / 2, 0]}>
        {/* Frame */}
        <mesh castShadow position={[-0.47, 0, 0]}>
          <boxGeometry args={[0.08, 2.1, 0.08]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0.47, 0, 0]}>
          <boxGeometry args={[0.08, 2.1, 0.08]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, 1.02, 0]}>
          <boxGeometry args={[1.02, 0.08, 0.08]} />
          <meshStandardMaterial color="#475569" roughness={0.6} />
        </mesh>
        {/* Door */}
        <mesh castShadow position={[0, -0.02, -0.04]}>
          <boxGeometry args={[0.78, 1.98, 0.04]} />
          <meshStandardMaterial color="#cb8a58" roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0.24, -0.04, -0.08]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#facc15" metalness={0.4} roughness={0.35} />
        </mesh>
      </group>

      {/* ---------------- WINDOWS (Glows based on theme time) ---------------- */}
      <group position={[3.2, 1.45, -5.21]}>
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
      <group position={[-6.5, 0.01, -4.4]}>
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

      {/* ---------------- FLOOR DECOR ---------------- */}
      <group position={[6.45, 0.01, -4.35]}>
        {/* Tall corner plant */}
        <mesh castShadow position={[0, 0.18, 0]}>
          <cylinderGeometry args={[0.22, 0.16, 0.36, 10]} />
          <meshStandardMaterial color={getThemePlantPotColor()} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0, 0.58, 0]}>
          <cylinderGeometry args={[0.035, 0.05, 0.7, 6]} />
          <meshStandardMaterial color="#166534" roughness={0.8} />
        </mesh>
        {[
          [-0.18, 0.95, 0.05, 0.22],
          [0.18, 0.86, -0.04, 0.2],
          [0.02, 1.12, 0.12, 0.18],
          [-0.05, 0.78, -0.14, 0.19],
        ].map(([x, y, z, radius], index) => (
          <mesh key={index} castShadow position={[x, y, z]}>
            <sphereGeometry args={[radius, 10, 10]} />
            <meshStandardMaterial color={getThemePlantLeafColor()} roughness={0.9} />
          </mesh>
        ))}
      </group>

      <group position={[5.9, 0.01, 4.4]} rotation={[0, -0.15, 0]}>
        {/* Storage cabinet */}
        <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[1.2, 0.84, 0.44]} />
          <meshStandardMaterial color={theme === 'night' ? '#334155' : '#e5e7eb'} roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.65, -0.23]}>
          <boxGeometry args={[1.05, 0.03, 0.02]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh position={[0, 0.38, -0.23]}>
          <boxGeometry args={[1.05, 0.03, 0.02]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
        <mesh castShadow position={[-0.26, 0.92, -0.03]}>
          <boxGeometry args={[0.34, 0.18, 0.36]} />
          <meshStandardMaterial color="#2563eb" roughness={0.55} />
        </mesh>
        <mesh castShadow position={[0.18, 0.96, 0]}>
          <boxGeometry args={[0.42, 0.24, 0.32]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.6} />
        </mesh>
      </group>

      <group position={[-6.2, 0.01, 4.35]} rotation={[0, 0.2, 0]}>
        {/* Parcel boxes */}
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <boxGeometry args={[0.72, 0.44, 0.54]} />
          <meshStandardMaterial color="#b45309" roughness={0.85} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.42, 0.16, -0.05]}>
          <boxGeometry args={[0.46, 0.32, 0.42]} />
          <meshStandardMaterial color="#d97706" roughness={0.85} />
        </mesh>
        <mesh castShadow receiveShadow position={[-0.18, 0.56, 0.02]}>
          <boxGeometry args={[0.48, 0.28, 0.4]} />
          <meshStandardMaterial color="#92400e" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.45, -0.28]}>
          <boxGeometry args={[0.64, 0.03, 0.012]} />
          <meshBasicMaterial color="#fef3c7" />
        </mesh>
      </group>

      <group position={[-6.95, 0.01, -1.0]}>
        {/* Floor lamp */}
        <mesh castShadow position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 0.08, 12]} />
          <meshStandardMaterial color="#334155" roughness={0.55} metalness={0.2} />
        </mesh>
        <mesh castShadow position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 1.28, 8]} />
          <meshStandardMaterial color="#475569" roughness={0.45} metalness={0.35} />
        </mesh>
        <mesh castShadow position={[0, 1.34, 0]}>
          <coneGeometry args={[0.28, 0.36, 12]} />
          <meshStandardMaterial color={theme === 'night' ? '#fde68a' : '#fef3c7'} roughness={0.5} />
        </mesh>
        <pointLight
          position={[0, 1.25, 0]}
          intensity={theme === 'night' ? 1.2 : theme === 'sunset' ? 0.8 : 0.35}
          distance={3.2}
          decay={1.7}
          color="#fde68a"
        />
      </group>

      {/* ---------------- HANGING CEILING LAMPS ---------------- */}
      <HangingLamp position={[-3.5, 1.9, -0.5]} theme={theme} />
      <HangingLamp position={[3.5, 1.9, 0.5]} theme={theme} />

      {/* ---------------- WALL MOUNTED LAMPS ---------------- */}
      {/* Left Wall Lamp */}
      <WallLamp position={[-7.38, 1.6, -1.5]} rotationY={Math.PI / 2} theme={theme} />
      {/* Back Wall Lamps */}
      <WallLamp position={[-3.5, 1.6, -5.18]} rotationY={0} theme={theme} />
      <WallLamp position={[0.5, 1.6, -5.18]} rotationY={0} theme={theme} />

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
        <planeGeometry args={[14.8, 10.4]} />
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
