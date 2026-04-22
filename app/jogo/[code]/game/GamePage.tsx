"use client";

import { useEffect, useRef, useState } from "react";
import usePartySocket from "partysocket/react";
import type {
  ClientMessage,
  ConfigFieldSchema,
  GameConfigSchema,
  ServerMessage,
  ServerPlayer,
  TieBreakPending,
  VoteCast,
  VoteScope,
  VotingState,
} from "@/lib/lobbyTypes";
import { Globe, User } from "lucide-react";
import { TurnHeader } from "@/components/game/TurnHeader";
import { TurnFooter } from "@/components/game/TurnFooter";
import { BetweenTurnsOverlay } from "@/components/game/BetweenTurnsOverlay";
import { VotingField, type LeaderEntry } from "@/components/game/VotingField";
import { GameOverScreen } from "@/components/game/GameOverScreen";

type GameSession = {
  config: { turns: number; pointsPerTurn: number; turnDurationSeconds: number };
  isHost: boolean;
  nickname: string;
};

type Tab = { id: string; label: string; scope: VoteScope };

function buildTurnTally(
  votes: VoteCast[],
  scope: VoteScope,
  field: string,
): Record<string, number> {
  const scopeId = scope === "match" ? "match" : scope.playerId;
  const result: Record<string, number> = {};
  for (const vote of votes) {
    const vScopeId = vote.scope === "match" ? "match" : vote.scope.playerId;
    if (vScopeId === scopeId && vote.field === field) {
      result[String(vote.value)] = (result[String(vote.value)] ?? 0) + vote.weight;
    }
  }
  return result;
}

function buildMyTurnTally(
  votes: VoteCast[],
  voterId: string,
  scope: VoteScope,
  field: string,
): Record<string, number> {
  const scopeId = scope === "match" ? "match" : scope.playerId;
  const result: Record<string, number> = {};
  for (const vote of votes) {
    const vScopeId = vote.scope === "match" ? "match" : vote.scope.playerId;
    if (vote.voterId === voterId && vote.field === field && vScopeId === scopeId) {
      result[String(vote.value)] = (result[String(vote.value)] ?? 0) + vote.weight;
    }
  }
  return result;
}

export function GamePage({ code }: { code: string }) {
  const [session, setSession] = useState<GameSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const [myId, setMyId] = useState<string | null>(null);
  const [players, setPlayers] = useState<ServerPlayer[]>([]);
  const [votingState, setVotingState] = useState<VotingState | null>(null);
  const [configSchema, setConfigSchema] = useState<GameConfigSchema | null>(null);
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>("match");

  const joinSentRef = useRef(false);

  // Read sessionStorage client-side only (avoids SSR hydration mismatch)
  useEffect(() => {
    const raw = sessionStorage.getItem(`game-${code}`);
    setSession(raw ? (JSON.parse(raw) as GameSession) : null); // eslint-disable-line react-hooks/set-state-in-effect
    setSessionReady(true);
  }, [code]);

  // Fetch config.json + leaders.json
  useEffect(() => {
    fetch("/data/config.json")
      .then((r) => r.json())
      .then((data) => setConfigSchema(data as GameConfigSchema))
      .catch(() => {});
    fetch("/data/leaders.json")
      .then((r) => r.json())
      .then((data) => setLeaders((data as { civilizations: LeaderEntry[] }).civilizations))
      .catch(() => {});
  }, []);

  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST!,
    room: code,
    onOpen() {
      if (joinSentRef.current || !session) return;
      joinSentRef.current = true;
      const msg: ClientMessage = {
        type: "join",
        payload: { nickname: session.nickname, isHost: session.isHost },
      };
      socket.send(JSON.stringify(msg));
    },
    onMessage(evt) {
      const msg = JSON.parse(evt.data as string) as ServerMessage;
      if (msg.type === "welcome") {
        setMyId(msg.payload.connectionId);
      } else if (msg.type === "room_update") {
        setPlayers(msg.payload.players);
      } else if (msg.type === "voting_state") {
        setVotingState(msg.payload);
      }
    },
  });

  const sendMsg = (msg: ClientMessage) => socket.send(JSON.stringify(msg));

  const handleVote = (scope: VoteScope, field: string, value: string | number | boolean, weight: number) => {
    sendMsg({ type: "cast_vote", payload: { scope, field, value, weight } });
  };

  const handleRemoveVote = (scope: VoteScope, field: string, value: string | number | boolean) => {
    sendMsg({ type: "remove_vote", payload: { scope, field, value } });
  };

  const handleEndTurn = () => sendMsg({ type: "end_turn" });
  const handleConfirmNextTurn = () => sendMsg({ type: "confirm_next_turn" });

  const handleResolveTie = (pending: TieBreakPending, value: string | number | boolean) => {
    sendMsg({ type: "resolve_tie", payload: { scope: pending.scope, field: pending.field, value } });
  };

  if (!sessionReady) return null;

  if (!session) {
    return (
      <div className="imperial-border mx-auto w-full max-w-3xl rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] p-10 text-center">
        <p className="text-[rgb(206_189_156_/_0.7)]">Sessão expirada. Volte ao início.</p>
      </div>
    );
  }

  // Game over screen
  if (votingState?.phase === "game_over") {
    return (
      <>
        <GameOverScreen
          votingState={votingState}
          configSchema={configSchema}
          leaders={leaders}
          players={players}
          isHost={session.isHost}
          onResolveTie={handleResolveTie}
        />
      </>
    );
  }

  // Compute tabs from connected players
  const tabs: Tab[] = [
    { id: "match", label: "Partida", scope: "match" },
    ...players.map((p) => ({ id: p.id, label: p.nickname, scope: { playerId: p.id } as VoteScope })),
  ];

  const mySpent = votingState ? (votingState.spendByVoter[myId ?? ""] ?? 0) : 0;
  const pointsPerTurn = votingState?.pointsPerTurn ?? session.config.pointsPerTurn;
  const pointsRemaining = pointsPerTurn - mySpent;
  const currentTurn = votingState?.currentTurn ?? 1;
  const totalTurns = votingState?.totalTurns ?? session.config.turns;

  const activeScope = tabs.find((t) => t.id === activeTab)?.scope ?? "match";
  const rawEntries = activeTab === "match"
    ? Object.entries(configSchema?.matchConfig ?? {})
    : Object.entries(configSchema?.playerConfig ?? {});
  const fields = rawEntries.filter(
    (entry): entry is [string, ConfigFieldSchema] =>
      typeof entry[1] === "object" && entry[1] !== null && "type" in entry[1],
  );

  const myVotesThisTurn = votingState?.currentTurnVotes.filter((v) => v.voterId === myId).length ?? 0;

  return (
    <>
      {votingState?.phase === "between_turns" && (
        <BetweenTurnsOverlay
          nextTurn={currentTurn + 1}
          totalTurns={totalTurns}
          betweenDeadline={votingState.betweenTurnsDeadline}
        />
      )}

      <div className="imperial-border mx-auto flex w-full max-w-3xl flex-col rounded-3xl border border-[rgb(212_171_86_/_0.4)] bg-[rgb(11_26_46_/_0.84)] shadow-[0_24px_60px_rgb(2_7_15_/_0.58)] backdrop-blur" style={{ maxHeight: "calc(100dvh - 3.5rem)" }}>
        {/* Sticky header */}
        <div className="shrink-0 px-5 pt-5 sm:px-8 sm:pt-8">
          <h1 className="font-[var(--font-cinzel)] text-2xl font-bold tracking-wide text-[rgb(214_178_97_/_0.95)]">
            Votação
          </h1>

          <div className="mt-4">
            <TurnHeader
              currentTurn={currentTurn}
              totalTurns={totalTurns}
              pointsPerTurn={pointsPerTurn}
              pointsSpent={mySpent}
              deadline={votingState?.turnDeadline ?? 0}
            />
          </div>

          {/* Tabs */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                  activeTab === tab.id
                    ? "border-[rgb(214_178_97_/_0.6)] bg-[rgb(23_47_76_/_0.9)] text-[rgb(239_223_187_/_0.95)]"
                    : "border-[rgb(190_153_81_/_0.25)] bg-transparent text-[rgb(206_189_156_/_0.6)] hover:text-[rgb(206_189_156_/_0.9)]",
                ].join(" ")}
              >
                {tab.id === "match"
                  ? <Globe className="h-3 w-3 shrink-0" />
                  : <User className="h-3 w-3 shrink-0" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable fields */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-8">
          <div className="space-y-4">
            {configSchema && fields.map(([key, schema]) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(214_180_104_/_0.88)]">
                    {schema.label}
                  </span>
                  {"description" in schema && schema.description && (
                    <span className="text-xs text-[rgb(206_189_156_/_0.5)]">— {schema.description}</span>
                  )}
                </div>
                <VotingField
                  fieldKey={key}
                  schema={schema}
                  leaders={leaders}
                  pointsRemaining={pointsRemaining}
                  turnVoteTally={buildTurnTally(votingState?.currentTurnVotes ?? [], activeScope, key)}
                  myTurnVoteTally={myId ? buildMyTurnTally(votingState?.currentTurnVotes ?? [], myId, activeScope, key) : {}}
                  onVote={(value, weight) => handleVote(activeScope, key, value, weight)}
                  onRemoveVote={(value) => handleRemoveVote(activeScope, key, value)}
                />
              </div>
            ))}
            {!configSchema && (
              <p className="text-sm text-[rgb(206_189_156_/_0.5)]">Carregando opções…</p>
            )}
          </div>
        </div>

        {/* Sticky footer */}
        <div className="shrink-0 px-5 pb-5 sm:px-8 sm:pb-8">
          <TurnFooter
            pointsSpent={mySpent}
            pointsPerTurn={pointsPerTurn}
            votesThisTurn={myVotesThisTurn}
          />

          {/* Host end-turn button */}
          {session.isHost && votingState?.phase === "playing" && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleEndTurn}
                className="game-control-button h-auto rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                Finalizar turno {currentTurn}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
