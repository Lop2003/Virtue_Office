import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { IsometricRoom } from './IsometricRoom';
import { Avatar } from './Avatar';
import { EmojiParticles } from './EmojiParticles';
import type { EmojiParticlesHandle } from './EmojiParticles';
import { ChatBox } from './Chat/ChatBox';
import type { ChatMessage } from './Chat/ChatBox';
import type { AvatarOutfit } from '../App';

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
  hasColleague?: boolean;
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
      lightIntensity: 1.5,
      hasColleague: id % 3 !== 0 // Remove some colleagues
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
      lightIntensity: 1.5,
      hasColleague: id % 2 !== 0 // Remove some colleagues
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
      lightIntensity: 1.5,
      hasColleague: id % 4 !== 0 // Remove some colleagues
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
      lightIntensity: 1.5,
      hasColleague: id % 3 !== 1 // Remove some colleagues
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
  outfit: AvatarOutfit;
}

export const OfficeScene: React.FC<OfficeSceneProps> = ({ 
  emojiParticlesRef,
  theme,
  desks,
  sipTrigger,
  triggerSip,
  activeDesk,
  setActiveDesk,
  outfit
}) => {
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [targetPosition, setTargetPosition] = useState<[number, number, number]>([0, 0, 0]); // Standing on rug

  // Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', sender: 'ระบบ', text: 'ยินดีต้อนรับสู่ Ufriend Virtual Office! สามารถควบคุมด้วย WASD/ลูกศร หรือคลิกเดินได้ และพิมพ์ข้อความในช่องแชทซ้ายบนได้เลยครับ', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isPlayer: false }
  ]);
  const [playerChatMessage, setPlayerChatMessage] = useState<string | null>(null);
  const [npcChatMessages, setNpcChatMessages] = useState<Record<number, string | null>>({});
  const [chatInput, setChatInput] = useState<string>('');
  
  const playerChatTimerRef = useRef<any>(null);
  const npcTimersRef = useRef<Record<number, any>>({});

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = {
      id: Math.random().toString(),
      sender: 'คุณ',
      text: chatInput.trim(),
      timestamp: timeStr,
      isPlayer: true,
    };

    setChatHistory((prev) => [...prev, newMessage]);
    setPlayerChatMessage(chatInput.trim());
    setChatInput('');

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
    const npcNames = ["เอ็ม", "บิว", "จอย", "ป๊อป", "นิว", "กิ๊ฟ", "ท็อป", "แป้ง", "อาร์ต", "เบล", "เต้ย", "แนน", "บอส", "เจมส์", "พราว", "โอ๊ต", "ตั้ม", "เนย", "พีท"];
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
      const activeColleagues = desks.filter((d) => d.hasColleague !== false && d.id !== activeDesk);
      if (activeColleagues.length === 0) return;

      const randomDesk = activeColleagues[Math.floor(Math.random() * activeColleagues.length)];
      const randomText = npcMessages[Math.floor(Math.random() * npcMessages.length)];
      const senderName = npcNames[randomDesk.id % npcNames.length];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
    setIsWalking(true);
    setActiveDesk(id);

    const destDesk = desks[id];
    const rotY = destDesk.rotationY || 0;
    const offsetZ = -0.65 * Math.cos(rotY);
    const offsetX = -0.65 * Math.sin(rotY);

    setTargetPosition([
      destDesk.position[0] + offsetX,
      0,
      destDesk.position[2] + offsetZ
    ]);
  };
  
  const handleKeyboardStartMove = () => {
    if (isWalking && activeDesk === null) return;
    setIsWalking(true);
    setActiveDesk(null);
  };

  const handleStandUp = () => {
    setActiveDesk(null);
    setIsWalking(false);
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
          ambientIntensity: 0.6,
          hemiColor: '#3b82f6',
          hemiGround: '#0f172a',
          hemiIntensity: 0.65,
          dirColor: '#818cf8',
          dirIntensity: 1.1,
          dirPos: [6, 9, 5] as [number, number, number],
          fillColor: '#c084fc',
          fillIntensity: 0.7,
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
        shadows="soft"
        dpr={[1, 2]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
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
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
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
            npcChatMessages={npcChatMessages}
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
              outfit={outfit}
              onKeyboardStartMove={handleKeyboardStartMove}
              onSitAtDesk={handleSelectDesk}
              onStandUp={handleStandUp}
              activeChatMessage={playerChatMessage}
              theme={theme}
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
