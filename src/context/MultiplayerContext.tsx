import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  startTransition,
} from "react";
import { io, Socket } from "socket.io-client";
import type { AvatarOutfit } from "../App";
import { CHARACTER_OPTIONS } from "../utils/avatarCharacters";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RemotePlayer {
  id: string;
  name: string;
  position: [number, number, number];
  rotationY: number;
  outfit: AvatarOutfit;
  activeDesk: number | null;
  volume: number;
  isWalking: boolean;
  chatMessage: string | null;
}

export interface RemoteChatMessage {
  id: string;
  senderId: string;
  name: string;
  text: string;
  timestamp: string;
}

interface MultiplayerContextType {
  isConnected: boolean;
  myId: string | null;
  remotePlayers: RemotePlayer[];
  remoteMessages: RemoteChatMessage[];
  /** deskId → socket id of the owner */
  claimedDesks: Map<number, string>;
  joinRoom: (
    name: string,
    outfit: AvatarOutfit,
    position: [number, number, number],
  ) => void;
  sendMove: (
    position: [number, number, number],
    rotationY: number,
    isWalking: boolean,
  ) => void;
  sendDesk: (deskId: number | null) => void;
  sendOutfit: (outfit: AvatarOutfit) => void;
  sendVolume: (volume: number) => void;
  sendChat: (text: string) => void;
  /** Returns true if deskId is claimed by ANOTHER player */
  isDeskClaimed: (deskId: number) => boolean;
}

const MultiplayerContext = createContext<MultiplayerContextType | null>(null);

export const useMultiplayer = (): MultiplayerContextType => {
  const ctx = useContext(MultiplayerContext);
  if (!ctx)
    throw new Error("useMultiplayer must be used within <MultiplayerProvider>");
  return ctx;
};

// ── Provider ─────────────────────────────────────────────────────────────────
const BACKEND_URL =
  (import.meta as any).env?.VITE_BACKEND_URL ?? "http://localhost:3001";

const DEFAULT_REMOTE_OUTFIT: AvatarOutfit = {
  type: "human",
  characterId: "human",
  hairStyle: "short",
  hairColor: "#3b2314",
  clothingStyle: "hoodie",
  clothingColor: "#3b82f6",
  skinTone: "#fed7aa",
  hasGlasses: false,
  hasHeadphones: false,
};

const normalizeRemotePlayer = (player: Partial<RemotePlayer> & Record<string, any>): RemotePlayer => {
  const outfit = player.outfit || player.avatar || {};
  const characterId =
    outfit.characterId ??
    player.characterId ??
    player.avatarId ??
    DEFAULT_REMOTE_OUTFIT.characterId;
  const character = CHARACTER_OPTIONS.find((c) => c.id === characterId);

  return {
    id: String(player.id ?? player.socketId ?? ""),
    name: String(player.name ?? "Player"),
    position: Array.isArray(player.position) ? player.position : [0, 0, 0],
    rotationY: typeof player.rotationY === "number" ? player.rotationY : 0,
    outfit: {
      ...DEFAULT_REMOTE_OUTFIT,
      ...outfit,
      type: outfit.type ?? character?.type ?? DEFAULT_REMOTE_OUTFIT.type,
      characterId,
      modelUrl: outfit.modelUrl ?? character?.modelUrl,
      modelScale: outfit.modelScale ?? character?.modelScale,
      modelYOffset: outfit.modelYOffset ?? character?.modelYOffset,
      modelRotationY: outfit.modelRotationY ?? character?.modelRotationY,
    },
    activeDesk: player.activeDesk ?? player.deskId ?? null,
    volume: typeof player.volume === "number" ? player.volume : 0,
    isWalking: Boolean(player.isWalking),
    chatMessage: player.chatMessage ?? null,
  };
};

export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [remoteMessages, setRemoteMessages] = useState<RemoteChatMessage[]>([]);
  const [claimedDesks, setClaimedDesks] = useState<Map<number, string>>(
    new Map(),
  );

  const socketRef = useRef<Socket | null>(null);
  const joinPayloadRef = useRef<{
    name: string;
    outfit: AvatarOutfit;
    position: [number, number, number];
  } | null>(null);
  // Buffer for high-frequency move/volume events — flushed at 20fps to avoid excessive re-renders
  const moveBufferRef = useRef<
    Map<
      string,
      {
        position: [number, number, number];
        rotationY: number;
        isWalking: boolean;
      }
    >
  >(new Map());
  const volumeBufferRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    // Flush position + volume buffers into React state at 20fps (50ms)
    const flushId = setInterval(() => {
      const moves = moveBufferRef.current;
      const volumes = volumeBufferRef.current;
      if (moves.size === 0 && volumes.size === 0) return;
      moveBufferRef.current = new Map();
      volumeBufferRef.current = new Map();
      startTransition(() => {
        setRemotePlayers((prev) =>
          prev.map((p) => {
            const m = moves.get(p.id);
            const v = volumes.get(p.id);
            if (!m && v === undefined) return p;
            return {
              ...p,
              ...(m ?? {}),
              ...(v !== undefined ? { volume: v } : {}),
            };
          }),
        );
      });
    }, 50);
    return () => clearInterval(flushId);
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      setMyId(socket.id ?? null);
      console.log("[Multiplayer] Connected:", socket.id);
      if (joinPayloadRef.current) {
        socket.emit("join", joinPayloadRef.current);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      setMyId(null);
      console.log("[Multiplayer] Disconnected");
    });

    // Full snapshot on initial join
    socket.on(
      "room:init",
      (data: { players: RemotePlayer[]; claimedDesks: [number, string][] }) => {
        startTransition(() => {
          setRemotePlayers(
            data.players
              .map((p) => normalizeRemotePlayer(p as any))
              .filter((p) => p.id && p.id !== socket.id),
          );
          setClaimedDesks(new Map(data.claimedDesks));
        });
      },
    );

    // New player joined the room
    socket.on("player:joined", (data: { player: RemotePlayer }) => {
      const player = normalizeRemotePlayer(data.player as any);
      startTransition(() => {
        setRemotePlayers((prev) => [
          ...prev.filter((p) => p.id !== player.id),
          player,
        ]);
      });
    });

    // Position / walk state update — buffered, flushed at 20fps
    socket.on(
      "player:moved",
      (data: {
        id: string;
        position: [number, number, number];
        rotationY: number;
        isWalking: boolean;
      }) => {
        moveBufferRef.current.set(data.id, {
          position: data.position,
          rotationY: data.rotationY,
          isWalking: data.isWalking,
        });
      },
    );

    // Desk claim / release
    socket.on("player:desk", (data: { id: string; deskId: number | null }) => {
      setRemotePlayers((prev) =>
        prev.map((p) =>
          p.id === data.id ? { ...p, activeDesk: data.deskId } : p,
        ),
      );
      setClaimedDesks((prev) => {
        const next = new Map(prev);
        // Remove any previous claim by this player
        for (const [k, v] of next) {
          if (v === data.id) next.delete(k);
        }
        if (data.deskId !== null) next.set(data.deskId, data.id);
        return next;
      });
    });

    socket.on("player:outfit", (data: { id: string; outfit: AvatarOutfit }) => {
      setRemotePlayers((prev) =>
        prev.map((p) =>
          p.id === data.id
            ? { ...p, outfit: normalizeRemotePlayer({ ...p, outfit: data.outfit }).outfit }
            : p,
        ),
      );
    });

    // Audio volume level — buffered, flushed at 20fps
    socket.on("player:volume", (data: { id: string; volume: number }) => {
      volumeBufferRef.current.set(data.id, data.volume);
    });

    // Chat message from another player
    socket.on(
      "player:chat",
      (data: { id: string; name: string; text: string; timestamp: string }) => {
        // Don't echo our own messages (we add them locally)
        if (data.id === socket.id) return;

        const msg: RemoteChatMessage = {
          id: Math.random().toString(36).slice(2),
          senderId: data.id,
          name: data.name,
          text: data.text,
          timestamp: data.timestamp,
        };
        setRemoteMessages((prev) => [...prev.slice(-99), msg]); // keep last 100

        // Update speech bubble for that player
        setRemotePlayers((prev) =>
          prev.map((p) =>
            p.id === data.id ? { ...p, chatMessage: data.text } : p,
          ),
        );
        // Auto-clear bubble after 5 s
        setTimeout(() => {
          setRemotePlayers((prev) =>
            prev.map((p) =>
              p.id === data.id && p.chatMessage === data.text
                ? { ...p, chatMessage: null }
                : p,
            ),
          );
        }, 5000);
      },
    );

    // Player left the room
    socket.on("player:left", (data: { id: string }) => {
      setRemotePlayers((prev) => prev.filter((p) => p.id !== data.id));
      setClaimedDesks((prev) => {
        const next = new Map(prev);
        for (const [k, v] of next) {
          if (v === data.id) next.delete(k);
        }
        return next;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback(
    (
      name: string,
      outfit: AvatarOutfit,
      position: [number, number, number],
    ) => {
      joinPayloadRef.current = { name, outfit, position };
      socketRef.current?.emit("join", { name, outfit, position });
    },
    [],
  );

  const sendMove = useCallback(
    (
      position: [number, number, number],
      rotationY: number,
      isWalking: boolean,
    ) => {
      socketRef.current?.emit("move", { position, rotationY, isWalking });
    },
    [],
  );

  const sendDesk = useCallback((deskId: number | null) => {
    socketRef.current?.emit("desk", { deskId });
  }, []);

  const sendOutfit = useCallback((outfit: AvatarOutfit) => {
    if (joinPayloadRef.current) {
      joinPayloadRef.current = { ...joinPayloadRef.current, outfit };
    }
    socketRef.current?.emit("outfit:update", { outfit });
  }, []);

  const sendVolume = useCallback((volume: number) => {
    socketRef.current?.emit("volume", { volume });
  }, []);

  const sendChat = useCallback((text: string) => {
    socketRef.current?.emit("chat", { text });
  }, []);

  const isDeskClaimed = useCallback(
    (deskId: number) => {
      const owner = claimedDesks.get(deskId);
      return owner !== undefined && owner !== myId;
    },
    [claimedDesks, myId],
  );

  return (
    <MultiplayerContext.Provider
      value={{
        isConnected,
        myId,
        remotePlayers,
        remoteMessages,
        claimedDesks,
        joinRoom,
        sendMove,
        sendDesk,
        sendOutfit,
        sendVolume,
        sendChat,
        isDeskClaimed,
      }}
    >
      {children}
    </MultiplayerContext.Provider>
  );
};
