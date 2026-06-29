import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import type { EmojiParticlesHandle } from './EmojiParticles';
import { findPath } from '../utils/pathfinding';
import type { DeskConfig } from './OfficeScene';

interface AvatarProps {
  emojiParticlesRef: React.RefObject<EmojiParticlesHandle | null>;
  activeDesk: number | null;
  targetPosition: [number, number, number];
  isWalking: boolean;
  onArrive: () => void;
  desks: DeskConfig[];
  sipTrigger: number;
}

const ROBOT_URL = '/RobotExpressive.glb';

// Pre-preload the model
useGLTF.preload(ROBOT_URL);

export const Avatar: React.FC<AvatarProps> = ({ 
  emojiParticlesRef, 
  activeDesk, 
  targetPosition,
  isWalking, 
  onArrive,
  desks,
  sipTrigger
}) => {
  const analyzer = useAudioAnalyzer();

  // Load the GLTF model and animations
  const { scene, animations } = useGLTF(ROBOT_URL);

  // Mesh/Group references
  const avatarGroupRef = useRef<THREE.Group>(null);
  
  // Setup animations using ref and clips
  const { actions } = useAnimations(animations, avatarGroupRef);

  // Spawner cooldown & emojis
  const lastSpawnTime = useRef<number>(0);
  const emojiPool = ['❤️', '😂', '✨', '🎉', '🔥', '👍', '😮', '💻', '🕶️', '🚀'];

  // Walk Animation Ref states
  const currentPos = useRef(new THREE.Vector3(0, 0, 0)); // Initial standing position on the rug
  const startPos = useRef(new THREE.Vector3(0, 0, 0));
  const targetPos = useRef(new THREE.Vector3(0, 0, 0));
  const currentRotY = useRef(0);
  
  // Pathfinding state refs
  const pathRef = useRef<THREE.Vector3[]>([]);
  const waypointIndexRef = useRef<number>(0);

  // Animation blending state tracking
  const activeActionName = useRef<string>('Idle');

  // Watch for target position changes to trigger walking
  useEffect(() => {
    const targetVec = new THREE.Vector3(...targetPosition);
    targetPos.current.copy(targetVec);
    startPos.current.copy(currentPos.current);
    
    // Find path using collision-avoidance BFS pathfinder
    pathRef.current = findPath(currentPos.current, targetVec, activeDesk);
    waypointIndexRef.current = 0;
  }, [targetPosition]);

  // Handle animation changes between Idle and Walking
  useEffect(() => {
    let targetActionName = 'Idle';

    if (isWalking) {
      targetActionName = 'Walking';
    }

    const currentAction = actions[activeActionName.current];
    const nextAction = actions[targetActionName];

    if (nextAction) {
      if (currentAction && activeActionName.current !== targetActionName) {
        currentAction.fadeOut(0.2);
      }
      nextAction.reset().fadeIn(0.2).play();
      activeActionName.current = targetActionName;
    }
  }, [isWalking, actions]);

  // Handle coffee sipping reaction animation
  useEffect(() => {
    if (sipTrigger === 0) return;
    
    // Play wave or thumbs up animation as reaction to coffee sipping
    const reactionAction = actions['Yes'] || actions['Wave'] || actions['ThumbsUp'];
    const idleAction = actions['Idle'];

    if (reactionAction && idleAction) {
      idleAction.fadeOut(0.15);
      reactionAction.reset().fadeIn(0.15).setLoop(THREE.LoopOnce, 1).play();
      reactionAction.clampWhenFinished = true;

      const onFinish = () => {
        reactionAction.fadeOut(0.2);
        idleAction.reset().fadeIn(0.2).play();
        reactionAction.getMixer().removeEventListener('finished', onFinish);
      };
      reactionAction.getMixer().addEventListener('finished', onFinish);
    }
  }, [sipTrigger, actions]);

  useFrame((state, delta) => {
    const rawVolume = analyzer.getVolume();
    const volume = isNaN(rawVolume) || rawVolume === undefined ? 0 : rawVolume;

    const time = state.clock.getElapsedTime();

    // --- 1. Movement Interpolation (Walking via Pathfinding) ---
    if (isWalking && pathRef.current.length > 0) {
      const walkSpeed = 3.2; // Constant walk speed (units per second)
      const wp = pathRef.current[waypointIndexRef.current];
      
      if (wp) {
        const diff = new THREE.Vector3().subVectors(wp, currentPos.current);
        const dist = diff.length();
        const step = delta * walkSpeed;
        
        if (step >= dist) {
          // Snap directly to this waypoint and proceed to the next
          currentPos.current.copy(wp);
          waypointIndexRef.current++;
          
          if (waypointIndexRef.current >= pathRef.current.length) {
            onArrive();
          }
        } else {
          // Move towards current waypoint
          diff.normalize().multiplyScalar(step);
          currentPos.current.add(diff);
          
          // Face heading smoothly
          const heading = Math.atan2(diff.x, diff.z);
          currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, heading, 0.25);
        }
      } else {
        onArrive();
      }
    } else {
      // Seated/Standing: Smoothly face the desk if seated
      if (activeDesk !== null) {
        const targetRotY = desks[activeDesk]?.rotationY || 0;
        currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, targetRotY, 0.15);
      }
    }

    // Apply translation & rotation to main group
    if (avatarGroupRef.current) {
      avatarGroupRef.current.position.copy(currentPos.current);
      avatarGroupRef.current.rotation.y = currentRotY.current;
    }

    // --- 2. Speak/Emoji Reactions ---
    // If user is speaking loudly, trigger a quick Wave/Dance/Jump animation to show expression
    if (!isWalking && volume > 0.35 && time - lastSpawnTime.current > 1.5) {
      const reactions = ['Wave', 'Yes', 'ThumbsUp', 'Punch'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      const reactionAction = actions[randomReaction];
      const idleAction = actions['Idle'];

      if (reactionAction && idleAction) {
        idleAction.fadeOut(0.15);
        reactionAction.reset().fadeIn(0.15).setLoop(THREE.LoopOnce, 1).play();
        reactionAction.clampWhenFinished = true;

        // Restore Idle after animation finishes
        const onFinish = () => {
          reactionAction.fadeOut(0.2);
          idleAction.reset().fadeIn(0.2).play();
          // Unbind listener
          const mixer = reactionAction.getMixer();
          mixer.removeEventListener('finished', onFinish);
        };
        reactionAction.getMixer().addEventListener('finished', onFinish);
        
        lastSpawnTime.current = time;
      }
    }

    // --- 3. Emoji Particle Spawner ---
    if (volume > 0.45 && time - lastSpawnTime.current > 0.35) {
      if (emojiParticlesRef.current && avatarGroupRef.current) {
        const spawnPos: [number, number, number] = [
          currentPos.current.x + (Math.random() - 0.5) * 0.2,
          currentPos.current.y + 0.9, // Float above head
          currentPos.current.z + (Math.random() - 0.5) * 0.2
        ];
        
        const randomEmoji = emojiPool[Math.floor(Math.random() * emojiPool.length)];
        emojiParticlesRef.current.spawn(randomEmoji, spawnPos);
      }
    }
  });

  // Make sure we enable shadows on all child meshes of the model
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  // Adjust height when seated: since the robot is standing, we place it slightly lower or adjust its position so it stands right at the desk keyboard
  const isSeated = activeDesk !== null && !isWalking;
  
  // If seated, we slightly shift Z and Y so the robot stands typing close to the desk
  const positionOffsetZ = isSeated ? 0.05 : 0;
  const positionOffsetY = isSeated ? -0.15 : 0; // Slightly lower so they type naturally

  return (
    <group ref={avatarGroupRef}>
      <group 
        position={[0, positionOffsetY, positionOffsetZ]} 
        scale={0.28} // Scale down the robot to fit nicely in the room
      >
        <primitive object={scene} />
      </group>
    </group>
  );
};
