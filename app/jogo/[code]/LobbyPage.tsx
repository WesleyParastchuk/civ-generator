"use client";

import { useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import type { ClientMessage, RoomConfig, ServerMessage, ServerPlayer } from "@/lib/lobbyTypes";
import { getLobbySession, clearLobbySession } from "@/lib/sessionLobby";
import { NicknameGate } from "@/components/lobby/NicknameGate";
import { LobbyPanel } from "@/components/lobby/LobbyPanel";

type PlayerInfo = {
  nickname: string;
  isHost: boolean;
  config: RoomConfig | null;
};

type ConnectedProps = {
  code: string;
  playerInfo: PlayerInfo;
};

function LobbyConnected({ code, playerInfo }: ConnectedProps) {
  const [players, setPlayers] = useState<ServerPlayer[]>([]);
  const [config, setConfig] = useState<RoomConfig | null>(playerInfo.config);
  const [myId, setMyId] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const joinSentRef = useRef(false);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: code,
    onOpen() {
      if (joinSentRef.current) return;
      joinSentRef.current = true;
      const msg: ClientMessage = {
        type: "join",
        payload: {
          nickname: playerInfo.nickname,
          isHost: playerInfo.isHost,
          ...(playerInfo.config ? { config: playerInfo.config } : {}),
        },
      };
      socket.send(JSON.stringify(msg));
    },
    onMessage(evt) {
      const msg = JSON.parse(evt.data as string) as ServerMessage;
      if (msg.type === "welcome") {
        setMyId(msg.payload.connectionId);
      } else if (msg.type === "room_update") {
        setPlayers(msg.payload.players);
        if (msg.payload.config) setConfig(msg.payload.config);
      } else if (msg.type === "room_expired") {
        setExpired(true);
      }
    },
  });

  const handleToggleReady = () => {
    const msg: ClientMessage = { type: "toggle_ready" };
    socket.send(JSON.stringify(msg));
  };

  if (expired) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center flex-col gap-4">
        <p className="font-[var(--font-cinzel)] text-xl text-[rgb(239_223_187_/_0.9)]">
          Sala expirada
        </p>
        <p className="text-sm text-[rgb(206_189_156_/_0.7)]">
          Esta sala foi encerrada por inatividade.
        </p>
        <a
          href="/"
          className="mt-2 text-sm font-semibold text-[rgb(214_178_97_/_0.9)] underline underline-offset-4"
        >
          Criar nova sala
        </a>
      </div>
    );
  }

  const myPlayer = players.find((p) => p.id === myId) ?? null;

  return (
    <LobbyPanel
      code={code}
      config={config}
      players={players}
      myId={myId}
      myReady={myPlayer?.ready ?? false}
      onToggleReady={handleToggleReady}
    />
  );
}

export function LobbyPage({ code }: { code: string }) {
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);

  useEffect(() => {
    const session = getLobbySession(code);
    if (session) {
      setPlayerInfo(session);
      clearLobbySession(code);
    }
  }, [code]);

  if (!playerInfo) {
    return (
      <NicknameGate
        onSubmit={(nickname) =>
          setPlayerInfo({ nickname, isHost: false, config: null })
        }
      />
    );
  }

  return <LobbyConnected code={code} playerInfo={playerInfo} />;
}
