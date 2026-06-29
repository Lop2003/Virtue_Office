import React, { useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { IsometricRoom } from './IsometricRoom';
import { Avatar } from './Avatar';
import { EmojiParticles } from './EmojiParticles';
import type { EmojiParticlesHandle } from './EmojiParticles';

export interface DeskConfig {
  id: number;
  position: [number, number, number];
  rotationY?: number;
  hasLaptop?: boolean;
  hasLamp?: boolean;
  hasPlant?: boolean;
  hasMug?: boolean;
  chairColor?: string;
  lampColor?: string;
  mugColor?: string;
  deskColor?: string;
  laptopColor?: string;
  glowColor?: string;
  lightIntensity?: number;
}

// Programmatically generate 20 desks (4 rows of 5 desks facing each other)
const generateDesks = (): DeskConfig[] => {
  const desks: DeskConfig[] = [];
  let id = 0;
  const xCoords = [-5.2, -2.6, 0.0, 2.6, 5.2];
  const chairColors = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  // Double-row 1 (Back Row Block)
  // Line 1: Facing Z-positive (rotY = 0)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, -2.6],
      rotationY: 0,
      hasLaptop: true,
      hasLamp: col % 3 === 0,
      hasPlant: col % 2 === 0,
      hasMug: col % 2 === 1,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#f43f5e',
      lightIntensity: 1.5
    });
    id++;
  });
  
  // Line 2: Facing Z-negative (rotY = PI)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, -1.6],
      rotationY: Math.PI,
      hasLaptop: true,
      hasLamp: col % 3 === 1,
      hasPlant: col % 2 === 1,
      hasMug: col % 2 === 0,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#06b6d4',
      lightIntensity: 1.5
    });
    id++;
  });

  // Double-row 2 (Front Row Block)
  // Line 1: Facing Z-positive (rotY = 0)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, 1.6],
      rotationY: 0,
      hasLaptop: true,
      hasLamp: col % 3 === 2,
      hasPlant: col % 2 === 0,
      hasMug: col % 2 === 1,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#f43f5e',
      lightIntensity: 1.5
    });
    id++;
  });

  // Line 2: Facing Z-negative (rotY = PI)
  xCoords.forEach((x, col) => {
    desks.push({
      id: id,
      position: [x, 0, 2.6],
      rotationY: Math.PI,
      hasLaptop: true,
      hasLamp: col % 3 === 0,
      hasPlant: col % 2 === 1,
      hasMug: col % 2 === 0,
      chairColor: chairColors[id % chairColors.length],
      lampColor: '#06b6d4',
      lightIntensity: 1.5
    });
    id++;
  });

  return desks;
};

export const DESK_CONFIGS = generateDesks();

interface OfficeSceneProps {
  emojiParticlesRef: React.RefObject<EmojiParticlesHandle | null>;
  theme: 'day' | 'sunset' | 'night';
  desks: DeskConfig[];
  sipTrigger: number;
  triggerSip: (deskPosition: [number, number, number]) => void;
  activeDesk: number | null;
  setActiveDesk: (id: number | null) => void;
}

export const OfficeScene: React.FC<OfficeSceneProps> = ({ 
  emojiParticlesRef,
  theme,
  desks,
  sipTrigger,
  triggerSip,
  activeDesk,
  setActiveDesk
}) => {
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>([0, 0, 0]); // Standing on rug

  const handleSelectDesk = (id: number) => {
    if (isWalking) return;
    setIsWalking(true);
    setActiveDesk(id);

    const destDesk = desks[id];
    const rotY = destDesk.rotationY || 0;
    const offsetZ = -0.4 * Math.cos(rotY);
    const offsetX = -0.4 * Math.sin(rotY);

    setTargetPosition([
      destDesk.position[0] + offsetX,
      0,
      destDesk.position[2] + offsetZ
    ]);
  };

  const handleSelectFloor = (point: THREE.Vector3) => {
    if (isWalking) return;
    setIsWalking(true);
    setActiveDesk(null); // Stand on floor
    setTargetPosition([point.x, 0, point.z]);
  };

  // Dynamic light settings based on active theme
  const getLighting = () => {
    switch (theme) {
      case 'sunset':
        return {
          ambientColor: '#fda4af',
          ambientIntensity: 0.6,
          hemiColor: '#ff7e5f',
          hemiGround: '#feb47b',
          hemiIntensity: 0.5,
          dirColor: '#f97316',
          dirIntensity: 2.8,
          dirPos: [8, 4, 3] as [number, number, number],
          fillColor: '#818cf8',
          fillIntensity: 0.5,
        };
      case 'night':
        return {
          ambientColor: '#1e1b4b',
          ambientIntensity: 0.25,
          hemiColor: '#3b82f6',
          hemiGround: '#0f172a',
          hemiIntensity: 0.3,
          dirColor: '#818cf8',
          dirIntensity: 0.5,
          dirPos: [6, 9, 5] as [number, number, number],
          fillColor: '#c084fc',
          fillIntensity: 0.3,
        };
      case 'day':
      default:
        return {
          ambientColor: '#ffffff',
          ambientIntensity: 1.1,
          hemiColor: '#ffffff',
          hemiGround: '#fadaaf',
          hemiIntensity: 0.4,
          dirColor: '#ffffff',
          dirIntensity: 2.2,
          dirPos: [6, 9, 5] as [number, number, number],
          fillColor: '#e0f2fe',
          fillIntensity: 0.7,
        };
    }
  };

  const lights = getLighting();

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        className="w-full h-full"
      >
        {/* --- 1. Isometric Camera Setup --- */}
        <OrthographicCamera
          makeDefault
          position={[8, 7, 8]}
          zoom={65}
          near={0.1}
          far={100}
        />

        {/* --- 2. Lighting System (Dynamic Theme) --- */}
        <ambientLight intensity={lights.ambientIntensity} color={lights.ambientColor} />

        <hemisphereLight
          color={lights.hemiColor}
          groundColor={lights.hemiGround}
          intensity={lights.hemiIntensity}
        />

        <directionalLight
          position={lights.dirPos}
          intensity={lights.dirIntensity}
          color={lights.dirColor}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-left={-3}
          shadow-camera-right={3}
          shadow-camera-top={3}
          shadow-camera-bottom={-3}
          shadow-camera-near={0.1}
          shadow-camera-far={25}
          shadow-bias={-0.0005}
        />

        <directionalLight
          position={[-5, 5, -5]}
          intensity={lights.fillIntensity}
          color={lights.fillColor}
        />

        {/* --- 3. Scene Content --- */}
        <group position={[0, -0.6, 0]}>
          {/* Room Geometry - Renders desks and colleague sitters */}
          <IsometricRoom 
            activeDesk={activeDesk} 
            onSelectDesk={handleSelectDesk} 
            onSelectFloor={handleSelectFloor}
            desks={desks}
            theme={theme}
            triggerSip={triggerSip}
          />

          {/* Avatar Sitter - Walks from previous position to the new targetPosition */}
          <React.Suspense fallback={null}>
            <Avatar 
              emojiParticlesRef={emojiParticlesRef} 
              activeDesk={activeDesk} 
              targetPosition={targetPosition}
              isWalking={isWalking}
              onArrive={() => setIsWalking(false)}
              desks={desks}
              sipTrigger={sipTrigger}
            />
          </React.Suspense>

          {/* 3D Emoji particles */}
          <EmojiParticles ref={emojiParticlesRef} />
        </group>

        {/* --- 4. Restrictive Camera Controls --- */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minZoom={80}
          maxZoom={250}
          minPolarAngle={Math.PI / 3.8}
          maxPolarAngle={Math.PI / 2.3}
          minAzimuthAngle={-Math.PI / 10}
          maxAzimuthAngle={Math.PI / 1.6}
          target={[0, 0.2, 0]}
        />
      </Canvas>
    </div>
  );
};
