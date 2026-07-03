import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { useAudioAnalyzer } from '../context/AudioAnalyzerContext';
import type { EmojiParticlesHandle } from './EmojiParticles';
import type { DeskConfig } from './OfficeScene';
import type { AvatarOutfit } from '../App';
import { findPath, resolveMovement } from '../utils/pathfinding';
import { HumanMesh } from './Avatar/HumanMesh';
import { Armchair } from 'lucide-react';

interface AvatarProps {
  emojiParticlesRef: React.RefObject<EmojiParticlesHandle | null>;
  activeDesk: number | null;
  targetPosition: [number, number, number];
  isWalking: boolean;
  onArrive: () => void;
  desks: DeskConfig[];
  sipTrigger: number;
  outfit: AvatarOutfit;
  onKeyboardStartMove?: () => void;
  onSitAtDesk?: (id: number) => void;
  onStandUp?: () => void;
  activeChatMessage?: string | null;
  theme?: 'day' | 'sunset' | 'night';
}

const ROBOT_URL = '/RobotExpressive.glb';

// Pre-preload the model
useGLTF.preload(ROBOT_URL);
useGLTF.preload('/characters/CesiumMan.glb');
useGLTF.preload('/characters/Soldier.glb');
useGLTF.preload('/characters/Xbot.glb');

interface DownloadedAvatarModelProps {
  modelUrl: string;
  scale: number;
  yOffset: number;
  rotationY: number;
  isWalking: boolean;
}

const pickAction = (
  actions: ReturnType<typeof useAnimations>['actions'],
  patterns: RegExp[],
) => {
  for (const pattern of patterns) {
    const match = Object.entries(actions).find(([name, action]) => action && pattern.test(name));
    if (match?.[1]) return match[1];
  }
  return undefined;
};

const DownloadedAvatarModel: React.FC<DownloadedAvatarModelProps> = ({
  modelUrl,
  scale,
  yOffset,
  rotationY,
  isWalking,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const modelScene = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, groupRef);
  const hasWalkActionRef = useRef(false);

  useEffect(() => {
    modelScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [modelScene]);

  useEffect(() => {
    const modelActions = Object.values(actions).filter(Boolean);
    const walkAction =
      pickAction(actions, [/^walk$/i, /walk/i, /^run$/i, /run/i, /animation/i]) ||
      modelActions[0];
    const idleAction = pickAction(actions, [/^idle$/i, /idle/i, /stand/i]);
    const nextAction = isWalking ? walkAction : idleAction;

    hasWalkActionRef.current = Boolean(walkAction);
    modelActions.forEach((action) => {
      if (action !== nextAction) action?.fadeOut(0.16);
    });

    if (nextAction) {
      nextAction.reset().fadeIn(0.18).play();
      nextAction.timeScale = isWalking ? 1.15 : 1;
    }

    return () => {
      modelActions.forEach((action) => action?.fadeOut(0.12));
    };
  }, [actions, isWalking]);

  useFrame((state) => {
    if (!groupRef.current || hasWalkActionRef.current) return;

    if (isWalking) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = yOffset + Math.abs(Math.sin(t * 9.5)) * 0.08;
      groupRef.current.rotation.z = Math.sin(t * 9.5) * 0.055;
      groupRef.current.rotation.x = Math.sin(t * 9.5 + Math.PI / 2) * 0.035;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, yOffset, 0.2);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.2);
    }
  });

  return (
    <group ref={groupRef} scale={scale} position={[0, yOffset, 0]} rotation={[0, rotationY, 0]}>
      <primitive object={modelScene} />
    </group>
  );
};

export const Avatar: React.FC<AvatarProps> = ({ 
  emojiParticlesRef, 
  activeDesk, 
  targetPosition,
  isWalking, 
  onArrive,
  desks,
  sipTrigger,
  outfit,
  onKeyboardStartMove,
  onSitAtDesk,
  onStandUp,
  activeChatMessage,
  theme = 'day'
}) => {
  const analyzer = useAudioAnalyzer();

  // Keyboard tracking state
  const keysPressed = useRef<Record<string, boolean>>({});
  
  // State to track if we are close to an empty desk (for Spacebar sit prompt)
  const [nearbyDeskId, setNearbyDeskId] = useState<number | null>(null);
  const lastStateCheck = useRef<number>(0);
  
  // State for E key emoji selector menu
  const [showEmojiMenu, setShowEmojiMenu] = useState<boolean>(false);

  // State and ref for the floating thought bubble emoji
  const [activeThoughtEmoji, setActiveThoughtEmoji] = useState<string | null>(null);
  const thoughtTimerRef = useRef<any>(null);

  // Clean up thought bubble timer on unmount
  useEffect(() => {
    return () => {
      if (thoughtTimerRef.current) {
        clearTimeout(thoughtTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore key events if the user is typing in a chat input or form field
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) {
        keysPressed.current[key] = true;
        setShowEmojiMenu(false); // Close emoji selector when starting to move
        if (onKeyboardStartMove) onKeyboardStartMove();
      }
      
      // E Key to toggle emoji selector menu
      if (key === 'E') {
        e.preventDefault();
        setShowEmojiMenu((prev) => !prev);
      }
      
      // Spacebar to sit / stand up
      if (e.key === ' ' || e.code === 'Space') {
        // Prevent default browser page scroll
        e.preventDefault();
        
        if (activeDesk !== null) {
          if (onStandUp) onStandUp();
        } else if (!isWalking) {
          // Find if we are near any empty desk
          let foundDeskId: number | null = null;
          for (const desk of desks) {
            if (desk.hasColleague === false) {
              const rotY = desk.rotationY || 0;
              const offsetZ = -0.65 * Math.cos(rotY);
              const offsetX = -0.65 * Math.sin(rotY);
              const cx = desk.position[0] + offsetX;
              const cz = desk.position[2] + offsetZ;

              const distSq = (currentPos.current.x - cx) * (currentPos.current.x - cx) + (currentPos.current.z - cz) * (currentPos.current.z - cz);
              if (distSq < 1.2 * 1.2) {
                foundDeskId = desk.id;
                break;
              }
            }
          }
          if (foundDeskId !== null && onSitAtDesk) {
            onSitAtDesk(foundDeskId);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['W', 'A', 'S', 'D', 'ARROWUP', 'ARROWDOWN', 'ARROWLEFT', 'ARROWRIGHT'].includes(key)) {
        keysPressed.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onKeyboardStartMove, onSitAtDesk, onStandUp, activeDesk, isWalking, desks]);

  // Load the robot here; downloaded character GLBs own their animation root below.
  const { scene, animations } = useGLTF(ROBOT_URL);

  // Mesh/Group references
  const avatarGroupRef = useRef<THREE.Group>(null);
  
  // Humanoid refs
  const humanHeadRef = useRef<THREE.Group>(null);
  const humanTorsoRef = useRef<THREE.Mesh>(null);
  const humanLeftArmRef = useRef<THREE.Group>(null);
  const humanRightArmRef = useRef<THREE.Group>(null);
  const humanLeftLegRef = useRef<THREE.Group>(null);
  const humanRightLegRef = useRef<THREE.Group>(null);

  // Setup animations using ref and clips
  const { actions } = useAnimations(animations, avatarGroupRef);

  // Spawner cooldown & emojis
  const lastSpawnTime = useRef<number>(0);
  const emojiPool = ['❤️', '😂', '✨', '🎉', '🔥', '👍', '😮', '💻', '🕶️', '🚀'];

  const handleSelectEmoji = (emoji: string) => {
    if (emojiParticlesRef.current && avatarGroupRef.current) {
      const spawnPos: [number, number, number] = [
        currentPos.current.x,
        currentPos.current.y + 0.9,
        currentPos.current.z
      ];
      for (let i = 0; i < 4; i++) {
        const offsetPos: [number, number, number] = [
          spawnPos[0] + (Math.random() - 0.5) * 0.3,
          spawnPos[1] + (Math.random() - 0.5) * 0.2,
          spawnPos[2] + (Math.random() - 0.5) * 0.3
        ];
        emojiParticlesRef.current.spawn(emoji, offsetPos);
      }
    }
    
    // Trigger floating thought bubble
    setActiveThoughtEmoji(emoji);
    if (thoughtTimerRef.current) {
      clearTimeout(thoughtTimerRef.current);
    }
    thoughtTimerRef.current = setTimeout(() => {
      setActiveThoughtEmoji(null);
      thoughtTimerRef.current = null;
    }, 2500); // Show bubble for 2.5 seconds
    
    setShowEmojiMenu(false);
  };

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
  }, [targetPosition, activeDesk]);

  // Handle animation changes between Idle and Walking for the ROBOT
  useEffect(() => {
    if (outfit.type !== 'robot') return;

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
  }, [isWalking, actions, outfit.type]);

  // Handle coffee sipping reaction animation (Robot)
  useEffect(() => {
    if (outfit.type !== 'robot' || sipTrigger === 0) return;
    
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
  }, [sipTrigger, actions, outfit.type]);

  // Handle coffee sipping reaction animation (Human)
  useEffect(() => {
    if (outfit.type !== 'human' || sipTrigger === 0) return;

    // Procedural energy burst: make the human arms wave up and down quickly
    let timer = 0;
    const waveInterval = setInterval(() => {
      timer += 0.1;
      if (timer > 1.2) {
        clearInterval(waveInterval);
        // snap back
        if (humanLeftArmRef.current) humanLeftArmRef.current.rotation.x = 0;
        if (humanRightArmRef.current) humanRightArmRef.current.rotation.x = 0;
        return;
      }
      if (humanLeftArmRef.current && humanRightArmRef.current) {
        humanLeftArmRef.current.rotation.x = -Math.PI + Math.sin(timer * 15.0) * 0.5;
        humanRightArmRef.current.rotation.x = -Math.PI - Math.sin(timer * 15.0) * 0.5;
      }
    }, 50);

    return () => clearInterval(waveInterval);
  }, [sipTrigger, outfit.type]);
  // Programmatically attach accessories to the Robot's head bone
  useEffect(() => {
    if (outfit.type !== 'robot') return;

    let headBone: any = null;
    scene.traverse((child) => {
      if (child.name.toLowerCase().includes('head') && child.type === 'Bone') {
        headBone = child;
      }
    });

    if (headBone) {
      // Clear old accessories first
      const toRemove: THREE.Object3D[] = [];
      headBone.children.forEach((c: THREE.Object3D) => {
        if (c.name.startsWith('accessory_')) {
          toRemove.push(c);
        }
      });
      toRemove.forEach((c) => {
        headBone.remove(c);
        // Traverse and dispose geometries/materials to prevent memory leaks in GPU
        c.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          }
        });
      });

      // 1. Attach glasses
      if (outfit.hasGlasses) {
        const rimGeom = new THREE.TorusGeometry(0.38, 0.07, 4, 8);
        const rimMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
        
        const glassesGroup = new THREE.Group();
        glassesGroup.name = 'accessory_glasses';
        glassesGroup.position.set(0, 0.55, 0.9); // positioned on face
        glassesGroup.scale.set(0.7, 0.7, 0.7);

        const leftRim = new THREE.Mesh(rimGeom, rimMat);
        leftRim.position.x = -0.45;
        glassesGroup.add(leftRim);

        const rightRim = new THREE.Mesh(rimGeom, rimMat);
        rightRim.position.x = 0.45;
        glassesGroup.add(rightRim);

        const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), rimMat);
        glassesGroup.add(bridge);

        headBone.add(glassesGroup);
      }

      // 2. Attach headphones
      if (outfit.hasHeadphones) {
        const hpGroup = new THREE.Group();
        hpGroup.name = 'accessory_headphones';
        hpGroup.position.set(0, 0.65, 0); // top of head
        hpGroup.scale.set(0.85, 0.85, 0.85);

        // Band
        const bandGeom = new THREE.TorusGeometry(1.1, 0.1, 8, 16, Math.PI);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 });
        const band = new THREE.Mesh(bandGeom, bandMat);
        band.rotation.x = Math.PI / 2;
        hpGroup.add(band);

        // Cups
        const cupGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.25, 10);
        const cupMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });
        const leftCup = new THREE.Mesh(cupGeom, cupMat);
        leftCup.position.set(-1.1, 0, 0);
        leftCup.rotation.z = Math.PI / 2;
        hpGroup.add(leftCup);

        const rightCup = new THREE.Mesh(cupGeom, cupMat);
        rightCup.position.set(1.1, 0, 0);
        rightCup.rotation.z = -Math.PI / 2;
        hpGroup.add(rightCup);

        headBone.add(hpGroup);
      }
    }
  }, [scene, outfit.hasGlasses, outfit.hasHeadphones, outfit.type]);
  useFrame((state, delta) => {
    const rawVolume = analyzer.getVolume();
    const volume = isNaN(rawVolume) || rawVolume === undefined ? 0 : rawVolume;
    const time = state.clock.getElapsedTime();

    // --- 1. Keyboard & Pathfinding Movement ---
    const isW = keysPressed.current['W'] || keysPressed.current['ARROWUP'];
    const isS = keysPressed.current['S'] || keysPressed.current['ARROWDOWN'];
    const isA = keysPressed.current['A'] || keysPressed.current['ARROWLEFT'];
    const isD = keysPressed.current['D'] || keysPressed.current['ARROWRIGHT'];
    const hasKeyboardInput = isW || isS || isA || isD;

    if (hasKeyboardInput) {
      // Clear pathfinding path
      if (pathRef.current.length > 0) {
        pathRef.current = [];
      }

      // Calculate relative isometric movement vector
      const moveDir = new THREE.Vector3(0, 0, 0);
      if (isW) { moveDir.x -= 1; moveDir.z -= 1; }
      if (isS) { moveDir.x += 1; moveDir.z += 1; }
      if (isA) { moveDir.x -= 1; moveDir.z += 1; }
      if (isD) { moveDir.x += 1; moveDir.z -= 1; }
      moveDir.normalize();

      const walkSpeed = 3.2;
      const nextPos = currentPos.current.clone().addScaledVector(moveDir, delta * walkSpeed);
      currentPos.current.copy(resolveMovement(currentPos.current, nextPos, activeDesk));

      // Rotate avatar smoothly to face movement direction
      const heading = Math.atan2(moveDir.x, moveDir.z);
      currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, heading, 0.25);
    } else if (isWalking && pathRef.current.length > 0) {
      // Pathfinding movement (click-to-move)
      const walkSpeed = 3.2; // Constant walk speed
      const wp = pathRef.current[waypointIndexRef.current];
      
      if (wp) {
        const diff = new THREE.Vector3().subVectors(wp, currentPos.current);
        const dist = diff.length();
        const step = delta * walkSpeed;
        
        if (step >= dist) {
          currentPos.current.copy(resolveMovement(currentPos.current, wp, activeDesk));
          waypointIndexRef.current++;

          if (waypointIndexRef.current >= pathRef.current.length) {
            onArrive();
          }
        } else {
          diff.normalize().multiplyScalar(step);
          const nextPos = currentPos.current.clone().add(diff);
          currentPos.current.copy(resolveMovement(currentPos.current, nextPos, activeDesk));

          const heading = Math.atan2(diff.x, diff.z);
          currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, heading, 0.25);
        }
      } else {
        onArrive();
      }
    } else {
      // Idle state: if we were walking via keyboard but released, notify parent
      if (isWalking && pathRef.current.length === 0) {
        onArrive();
      }

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

    // Periodic check for nearby empty desks to display the Space sit prompt
    if (time - lastStateCheck.current > 0.1) {
      lastStateCheck.current = time;
      
      let foundNearbyDeskId: number | null = null;
      if (activeDesk === null && !isWalking) {
        for (const desk of desks) {
          if (desk.hasColleague === false) {
            const rotY = desk.rotationY || 0;
            const offsetZ = -0.65 * Math.cos(rotY);
            const offsetX = -0.65 * Math.sin(rotY);
            const cx = desk.position[0] + offsetX;
            const cz = desk.position[2] + offsetZ;

            const distSq = (currentPos.current.x - cx) * (currentPos.current.x - cx) + (currentPos.current.z - cz) * (currentPos.current.z - cz);
            if (distSq < 1.1 * 1.1) {
              foundNearbyDeskId = desk.id;
              break;
            }
          }
        }
      }
      
      if (foundNearbyDeskId !== nearbyDeskId) {
        setNearbyDeskId(foundNearbyDeskId);
      }
    }

    // --- 2. Speak/Emoji Reactions ---
    // Speak reaction (Robot GLTF animation trigger)
    if (outfit.type === 'robot' && !isWalking && volume > 0.35 && time - lastSpawnTime.current > 1.5) {
      const reactions = ['Wave', 'Yes', 'ThumbsUp', 'Punch'];
      const randomReaction = reactions[Math.floor(Math.random() * reactions.length)];
      const reactionAction = actions[randomReaction];
      const idleAction = actions['Idle'];

      if (reactionAction && idleAction) {
        idleAction.fadeOut(0.15);
        reactionAction.reset().fadeIn(0.15).setLoop(THREE.LoopOnce, 1).play();
        reactionAction.clampWhenFinished = true;

        const onFinish = () => {
          reactionAction.fadeOut(0.2);
          idleAction.reset().fadeIn(0.2).play();
          const mixer = reactionAction.getMixer();
          mixer.removeEventListener('finished', onFinish);
        };
        reactionAction.getMixer().addEventListener('finished', onFinish);
        
        lastSpawnTime.current = time;
      }
    }

    // Speak reaction (Humanoid procedural animations)
    if (outfit.type === 'human') {
      if (isWalking) {
        const swingSpeed = 12.0;
        const swingAngle = 0.55;
        
        if (humanLeftLegRef.current) {
          humanLeftLegRef.current.rotation.x = Math.sin(time * swingSpeed) * swingAngle;
        }
        if (humanRightLegRef.current) {
          humanRightLegRef.current.rotation.x = -Math.sin(time * swingSpeed) * swingAngle;
        }
        if (humanLeftArmRef.current) {
          humanLeftArmRef.current.rotation.x = -Math.PI / 6 - Math.sin(time * swingSpeed) * (swingAngle * 0.7);
        }
        if (humanRightArmRef.current) {
          humanRightArmRef.current.rotation.x = -Math.PI / 6 + Math.sin(time * swingSpeed) * (swingAngle * 0.7);
        }
      } else {
        const isSeated = activeDesk !== null;
        if (isSeated) {
          // Typing arms + voice modulation
          const typeSpeed = 8.0 + volume * 10.0;
          const typingIntensity = 0.05 + volume * 0.15;
          if (humanLeftArmRef.current && humanRightArmRef.current) {
            humanLeftArmRef.current.rotation.x = -Math.PI / 3.2 + Math.sin(time * typeSpeed) * typingIntensity;
            humanLeftArmRef.current.rotation.z = -0.15 + Math.cos(time * typeSpeed) * 0.02;
            humanRightArmRef.current.rotation.x = -Math.PI / 3.2 + Math.cos(time * typeSpeed * 1.1) * typingIntensity;
            humanRightArmRef.current.rotation.z = 0.15 + Math.sin(time * typeSpeed) * 0.02;
          }
        } else {
          // Standing idle arms + volume wiggle
          if (humanLeftArmRef.current && humanRightArmRef.current) {
            humanLeftArmRef.current.rotation.x = 0;
            humanLeftArmRef.current.rotation.z = -0.05 - volume * 0.2;
            humanRightArmRef.current.rotation.x = 0;
            humanRightArmRef.current.rotation.z = 0.05 + volume * 0.2;
          }
        }

        // Head bobbing + speak node
        if (humanHeadRef.current) {
          const speakNod = volume * 0.25;
          humanHeadRef.current.rotation.x = Math.sin(time * 1.5) * 0.03 + speakNod;
          humanHeadRef.current.rotation.y = Math.cos(time * 0.8) * 0.04;
        }

        // Snap legs
        if (humanLeftLegRef.current && humanRightLegRef.current) {
          if (isSeated) {
            humanLeftLegRef.current.position.set(-0.1, 0.22, 0.18);
            humanLeftLegRef.current.rotation.x = -Math.PI / 2;
            humanRightLegRef.current.position.set(0.1, 0.22, 0.18);
            humanRightLegRef.current.rotation.x = -Math.PI / 2;
          } else {
            humanLeftLegRef.current.position.set(-0.1, 0.15, 0);
            humanLeftLegRef.current.rotation.x = 0;
            humanRightLegRef.current.position.set(0.1, 0.15, 0);
            humanRightLegRef.current.rotation.x = 0;
          }
        }
      }
    }

    // --- 3. Emoji Particle Spawner ---
    if (volume > 0.45 && time - lastSpawnTime.current > 0.35) {
      if (emojiParticlesRef.current && avatarGroupRef.current) {
        const spawnPos: [number, number, number] = [
          currentPos.current.x + (Math.random() - 0.5) * 0.2,
          currentPos.current.y + 0.9,
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

  // Adjust height offsets
  const isSeated = activeDesk !== null && !isWalking;
  const positionOffsetZ = isSeated ? 0.05 : 0;
  const positionOffsetY = isSeated ? (outfit.type === 'robot' ? 0.45 : 0.38) : 0;
  const modelScale = outfit.modelScale ?? 1;
  const modelYOffset = outfit.modelYOffset ?? 0;
  const modelForwardFix = ['xbot', 'cesium-man'].includes(outfit.characterId) ? 0 : Math.PI;
  const modelRotationY = (outfit.modelRotationY ?? 0) + modelForwardFix;
  return (
    <group ref={avatarGroupRef}>
      <group position={[0, positionOffsetY, positionOffsetZ]}>
        {/* Floating Thought Bubble */}
        {activeThoughtEmoji && !activeChatMessage && (
          <Html position={[0, outfit.type === 'robot' ? 1.6 : 2.0, 0]} center>
            <div className="relative flex flex-col items-center select-none pointer-events-none transition-all duration-300 transform scale-100 origin-bottom select-none animate-bounce">
              {/* Main Bubble */}
              <div className="bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center text-xl min-w-[38px] min-h-[38px]">
                {activeThoughtEmoji}
              </div>
              {/* Tail dots */}
              <div className="w-2.5 h-2.5 bg-white/95 border border-slate-200 rounded-full mt-1 shadow-md self-center"></div>
              <div className="w-1.5 h-1.5 bg-white/95 border border-slate-200 rounded-full mt-0.5 ml-1.5 shadow-sm self-center"></div>
            </div>
          </Html>
        )}

        {/* Chat Speech Bubble */}
        {activeChatMessage && (
          <Html position={[0, outfit.type === 'robot' ? 1.7 : 2.1, 0]} center>
            <div className="relative flex flex-col items-center select-none pointer-events-none transition-all duration-300 transform scale-100 origin-bottom select-none">
              {/* Bubble Body */}
              <div className="bg-white/95 backdrop-blur-sm text-slate-800 px-3 py-1.5 rounded-xl shadow-xl border border-slate-100 flex items-center justify-center text-xs font-semibold w-max max-w-[240px] text-center whitespace-normal break-words">
                {activeChatMessage}
              </div>
              {/* Tail triangle */}
              <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/95 drop-shadow-md -mt-0.5"></div>
            </div>
          </Html>
        )}

        {/* E Key Emoji Menu */}
        {showEmojiMenu && (
          <Html position={[0, outfit.type === 'robot' ? 1.5 : 1.9, 0]} center>
            <div 
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2 rounded-xl shadow-2xl flex flex-wrap gap-1.5 w-[160px] justify-center select-none z-50 pointer-events-auto"
            >
              {emojiPool.map((emoji) => (
                <button
                  key={emoji}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectEmoji(emoji);
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 text-base transition-colors duration-150 active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </Html>
        )}

        {/* Spacebar tooltip (Sit down only, no exit prompt) */}
        {nearbyDeskId !== null && activeDesk === null && (
          <Html position={[0, outfit.type === 'robot' ? 1.4 : 1.7, 0]} center>
            <div className={`backdrop-blur-sm px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-lg flex items-center gap-1.5 animate-bounce select-none pointer-events-none border transition-all duration-500 ${
              theme === 'night' 
                ? 'bg-slate-900/95 text-white border-slate-700' 
                : 'bg-white/95 text-slate-800 border-white/60 shadow-md'
            }`}>
              <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-mono border shadow-inner transition-all duration-500 ${
                theme === 'night' 
                  ? 'bg-slate-700 text-slate-100 border-slate-600' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>Space</span>
              <Armchair size={13} className="text-indigo-500 flex-shrink-0" />
            </div>
          </Html>
        )}
        
        {/* Render ROBOT CLASS */}
        {outfit.type === 'robot' && (
          <group scale={0.28}>
            <primitive object={scene} />
          </group>
        )}

        {/* Render HUMAN CLASS */}
        {outfit.type === 'human' && (
          <HumanMesh 
            outfit={outfit}
            isSeated={isSeated}
            humanTorsoRef={humanTorsoRef}
            humanLeftArmRef={humanLeftArmRef}
            humanRightArmRef={humanRightArmRef}
            humanLeftLegRef={humanLeftLegRef}
            humanRightLegRef={humanRightLegRef}
            humanHeadRef={humanHeadRef}
          />
        )}

        {/* Render DOWNLOADED GLB MODEL */}
        {outfit.type === 'model' && outfit.modelUrl && (
          <DownloadedAvatarModel
            modelUrl={outfit.modelUrl}
            scale={modelScale}
            yOffset={modelYOffset}
            rotationY={modelRotationY}
            isWalking={isWalking}
          />
        )}

      </group>
    </group>
  );
};
