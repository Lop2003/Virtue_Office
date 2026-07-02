import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';

interface CityEnvironmentProps {
  theme: 'day' | 'sunset' | 'night';
}

interface BuildingData {
  id: number;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  style: number; // 0: Stepped Glass, 1: Cyber Spire, 2: Circular Tower, 3: Twin Peak
  neonColor: string;
}

// A helper to get theme-reactive colors
const getThemeColors = (theme: 'day' | 'sunset' | 'night', style: number, neonColor: string) => {
  switch (theme) {
    case 'sunset':
      return {
        facade: style === 0 ? '#4b5563' : '#374151',
        glass: '#f97316',
        neon: '#f59e0b',
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.3
      };
    case 'night':
      return {
        facade: style === 0 ? '#0f172a' : '#1e293b',
        glass: '#38bdf8',
        neon: neonColor,
        emissiveIntensity: 2.2,
        metalness: 0.8,
        roughness: 0.1
      };
    case 'day':
    default:
      return {
        facade: style === 0 ? '#e2e8f0' : '#cbd5e1',
        glass: '#94a3b8',
        neon: '#94a3b8',
        emissiveIntensity: 0,
        metalness: 0.3,
        roughness: 0.5
      };
  }
};

const FancyBuilding: React.FC<{ data: BuildingData; theme: 'day' | 'sunset' | 'night' }> = ({ data, theme }) => {
  const { position, width, depth, height, style, neonColor } = data;
  const colors = getThemeColors(theme, style, neonColor);
  const beaconRef = useRef<THREE.Mesh>(null);

  // Animate blinking red beacons on towers at night/sunset
  useFrame((state) => {
    if (beaconRef.current) {
      if (theme === 'day') {
        (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
      } else {
        const pulse = (Math.sin(state.clock.elapsedTime * 4 + position[0]) + 1) / 2;
        (beaconRef.current.material as THREE.MeshBasicMaterial).opacity = pulse;
      }
    }
  });

  // Base building layout depending on style
  return (
    <group position={position}>
      {/* 1. ARCHITECTURAL STYLES */}
      
      {/* Style 0: Stepped Glass Tower */}
      {style === 0 && (
        <group>
          {/* Main Tier */}
          <mesh castShadow receiveShadow position={[0, height * 0.4, 0]}>
            <boxGeometry args={[width, height * 0.8, depth]} />
            <meshStandardMaterial 
              color={colors.facade} 
              metalness={colors.metalness} 
              roughness={colors.roughness} 
            />
          </mesh>
          {/* Top Tier */}
          <mesh castShadow receiveShadow position={[0, height * 0.9, 0]}>
            <boxGeometry args={[width * 0.7, height * 0.2, depth * 0.7]} />
            <meshStandardMaterial 
              color={colors.facade} 
              metalness={colors.metalness + 0.1} 
              roughness={colors.roughness} 
            />
          </mesh>
          {/* Glowing Windows - Vertical Stripes */}
          {theme !== 'day' && (
            <>
              <mesh position={[0, height * 0.4, depth / 2 + 0.02]}>
                <planeGeometry args={[width * 0.3, height * 0.7]} />
                <meshStandardMaterial 
                  color={colors.glass} 
                  emissive={colors.glass} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
              <mesh position={[0, height * 0.4, -depth / 2 - 0.02]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[width * 0.3, height * 0.7]} />
                <meshStandardMaterial 
                  color={colors.glass} 
                  emissive={colors.glass} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Style 1: Cyber Spire (Dark Metal with Neon Trims) */}
      {style === 1 && (
        <group>
          <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
            <boxGeometry args={[width, height, depth]} />
            <meshStandardMaterial 
              color={colors.facade} 
              metalness={0.9} 
              roughness={0.1} 
            />
          </mesh>
          {/* Neon corner lines */}
          {theme !== 'day' && (
            <group>
              {/* Corner Trim Front-Right */}
              <mesh position={[width / 2 + 0.01, height / 2, depth / 2 + 0.01]}>
                <boxGeometry args={[0.08, height, 0.08]} />
                <meshStandardMaterial 
                  color={colors.neon} 
                  emissive={colors.neon} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
              {/* Corner Trim Front-Left */}
              <mesh position={[-width / 2 - 0.01, height / 2, depth / 2 + 0.01]}>
                <boxGeometry args={[0.08, height, 0.08]} />
                <meshStandardMaterial 
                  color={colors.neon} 
                  emissive={colors.neon} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Style 2: Circular Tower */}
      {style === 2 && (
        <group>
          <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
            <cylinderGeometry args={[width / 2, width / 2, height, 16]} />
            <meshStandardMaterial 
              color={colors.facade} 
              metalness={colors.metalness} 
              roughness={colors.roughness} 
            />
          </mesh>
          {/* Glowing Ring Bands around the cylindrical building */}
          {theme !== 'day' && (
            <>
              <mesh position={[0, height * 0.7, 0]}>
                <cylinderGeometry args={[width / 2 + 0.02, width / 2 + 0.02, 0.2, 16, 1, true]} />
                <meshStandardMaterial 
                  color={colors.neon} 
                  emissive={colors.neon} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
              <mesh position={[0, height * 0.4, 0]}>
                <cylinderGeometry args={[width / 2 + 0.02, width / 2 + 0.02, 0.2, 16, 1, true]} />
                <meshStandardMaterial 
                  color={colors.neon} 
                  emissive={colors.neon} 
                  emissiveIntensity={colors.emissiveIntensity} 
                />
              </mesh>
            </>
          )}
        </group>
      )}

      {/* Style 3: Twin Peak Skyscraper */}
      {style === 3 && (
        <group>
          {/* Main Slab */}
          <mesh castShadow receiveShadow position={[0, height * 0.45, 0]}>
            <boxGeometry args={[width, height * 0.9, depth]} />
            <meshStandardMaterial 
              color={colors.facade} 
              metalness={colors.metalness} 
              roughness={colors.roughness} 
            />
          </mesh>
          {/* Peak 1 */}
          <mesh castShadow position={[-width * 0.22, height * 0.98, 0]}>
            <coneGeometry args={[width * 0.2, height * 0.15, 4]} />
            <meshStandardMaterial color={colors.facade} />
          </mesh>
          {/* Peak 2 */}
          <mesh castShadow position={[width * 0.22, height * 0.98, 0]}>
            <coneGeometry args={[width * 0.2, height * 0.15, 4]} />
            <meshStandardMaterial color={colors.facade} />
          </mesh>
          {/* Window dots grid layout */}
          {theme !== 'day' && (
            <group>
              <mesh position={[0, height * 0.5, depth / 2 + 0.02]}>
                <planeGeometry args={[width * 0.7, height * 0.6]} />
                <meshStandardMaterial 
                  color="#000000" 
                  roughness={0.9} 
                />
              </mesh>
              {/* Fake windows using sparkles or small details */}
              <mesh position={[0, height * 0.5, depth / 2 + 0.03]}>
                <planeGeometry args={[width * 0.6, height * 0.5]} />
                <meshStandardMaterial 
                  color={colors.glass} 
                  emissive={colors.glass} 
                  emissiveIntensity={colors.emissiveIntensity * 0.6} 
                />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* 2. SHARED DETAILS */}
      {/* Antenna & Beacon (Red Blinking Light at Night) */}
      <mesh position={[0, height + 0.7, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh ref={beaconRef} position={[0, height + 1.4, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color="#ef4444" transparent />
      </mesh>
    </group>
  );
};

export const CityEnvironment: React.FC<CityEnvironmentProps> = ({ theme }) => {
  // Generate random building positions with unique visual styles
  const buildings = useMemo(() => {
    const items: BuildingData[] = [];
    const neonColors = ['#38bdf8', '#f43f5e', '#a855f7', '#10b981', '#fbbf24'];

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 13 + Math.random() * 19;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const width = 2.2 + Math.random() * 2.8;
      const depth = 2.2 + Math.random() * 2.8;
      const height = 6 + Math.random() * 16;
      const style = Math.floor(Math.random() * 4);
      const neonColor = neonColors[Math.floor(Math.random() * neonColors.length)];

      items.push({ 
        id: i, 
        position: [x, -0.1, z], 
        width, 
        depth, 
        height, 
        style,
        neonColor
      });
    }
    return items;
  }, []);

  // Theme reactive ground colors
  const groundColor = theme === 'night' ? '#0f172a' : theme === 'sunset' ? '#311005' : '#475569';
  const roadColor = theme === 'night' ? '#020617' : theme === 'sunset' ? '#1c0702' : '#1e293b';
  const streetlampColor = theme === 'night' ? '#fde047' : theme === 'sunset' ? '#f59e0b' : '#94a3b8';

  return (
    <group position={[0, -0.6, 0]}>
      {/* Platform */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[35, 35, 0.2, 64]} />
        <meshStandardMaterial color={groundColor} roughness={0.8} />
      </mesh>

      {/* Ring Road */}
      <mesh position={[0, -0.05, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[10.5, 12.5, 32]} />
        <meshStandardMaterial color={roadColor} roughness={0.7} />
      </mesh>

      {/* Platform Dirt base */}
      <mesh position={[0, -1.2, 0]} receiveShadow>
        <cylinderGeometry args={[35, 33, 2.0, 64]} />
        <meshStandardMaterial color={roadColor} roughness={0.9} />
      </mesh>

      {/* Procedural Buildings */}
      {buildings.map((b) => (
        <FancyBuilding key={b.id} data={b} theme={theme} />
      ))}

      {/* Decorative Cyber Streetlamps along the road */}
      {useMemo(() => {
        const lamps = [];
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 11.5;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          lamps.push(
            <group key={i} position={[x, 0, z]}>
              {/* Lamp Pole */}
              <mesh position={[0, 0.8, 0]}>
                <cylinderGeometry args={[0.03, 0.05, 1.6, 5]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
              {/* Light Bulb */}
              <mesh position={[0, 1.65, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial 
                  color={streetlampColor} 
                  emissive={streetlampColor} 
                  emissiveIntensity={theme === 'day' ? 0 : 2} 
                />
              </mesh>
            </group>
          );
        }
        return lamps;
      }, [theme, streetlampColor])}

      {/* Particle Effects */}
      {theme === 'night' && (
        <group>
          <Stars radius={45} depth={50} count={3500} factor={6} saturation={0.5} fade speed={1.5} />
          {/* Cyberpunk floating embers */}
          <Sparkles count={150} scale={[40, 20, 40]} size={4} speed={0.5} opacity={0.7} color="#a855f7" position={[0, 6, 0]} />
        </group>
      )}

      {theme === 'sunset' && (
        <group>
          <Sparkles count={100} scale={[50, 25, 50]} size={5} speed={0.3} opacity={0.4} color="#f97316" position={[0, 6, 0]} />
        </group>
      )}
      
      {theme === 'day' && (
        <group>
          <Sparkles count={40} scale={[50, 25, 50]} size={3} speed={0.1} opacity={0.2} color="#ffffff" position={[0, 6, 0]} />
        </group>
      )}
    </group>
  );
};
