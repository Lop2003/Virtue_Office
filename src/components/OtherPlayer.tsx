import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { Html, useAnimations, useGLTF } from "@react-three/drei";
import type { RemotePlayer } from "../context/MultiplayerContext";
import { CHARACTER_OPTIONS } from "../utils/avatarCharacters";

const ROBOT_URL = "/RobotExpressive.glb";

useGLTF.preload(ROBOT_URL);
useGLTF.preload("/characters/CesiumMan.glb");
useGLTF.preload("/characters/Soldier.glb");
useGLTF.preload("/characters/Xbot.glb");

// ── Shared geometries (created once, reused for every remote player) ──────────
const RP_HEAD_GEO = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const RP_TORSO_GEO = new THREE.CylinderGeometry(0.24, 0.2, 0.55, 6);
const RP_NECK_GEO = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 6);
const RP_ARM_GEO = new THREE.CylinderGeometry(0.06, 0.05, 0.4, 6);
const RP_HAND_GEO = new THREE.SphereGeometry(0.055, 6, 6);
const RP_LEG_GEO = new THREE.CylinderGeometry(0.07, 0.06, 0.5, 6);
const RP_FOOT_GEO = new THREE.BoxGeometry(0.1, 0.08, 0.18);
const RP_EYE_GEO = new THREE.BoxGeometry(0.05, 0.06, 0.02);
const RP_HAIR_GEO = new THREE.BoxGeometry(0.52, 0.15, 0.45);
const RP_GLASS_RIM = new THREE.TorusGeometry(0.08, 0.015, 4, 8);
const RP_GLASS_BRDG = new THREE.BoxGeometry(0.1, 0.02, 0.01);
const RP_HP_BAND = new THREE.TorusGeometry(0.26, 0.03, 6, 12, Math.PI);
const RP_HP_CUP = new THREE.CylinderGeometry(0.11, 0.11, 0.06, 8);

const MAT_EYE = new THREE.MeshBasicMaterial({ color: "#111827" });
const MAT_GLASS = new THREE.MeshBasicMaterial({ color: "#111827" });
const MAT_HP_BAND_M = new THREE.MeshLambertMaterial({ color: "#3b82f6" });
const MAT_HP_CUP_M = new THREE.MeshLambertMaterial({ color: "#111827" });
const MAT_SHOE = new THREE.MeshLambertMaterial({ color: "#1f2937" });

// Material cache to avoid allocating per-player per-frame
const matCache: Record<
  string,
  THREE.MeshLambertMaterial | THREE.MeshStandardMaterial
> = {};
const getLambertMat = (color: string) => {
  if (!matCache[`l_${color}`])
    matCache[`l_${color}`] = new THREE.MeshLambertMaterial({ color });
  return matCache[`l_${color}`] as THREE.MeshLambertMaterial;
};
const getStdMat = (color: string, roughness = 0.7) => {
  const key = `s_${color}_${roughness}`;
  if (!matCache[key])
    matCache[key] = new THREE.MeshStandardMaterial({ color, roughness });
  return matCache[key] as THREE.MeshStandardMaterial;
};

const pickAction = (
  actions: ReturnType<typeof useAnimations>["actions"],
  patterns: RegExp[],
) => {
  for (const pattern of patterns) {
    const match = Object.entries(actions).find(
      ([name, action]) => action && pattern.test(name),
    );
    if (match?.[1]) return match[1];
  }
  return undefined;
};

const RemoteGltfAvatar: React.FC<{
  modelUrl: string;
  scale: number;
  yOffset: number;
  rotationY: number;
  isWalking: boolean;
  isSeated: boolean;
  isRobot: boolean;
}> = ({ modelUrl, scale, yOffset, rotationY, isWalking, isSeated, isRobot }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(modelUrl);
  const modelScene = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { actions } = useAnimations(animations, groupRef);

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
      pickAction(actions, [/^walk/i, /walk/i, /^run/i, /run/i, /animation/i]) ||
      modelActions[0];
    const idleAction = pickAction(actions, [/^idle$/i, /idle/i, /stand/i]);
    const sittingAction = pickAction(actions, [/^sitting$/i, /sitting/i, /sit/i]);
    const nextAction = isWalking
      ? walkAction
      : isSeated && isRobot
        ? sittingAction || idleAction
        : idleAction;

    modelActions.forEach((action) => {
      if (action !== nextAction) action?.fadeOut(0.12);
    });

    if (nextAction) {
      nextAction.reset().fadeIn(0.16).play();
      nextAction.timeScale = isWalking ? 1.15 : 1;
    }

    return () => {
      modelActions.forEach((action) => action?.fadeOut(0.12));
    };
  }, [actions, isRobot, isSeated, isWalking]);

  return (
    <group
      ref={groupRef}
      scale={scale}
      position={[0, isSeated && isRobot ? yOffset + 0.45 : yOffset, isSeated ? 0.05 : 0]}
      rotation={[0, rotationY, 0]}
    >
      <primitive object={modelScene} />
    </group>
  );
};

// ── Component ─────────────────────────────────────────────────────────────────
interface OtherPlayerProps {
  player: RemotePlayer;
}

export const OtherPlayer: React.FC<OtherPlayerProps> = ({ player }) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  // Smoothly interpolated world-space position & rotation
  const interpPos = useRef(
    new THREE.Vector3(
      player.position?.[0] ?? 0,
      player.position?.[1] ?? 0,
      player.position?.[2] ?? 0,
    ),
  );
  const interpRotY = useRef(player.rotationY ?? 0);
  // Reuse a single Vector3 to avoid per-frame GC pressure
  const targetRef = useRef(new THREE.Vector3());

  useFrame((_state, delta) => {
    // Smooth position lerp toward server-authoritative position
    targetRef.current.set(
      player.position?.[0] ?? 0,
      player.position?.[1] ?? 0,
      player.position?.[2] ?? 0,
    );
    interpPos.current.lerp(targetRef.current, Math.min(1, delta * 12));
    interpRotY.current = THREE.MathUtils.lerp(
      interpRotY.current,
      player.rotationY ?? 0,
      Math.min(1, delta * 10),
    );

    if (groupRef.current) {
      groupRef.current.position.copy(interpPos.current);
      groupRef.current.rotation.y = interpRotY.current;
    }

    const t = performance.now() / 1000;

    if (player.isWalking) {
      const speed = 6;
      const swing = 0.5;
      if (leftArmRef.current)
        leftArmRef.current.rotation.x = Math.sin(t * speed) * swing;
      if (rightArmRef.current)
        rightArmRef.current.rotation.x = -Math.sin(t * speed) * swing;
      if (leftLegRef.current)
        leftLegRef.current.rotation.x = -Math.sin(t * speed) * swing * 0.8;
      if (rightLegRef.current)
        rightLegRef.current.rotation.x = Math.sin(t * speed) * swing * 0.8;
    } else if (player.activeDesk !== null) {
      // Typing animation while seated
      const ts = 5;
      if (leftArmRef.current)
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          -Math.PI / 3 + Math.sin(t * ts) * 0.06,
          0.15,
        );
      if (rightArmRef.current)
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          -Math.PI / 3 + Math.cos(t * ts) * 0.06,
          0.15,
        );
      if (leftLegRef.current)
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          0.1,
        );
      if (rightLegRef.current)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          0.1,
        );
    } else {
      // Idle — settle everything back to neutral
      if (leftArmRef.current)
        leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
          leftArmRef.current.rotation.x,
          0,
          0.1,
        );
      if (rightArmRef.current)
        rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
          rightArmRef.current.rotation.x,
          0,
          0.1,
        );
      if (leftLegRef.current)
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          0.1,
        );
      if (rightLegRef.current)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          0.1,
        );
    }

    // Gentle idle head bob
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 1.4) * 0.03;
    }
  });

  const { outfit } = player;
  const character = CHARACTER_OPTIONS.find((c) => c.id === outfit?.characterId);
  const resolvedType = outfit?.type ?? character?.type ?? "human";
  const resolvedModelUrl =
    resolvedType === "robot"
      ? ROBOT_URL
      : outfit?.modelUrl || character?.modelUrl;
  const resolvedModelScale = outfit?.modelScale ?? character?.modelScale ?? 1;
  const resolvedModelYOffset = outfit?.modelYOffset ?? character?.modelYOffset ?? 0;
  const resolvedForwardFix = ["xbot", "cesium-man"].includes(
    outfit?.characterId ?? "",
  )
    ? 0
    : Math.PI;
  const resolvedModelRotationY =
    (outfit?.modelRotationY ?? character?.modelRotationY ?? 0) +
    resolvedForwardFix;
  const shouldRenderGltf =
    resolvedType === "robot" || (resolvedType === "model" && resolvedModelUrl);
  const clothingColor = outfit?.clothingColor ?? "#3b82f6";
  const skinTone = outfit?.skinTone ?? "#fed7aa";
  const hairColor = outfit?.hairColor ?? "#3b2314";
  const hasGlasses = outfit?.hasGlasses ?? false;
  const hasHeadphones = outfit?.hasHeadphones ?? false;

  return (
    <group ref={groupRef}>
      {/* ── Name badge ─────────────────────────────────────────────────────── */}
      <Html position={[0, 2.1, 0]} center distanceFactor={8}>
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
          className="px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[11px] font-bold backdrop-blur-sm shadow-lg"
        >
          {player.name}
        </div>
      </Html>

      {/* ── Speech bubble ──────────────────────────────────────────────────── */}
      {player.chatMessage && (
        <Html position={[0, 1.85, 0]} center distanceFactor={8}>
          <div
            style={{ pointerEvents: "none", userSelect: "none" }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/95 text-slate-800 px-3 py-1.5 rounded-xl shadow-xl border border-slate-100 text-xs font-semibold max-w-[200px] text-center whitespace-normal break-words">
              {player.chatMessage}
            </div>
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white/95 -mt-0.5" />
          </div>
        </Html>
      )}

      {shouldRenderGltf && resolvedModelUrl ? (
        <RemoteGltfAvatar
          modelUrl={resolvedModelUrl}
          scale={resolvedType === "robot" ? 0.28 : resolvedModelScale}
          yOffset={resolvedModelYOffset}
          rotationY={resolvedType === "robot" ? 0 : resolvedModelRotationY}
          isWalking={player.isWalking}
          isSeated={player.activeDesk !== null}
          isRobot={resolvedType === "robot"}
        />
      ) : (
        <>
      {/* ── Torso ──────────────────────────────────────────────────────────── */}
      <mesh
        position={[0, 0.7, 0]}
        castShadow
        geometry={RP_TORSO_GEO}
        material={getStdMat(clothingColor)}
      />

      {/* ── Neck ───────────────────────────────────────────────────────────── */}
      <mesh
        position={[0, 1.02, 0]}
        geometry={RP_NECK_GEO}
        material={getLambertMat(skinTone)}
      />

      {/* ── Left Arm ───────────────────────────────────────────────────────── */}
      <group
        ref={leftArmRef}
        position={[-0.29, 0.88, 0.02]}
        rotation={[0, 0, -0.1]}
      >
        <mesh geometry={RP_ARM_GEO} material={getLambertMat(clothingColor)} />
        <mesh
          position={[0, -0.22, 0]}
          geometry={RP_HAND_GEO}
          material={getLambertMat(skinTone)}
        />
      </group>

      {/* ── Right Arm ──────────────────────────────────────────────────────── */}
      <group
        ref={rightArmRef}
        position={[0.29, 0.88, 0.02]}
        rotation={[0, 0, 0.1]}
      >
        <mesh geometry={RP_ARM_GEO} material={getLambertMat(clothingColor)} />
        <mesh
          position={[0, -0.22, 0]}
          geometry={RP_HAND_GEO}
          material={getLambertMat(skinTone)}
        />
      </group>

      {/* ── Left Leg ───────────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.13, 0.27, 0]}>
        <mesh geometry={RP_LEG_GEO} material={getStdMat(clothingColor, 0.8)} />
        <mesh
          position={[0, -0.27, 0.04]}
          geometry={RP_FOOT_GEO}
          material={MAT_SHOE}
        />
      </group>

      {/* ── Right Leg ──────────────────────────────────────────────────────── */}
      <group ref={rightLegRef} position={[0.13, 0.27, 0]}>
        <mesh geometry={RP_LEG_GEO} material={getStdMat(clothingColor, 0.8)} />
        <mesh
          position={[0, -0.27, 0.04]}
          geometry={RP_FOOT_GEO}
          material={MAT_SHOE}
        />
      </group>

      {/* ── Head ───────────────────────────────────────────────────────────── */}
      <group ref={headRef} position={[0, 1.32, 0]}>
        <mesh
          castShadow
          geometry={RP_HEAD_GEO}
          material={getStdMat(skinTone, 0.5)}
        />

        {/* Eyes */}
        <mesh
          position={[-0.14, 0.04, 0.255]}
          geometry={RP_EYE_GEO}
          material={MAT_EYE}
        />
        <mesh
          position={[0.14, 0.04, 0.255]}
          geometry={RP_EYE_GEO}
          material={MAT_EYE}
        />

        {/* Hair */}
        <mesh
          position={[0, 0.2, 0.05]}
          geometry={RP_HAIR_GEO}
          material={getLambertMat(hairColor)}
        />

        {/* Glasses */}
        {hasGlasses && (
          <group position={[0, 0.04, 0.26]}>
            <mesh
              position={[-0.14, 0, 0]}
              geometry={RP_GLASS_RIM}
              material={MAT_GLASS}
            />
            <mesh
              position={[0.14, 0, 0]}
              geometry={RP_GLASS_RIM}
              material={MAT_GLASS}
            />
            <mesh
              position={[0, 0, 0]}
              geometry={RP_GLASS_BRDG}
              material={MAT_GLASS}
            />
          </group>
        )}

        {/* Headphones */}
        {hasHeadphones && (
          <group position={[0, 0.04, 0]}>
            <mesh geometry={RP_HP_BAND} material={MAT_HP_BAND_M} />
            <mesh
              position={[-0.26, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              geometry={RP_HP_CUP}
              material={MAT_HP_CUP_M}
            />
            <mesh
              position={[0.26, 0, 0]}
              rotation={[0, 0, -Math.PI / 2]}
              geometry={RP_HP_CUP}
              material={MAT_HP_CUP_M}
            />
          </group>
        )}
      </group>
        </>
      )}
    </group>
  );
};
