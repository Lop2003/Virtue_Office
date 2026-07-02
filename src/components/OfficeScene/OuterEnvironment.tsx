import React, { useMemo } from 'react';
import { Stars, Sparkles } from '@react-three/drei';

interface OuterEnvironmentProps {
  theme: 'day' | 'sunset' | 'night';
}

const LowPolyTree: React.FC<{ position: [number, number, number]; scale: number; theme: string }> = ({ position, scale, theme }) => {
  // Tree colors based on theme
  const leavesColor = theme === 'night' ? '#0f766e' : theme === 'sunset' ? '#f59e0b' : '#22c55e';
  const trunkColor = theme === 'night' ? '#451a03' : theme === 'sunset' ? '#6b3f1d' : '#78350f';

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.9, 0.5, 1]}>
        <circleGeometry args={[0.75, 24]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={theme === 'day' ? 0.22 : 0.18}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
      {/* Trunk */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 0.8, 5]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      {/* Leaves (Cone) */}
      <mesh position={[0, 1.4, 0]} castShadow>
        <coneGeometry args={[0.7, 1.5, 5]} />
        <meshStandardMaterial color={leavesColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.0, 0]} castShadow>
        <coneGeometry args={[0.55, 1.2, 5]} />
        <meshStandardMaterial color={leavesColor} roughness={0.8} />
      </mesh>
    </group>
  );
};



export const OuterEnvironment: React.FC<OuterEnvironmentProps> = ({ theme }) => {
  // Generate random tree positions that sit outside the main office boundary
  const trees = useMemo(() => {
    const items = [];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Radius between 11 and 23 (office is approx 8x5)
      const radius = 11 + Math.random() * 12;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      // Scale variations
      const scale = 0.8 + Math.random() * 0.7;
      items.push({ id: i, position: [x, 0, z] as [number, number, number], scale });
    }
    return items;
  }, []);



  // Colors for the island base depending on theme
  const grassColor = theme === 'night' ? '#064e3b' : theme === 'sunset' ? '#c2410c' : '#86efac';
  const dirtColor = theme === 'night' ? '#1c1917' : theme === 'sunset' ? '#553018' : '#78350f';
  const waterColor = theme === 'night' ? '#0ea5e9' : theme === 'sunset' ? '#f59e0b' : '#38bdf8';

  return (
    <group position={[0, -0.6, 0]}>
      {/* Main Island Ground (Grass) */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[24, 24, 0.2, 64]} />
        <meshStandardMaterial color={grassColor} roughness={0.8} />
      </mesh>

      {/* Main Island Dirt Base */}
      <mesh position={[0, -1.2, 0]} receiveShadow>
        <cylinderGeometry args={[24, 22, 2.0, 64]} />
        <meshStandardMaterial color={dirtColor} roughness={0.9} />
      </mesh>
      
      {/* Sub-island rocks floating underneath */}
      <mesh position={[2, -3.5, 4]} rotation={[0.4, 0.2, 0.1]} receiveShadow>
        <dodecahedronGeometry args={[4, 0]} />
        <meshStandardMaterial color={dirtColor} roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-5, -4.5, -3]} rotation={[-0.2, 0.5, 0.3]} receiveShadow>
        <dodecahedronGeometry args={[3.5, 0]} />
        <meshStandardMaterial color={dirtColor} roughness={0.9} flatShading />
      </mesh>

      {/* Outer Water / Magical Ring */}
      <mesh position={[0, -1.8, 0]} receiveShadow>
        <cylinderGeometry args={[35, 35, 0.1, 64]} />
        <meshPhysicalMaterial 
          color={waterColor} 
          transmission={0.6}
          opacity={0.8}
          transparent={true}
          roughness={0.1}
          ior={1.5}
          thickness={2.0}
        />
      </mesh>

      {/* Render Trees */}
      {trees.map((tree) => (
        <LowPolyTree 
          key={tree.id} 
          position={tree.position} 
          scale={tree.scale} 
          theme={theme} 
        />
      ))}

      {/* Theme specific atmospheric effects */}
      {theme === 'night' && (
        <group>
          <Stars radius={40} depth={50} count={3000} factor={6} saturation={0} fade speed={1} />
          {/* Fireflies over the grass */}
          <Sparkles count={150} scale={[45, 4, 45]} size={4} speed={0.4} opacity={0.6} color="#fbbf24" position={[0, 1, 0]} />
        </group>
      )}

      {theme === 'sunset' && (
        <group>
          {/* Warm dust particles */}
          <Sparkles count={70} scale={[50, 14, 50]} size={4} speed={0.12} opacity={0.18} color="#ffd166" position={[0, 4, 0]} />
        </group>
      )}
      
      {theme === 'day' && (
        <group>
          {/* Subtle pollen/dust */}
          <Sparkles count={40} scale={[50, 14, 50]} size={2.5} speed={0.08} opacity={0.16} color="#ffffff" position={[0, 4, 0]} />
        </group>
      )}
    </group>
  );
};
