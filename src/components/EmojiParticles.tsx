import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export interface EmojiParticle {
  id: string;
  emoji: string;
  position: [number, number, number];
}

export interface EmojiParticlesHandle {
  spawn: (emoji: string, position: [number, number, number]) => void;
}

const SingleParticle: React.FC<{
  emoji: string;
  position: [number, number, number];
  onComplete: () => void;
}> = ({ emoji, position, onComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const age = useRef(0);
  const duration = 1.2; // life duration in seconds

  // Initialize random movement vectors
  const velocityY = useRef(2.0 + Math.random() * 1.5);
  const velocityX = useRef((Math.random() - 0.5) * 1.2);
  const velocityZ = useRef((Math.random() - 0.5) * 1.2);
  const scaleMax = useRef(0.6 + Math.random() * 0.4);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    age.current += delta;
    if (age.current >= duration) {
      onComplete();
      return;
    }

    const t = age.current / duration;

    // Apply motion
    groupRef.current.position.y += velocityY.current * delta;
    groupRef.current.position.x += velocityX.current * delta;
    groupRef.current.position.z += velocityZ.current * delta;

    // Visual animation: scale up quickly then shrink to 0
    let currentScale = 0;
    if (t < 0.2) {
      // Scale up
      currentScale = (t / 0.2) * scaleMax.current;
    } else {
      // Fade/Scale down
      currentScale = (1 - (t - 0.2) / 0.8) * scaleMax.current;
    }
    
    groupRef.current.scale.setScalar(Math.max(0, currentScale));

    // Make the sprite billboard (face camera)
    // We can fetch the active camera from R3F state if needed, but since it is isometric we can just let it face the default camera view.
    // In our case, Text from @react-three/drei has an option billboard or we can use the three lookAt command
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        fontSize={0.6}
        anchorX="center"
        anchorY="middle"
        // Force rendering on top if desired or just let standard depth test work
        outlineWidth={0.05}
        outlineColor="#ffffff"
      >
        {emoji}
      </Text>
    </group>
  );
};

export const EmojiParticles = forwardRef<EmojiParticlesHandle, {}>((_, ref) => {
  const [particles, setParticles] = useState<EmojiParticle[]>([]);

  useImperativeHandle(ref, () => ({
    spawn: (emoji: string, position: [number, number, number]) => {
      const id = Math.random().toString(36).substring(2, 9);
      setParticles((prev) => [...prev, { id, emoji, position }]);
    },
  }));

  const handleComplete = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <group>
      {particles.map((p) => (
        <SingleParticle
          key={p.id}
          emoji={p.emoji}
          position={p.position}
          onComplete={() => handleComplete(p.id)}
        />
      ))}
    </group>
  );
});

EmojiParticles.displayName = 'EmojiParticles';
