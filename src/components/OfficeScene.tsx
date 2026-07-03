import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera, OrbitControls } from "@react-three/drei";
import { IsometricRoom } from "./IsometricRoom";
import { Avatar } from "./Avatar";
import { EmojiParticles } from "./EmojiParticles";
import type { EmojiParticlesHandle } from "./EmojiParticles";
import { ChatBox } from "./Chat/ChatBox";
import type { ChatMessage } from "./Chat/ChatBox";
import type { AvatarOutfit } from "../App";
import { useMultiplayer } from "../context/MultiplayerContext";
import { OtherPlayer } from "./OtherPlayer";
import { useAudioAnalyzer } from "../context/AudioAnalyzerContext";
import { OfficeLights } from "./OfficeScene/OfficeLights";
import { OuterEnvironment } from "./OfficeScene/OuterEnvironment";
import { CityEnvironment } from "./OfficeScene/CityEnvironment";
import { DESK_CONFIGS } from "../utils/deskConfigs";
import type { DeskConfig } from "../utils/deskConfigs";
export { DESK_CONFIGS };
export type { DeskConfig };

// ── One-time shadow map setup (avoids R3F re-applying 'shadows' prop on every re-render) ──────────────
const ShadowSetup: React.FC = () => {
  const { gl } = useThree();
  useEffect(() => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFShadowMap; // non-deprecated replacement for PCFSoftShadowMap
  }, [gl]);
  return null;
};

// ── Remote players rendered in their own layer so only THIS subtree re-renders on socket events ────────
const RemotePlayersLayer: React.FC = () => {
  const { remotePlayers } = useMultiplayer();
  return (
    <>
      {remotePlayers.map((rp) => (
        <React.Suspense key={rp.id} fallback={null}>
          <OtherPlayer player={rp} />
        </React.Suspense>
      ))}
    </>
  );
};

// ── Stable constants outside component (prevent Canvas from re-initialising WebGL on every re-render) ──
const CANVAS_GL = {
  antialias: true,
  powerPreference: "high-performance" as const,
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: THREE.SRGBColorSpace,
};
const CANVAS_DPR: [number, number] = [1, 2];

interface OfficeSceneProps {
  emojiParticlesRef: React.RefObject<EmojiParticlesHandle | null>;
  theme: "day" | "sunset" | "night";
  environmentType: "nature" | "city";
  desks: DeskConfig[];
  sipTrigger: number;
  triggerSip: (deskPosition: [number, number, number]) => void;
  activeDesk: number | null;
  setActiveDesk: (id: number | null) => void;
  outfit: AvatarOutfit;
  playerName: string;
}

export const OfficeScene: React.FC<OfficeSceneProps> = ({
  emojiParticlesRef,
  theme,
  environmentType,
  desks,
  sipTrigger,
  triggerSip,
  activeDesk,
  setActiveDesk,
  outfit,
  playerName,
}) => {
  const { joinRoom, sendMove, sendDesk, sendVolume, sendChat, remoteMessages } =
    useMultiplayer();
  const analyzer = useAudioAnalyzer();

  // Join the multiplayer room once on mount
  useEffect(() => {
    joinRoom(playerName, outfit, [0, 0, 0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Broadcast volume level ~5×/s
  useEffect(() => {
    const id = setInterval(() => sendVolume(analyzer.getVolume()), 200);
    return () => clearInterval(id);
  }, [analyzer, sendVolume]);

  // Merge incoming remote chat messages into chatHistory
  useEffect(() => {
    if (remoteMessages.length === 0) return;
    const msg = remoteMessages[remoteMessages.length - 1];
    setChatHistory((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [
        ...prev,
        {
          id: msg.id,
          sender: msg.name,
          text: msg.text,
          timestamp: msg.timestamp,
          isPlayer: false,
        },
      ];
    });
  }, [remoteMessages]);

  // Throttled move handler passed to Avatar
  const handleAvatarMove = useCallback(
    (pos: [number, number, number], rotY: number, walking: boolean) => {
      sendMove(pos, rotY, walking);
    },
    [sendMove],
  );

  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [targetPosition, setTargetPosition] = useState<
    [number, number, number]
  >([0, 0, 0]); // Standing on rug
  const [queuedTargetPosition, setQueuedTargetPosition] = useState<
    [number, number, number] | null
  >(null);
  const [pendingDeskId, setPendingDeskId] = useState<number | null>(null);

  // Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "1",
      sender: "ระบบ",
      text: "ยินดีต้อนรับสู่ Ufriend Virtual Office! สามารถควบคุมด้วย WASD/ลูกศร หรือคลิกเดินได้ และพิมพ์ข้อความในช่องแชทซ้ายบนได้เลยครับ",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPlayer: false,
    },
  ]);
  const [playerChatMessage, setPlayerChatMessage] = useState<string | null>(
    null,
  );
  const [npcChatMessages, setNpcChatMessages] = useState<
    Record<number, string | null>
  >({});
  const [chatInput, setChatInput] = useState<string>("");

  const playerChatTimerRef = useRef<any>(null);
  const npcTimersRef = useRef<Record<number, any>>({});

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    sendChat(chatInput.trim());
    const newMessage = {
      id: Math.random().toString(),
      sender: playerName,
      text: chatInput.trim(),
      timestamp: timeStr,
      isPlayer: true,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setPlayerChatMessage(chatInput.trim());
    setChatInput("");

    // Clear old timer and start a new 5-second timer for player's speech bubble
    if (playerChatTimerRef.current) {
      clearTimeout(playerChatTimerRef.current);
    }
    playerChatTimerRef.current = setTimeout(() => {
      setPlayerChatMessage(null);
      playerChatTimerRef.current = null;
    }, 5000);
  };

  // Simulate other colleagues randomly typing in chat
  useEffect(() => {
    const npcNames = [
      "เอ็ม",
      "บิว",
      "จอย",
      "ป๊อป",
      "นิว",
      "กิ๊ฟ",
      "ท็อป",
      "แป้ง",
      "อาร์ต",
      "เบล",
      "เต้ย",
      "แนน",
      "บอส",
      "เจมส์",
      "พราว",
      "โอ๊ต",
      "ตั้ม",
      "เนย",
      "พีท",
    ];
    const npcMessages = [
      "ใครเอาขนมปังเนยสดของผมในตู้เย็นไปป่ะครับ? 😭",
      "ประชุมบ่ายนี้ขอนั่งฟังเงียบๆ นะครับ งานล้นมือมาก",
      "WFH วันนี้เน็ตอืดมากกกกก มีใครเป็นบ้าง",
      "บั๊กตัวนี้แก้มา 3 ชั่วโมงแล้ว ยังหาไม่เจอเลยครับ 😵‍💫",
      "ขอตัวไปชงกาแฟแก้วที่ 3 แป๊บนะครับ",
      "ส่งรายงานประจำวันก่อน 5 โมงเย็นนะทุกคน",
      "ประชุมทีมวันนี้มีสรุปอะไรสำคัญไหมครับ พอดีติดสายลูกค้า",
      "บ่ายนี้มีใครสั่งชานมไข่มุกไหมมมม 🧋",
      "งานเสร็จแล้ว! วันนี้ขอปิดคอมเร็วหน่อยนะครับ",
      "กำลังเร่งทำสไลด์นำเสนออยู่ครับ เดี๋ยวส่งให้ตรวจ",
      "วันเสาร์นี้มีใครเข้าออฟฟิศจริงบ้างไหมครับ?",
      "ขอลิ้งก์ Zoom บ่ายนี้หน่อยครับ หาไม่เจอ",
    ];

    const interval = setInterval(() => {
      // Find desks with colleagues that are not active player desk
      const activeColleagues = desks.filter(
        (d) => d.hasColleague !== false && d.id !== activeDesk,
      );
      if (activeColleagues.length === 0) return;

      const randomDesk =
        activeColleagues[Math.floor(Math.random() * activeColleagues.length)];
      const randomText =
        npcMessages[Math.floor(Math.random() * npcMessages.length)];
      const senderName = npcNames[randomDesk.id % npcNames.length];
      const timeStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const newMsg = {
        id: Math.random().toString(),
        sender: senderName,
        text: randomText,
        timestamp: timeStr,
        isPlayer: false,
      };

      setChatHistory((prev) => [...prev, newMsg]);

      // Update NPC speech bubble
      setNpcChatMessages((prev) => ({
        ...prev,
        [randomDesk.id]: randomText,
      }));

      // Set timer to clear speech bubble after 5 seconds
      if (npcTimersRef.current[randomDesk.id]) {
        clearTimeout(npcTimersRef.current[randomDesk.id]);
      }
      npcTimersRef.current[randomDesk.id] = setTimeout(() => {
        setNpcChatMessages((prev) => ({
          ...prev,
          [randomDesk.id]: null,
        }));
        delete npcTimersRef.current[randomDesk.id];
      }, 5000);
    }, 20000); // Send message every 20 seconds

    return () => {
      clearInterval(interval);
      // Clean up all timers on unmount
      if (playerChatTimerRef.current) clearTimeout(playerChatTimerRef.current);
      Object.values(npcTimersRef.current).forEach(clearTimeout);
    };
  }, [desks, activeDesk]);

  const handleSelectDesk = (id: number) => {
    if (isWalking) return;
    setQueuedTargetPosition(null);
    setIsWalking(true);
    setActiveDesk(null);
    sendDesk(null);

    const destDesk = desks[id];
    const rotY = destDesk.rotationY || 0;
    const chairDirectionX = -Math.sin(rotY);
    const chairDirectionZ = -Math.cos(rotY);
    const seatDistance = destDesk.hasColleague === false ? 0.65 : 1.25;

    setPendingDeskId(destDesk.hasColleague === false ? id : null);

    setTargetPosition([
      destDesk.position[0] + chairDirectionX * seatDistance,
      0,
      destDesk.position[2] + chairDirectionZ * seatDistance,
    ]);
  };

  const handleKeyboardStartMove = () => {
    if (isWalking && activeDesk === null) return;
    setQueuedTargetPosition(null);
    setPendingDeskId(null);
    setIsWalking(true);
    setActiveDesk(null);
  };

  const handleStandUp = () => {
    setQueuedTargetPosition(null);
    setPendingDeskId(null);
    setActiveDesk(null);
    setIsWalking(false);
    sendDesk(null);
  };

  const handleSelectFloor = (point: THREE.Vector3) => {
    if (isWalking) return;
    const clickTarget: [number, number, number] = [point.x, 0, point.z];

    if (activeDesk !== null) {
      const desk = desks[activeDesk];
      if (desk) {
        const rotY = desk.rotationY || 0;
        const offsetZ = -0.95 * Math.cos(rotY);
        const offsetX = -0.95 * Math.sin(rotY);

        setQueuedTargetPosition(clickTarget);
        setPendingDeskId(null);
        setIsWalking(true);
        setTargetPosition([
          desk.position[0] + offsetX,
          0,
          desk.position[2] + offsetZ,
        ]);
        return;
      }
    }

    setQueuedTargetPosition(null);
    setPendingDeskId(null);
    setIsWalking(true);
    setActiveDesk(null); // Stand on floor
    setTargetPosition(clickTarget);
  };

  return (
    <div className="w-full h-full relative">
      <Canvas dpr={CANVAS_DPR} gl={CANVAS_GL} className="w-full h-full">
        {/* Shadow map — configured once via useEffect, avoids R3F re-applying every render */}
        <ShadowSetup />

        {/* --- 1. Isometric Camera Setup --- */}
        <OrthographicCamera
          makeDefault
          position={[8, 7, 8]}
          zoom={65}
          near={0.1}
          far={100}
        />

        {/* --- 2. Lighting System (Dynamic Theme) --- */}
        <OfficeLights theme={theme} />

        {/* --- 3. Scene Content --- */}
        <group position={[0, -0.6, 0]}>
          {/* Outer Stylized Environment */}
          {environmentType === "nature" ? (
            <OuterEnvironment theme={theme} />
          ) : (
            <CityEnvironment theme={theme} />
          )}

          {/* Room Geometry - Renders desks and colleague sitters */}
          <IsometricRoom
            activeDesk={activeDesk}
            onSelectDesk={handleSelectDesk}
            onSelectFloor={handleSelectFloor}
            desks={desks}
            theme={theme}
            triggerSip={triggerSip}
            npcChatMessages={npcChatMessages}
          />

          {/* Avatar Sitter - Walks from previous position to the new targetPosition */}
          <React.Suspense fallback={null}>
            <Avatar
              emojiParticlesRef={emojiParticlesRef}
              activeDesk={activeDesk}
              targetPosition={targetPosition}
              isWalking={isWalking}
              onArrive={() => {
                if (queuedTargetPosition) {
                  const nextTarget = queuedTargetPosition;
                  setQueuedTargetPosition(null);
                  setPendingDeskId(null);
                  setActiveDesk(null);
                  setTargetPosition(nextTarget);
                  return;
                }

                if (pendingDeskId !== null) {
                  setActiveDesk(pendingDeskId);
                  sendDesk(pendingDeskId);
                  setPendingDeskId(null);
                }

                setIsWalking(false);
              }}
              desks={desks}
              sipTrigger={sipTrigger}
              outfit={outfit}
              onKeyboardStartMove={handleKeyboardStartMove}
              onSitAtDesk={handleSelectDesk}
              onStandUp={handleStandUp}
              activeChatMessage={playerChatMessage}
              theme={theme}
              onMove={handleAvatarMove}
            />
          </React.Suspense>

          {/* Remote players — isolated layer, only this subtree re-renders on socket events */}
          <RemotePlayersLayer />

          {/* 3D Emoji particles */}
          <EmojiParticles ref={emojiParticlesRef} />
        </group>

        {/* --- 4. Restrictive Camera Controls --- */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minZoom={60}
          maxZoom={250}
          minPolarAngle={Math.PI / 3.8}
          maxPolarAngle={Math.PI / 2.3}
          minAzimuthAngle={-Math.PI / 10}
          maxAzimuthAngle={Math.PI / 1.6}
          target={[0, 0.2, 0]}
        />
      </Canvas>

      {/* 2D Chat UI Overlay Component (positioned at top-left below title) */}
      <ChatBox
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendMessage={handleSendMessage}
        theme={theme}
      />
    </div>
  );
};
