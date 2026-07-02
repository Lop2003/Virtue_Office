import { useRef, useImperativeHandle, forwardRef } from 'react';
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

interface ParticleState {
  active: boolean;
  emoji: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  scaleMax: number;
}

const POOL_SIZE = 40; // Max concurrent particles
const DURATION = 1.2; // Life duration in seconds

export const EmojiParticles = forwardRef<EmojiParticlesHandle, {}>((_, ref) => {
  const textRefs = useRef<(THREE.Group | null)[]>([]);
  const textInstances = useRef<(any | null)[]>([]);

  // Keep particle states in a mutable ref to prevent React re-renders
  const particles = useRef<ParticleState[]>(
    Array.from({ length: POOL_SIZE }, () => ({
      active: false,
      emoji: '',
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      age: 0,
      scaleMax: 1,
    }))
  );

  const nextIndex = useRef(0);

  useImperativeHandle(ref, () => ({
    spawn: (emoji: string, position: [number, number, number]) => {
      const idx = nextIndex.current;
      const p = particles.current[idx];

      p.active = true;
      p.emoji = emoji;
      p.position.set(position[0], position[1], position[2]);
      
      // Initialize random movement vectors
      p.velocity.set(
        (Math.random() - 0.5) * 1.2,
        2.0 + Math.random() * 1.5,
        (Math.random() - 0.5) * 1.2
      );
      p.age = 0;
      p.scaleMax = 0.6 + Math.random() * 0.4;

      // Update position of the group immediately
      const group = textRefs.current[idx];
      if (group) {
        group.position.copy(p.position);
        group.scale.setScalar(0);
        group.visible = true;
      }

      // Update text character directly on the underlying mesh to avoid mounting
      const textInstance = textInstances.current[idx];
      if (textInstance) {
        textInstance.text = emoji;
        if (typeof textInstance.sync === 'function') {
          textInstance.sync();
        }
      }

      nextIndex.current = (nextIndex.current + 1) % POOL_SIZE;
    },
  }));

  // A single frame loop updates all active particles
  useFrame((_, delta) => {
    for (let i = 0; i < POOL_SIZE; i++) {
      const p = particles.current[i];
      if (!p.active) continue;

      p.age += delta;
      if (p.age >= DURATION) {
        p.active = false;
        const group = textRefs.current[i];
        if (group) {
          group.visible = false;
        }
        continue;
      }

      // Apply motion
      p.position.addScaledVector(p.velocity, delta);

      const group = textRefs.current[i];
      if (group) {
        group.position.copy(p.position);

        // Visual animation: scale up quickly then shrink to 0
        const t = p.age / DURATION;
        let currentScale = 0;
        if (t < 0.2) {
          // Scale up
          currentScale = (t / 0.2) * p.scaleMax;
        } else {
          // Fade/Scale down
          currentScale = (1 - (t - 0.2) / 0.8) * p.scaleMax;
        }
        
        group.scale.setScalar(Math.max(0, currentScale));
      }
    }
  });

  return (
    <group>
      {Array.from({ length: POOL_SIZE }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            textRefs.current[i] = el;
          }}
          visible={false}
        >
          <Text
            ref={(el) => {
              textInstances.current[i] = el;
            }}
            children=""
            fontSize={0.6}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.05}
            outlineColor="#ffffff"
          />
        </group>
      ))}
    </group>
  );
});

EmojiParticles.displayName = 'EmojiParticles';

