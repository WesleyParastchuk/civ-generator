import type { VoteCast, ServerPlayer, GameConfigSchema } from "./lobbyTypes";
import type { LeaderEntry } from "@/components/game/VotingField";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resolveVal(
  value: string | number | boolean,
  field: string,
  schema: GameConfigSchema | null,
  leaders: LeaderEntry[],
  isPlayer: boolean,
): string {
  const fieldSchema = isPlayer ? schema?.playerConfig[field] : schema?.matchConfig[field];
  if (!fieldSchema) return String(value);
  if (fieldSchema.type === "select") {
    if (fieldSchema.options) {
      const opt = fieldSchema.options.find((o) => String(o.value) === String(value));
      if (opt) return opt.label;
    }
    if (fieldSchema.leadersSource) {
      const leader = leaders.find((l) => l.id === Number(value));
      if (leader) return leader.leader;
    }
  }
  if (fieldSchema.type === "toggle") return value ? "Ativo" : "Desativado";
  if (fieldSchema.type === "range") {
    return `${value}${fieldSchema.unit ? ` ${fieldSchema.unit}` : ""}`;
  }
  return String(value);
}

function schemaLabel(field: string, schema: GameConfigSchema | null, isPlayer: boolean): string {
  const s = isPlayer ? schema?.playerConfig[field] : schema?.matchConfig[field];
  return s?.label ?? field;
}

function playerVoteRumor(
  field: string,
  value: string | number | boolean,
  schema: GameConfigSchema | null,
  leaders: LeaderEntry[],
  forMe: boolean,
  playerName?: string,
): string {
  const val = resolveVal(value, field, schema, leaders, true);
  const label = schemaLabel(field, schema, true).toLowerCase();
  const suffix = forMe ? "sua" : `de ${playerName}`;
  const suffixNom = forMe ? "sua líder" : `líder de ${playerName}`;

  if (field === "civilization") return `${val} foi votada para ser ${suffixNom}.`;
  if (field === "difficulty") return `"${val}" foi votado como dificuldade de ${forMe ? "você" : playerName}.`;
  return `"${val}" foi votado para ${label} ${suffix === "sua" ? "da sua aba" : `de ${playerName}`}.`;
}

export function generateRumors(params: {
  votes: VoteCast[];
  spendByVoter: Record<string, number>;
  myId: string;
  players: ServerPlayer[];
  configSchema: GameConfigSchema | null;
  leaders: LeaderEntry[];
  pointsPerTurn: number;
}): string[] {
  const { votes, spendByVoter, myId, players, configSchema, leaders, pointsPerTurn } = params;
  const highPool = new Set<string>(); // types 2-6: shown first
  const lowPool = new Set<string>();  // type 1: filler only

  const otherPlayers = players.filter((p) => p.id !== myId);
  const otherVotes = votes.filter((v) => v.voterId !== myId);

  // 1. LOW PRIORITY — global fields with zero votes from anyone
  for (const [field, schema] of Object.entries(configSchema?.matchConfig ?? {})) {
    const total = votes
      .filter((v) => v.scope === "match" && v.field === field)
      .reduce((s, v) => s + v.weight, 0);
    if (total === 0) {
      lowPool.add(`Ninguém votou em "${schema.label}" neste turno.`);
    }
  }

  // 2. Global field with ≥5 points from others
  for (const [field, schema] of Object.entries(configSchema?.matchConfig ?? {})) {
    const total = otherVotes
      .filter((v) => v.scope === "match" && v.field === field)
      .reduce((s, v) => s + v.weight, 0);
    if (total >= 5) {
      highPool.add(`Muitos pontos foram investidos em "${schema.label}" neste turno.`);
    }
  }

  // 3. Someone (not me) saving ≥8 points
  const someoneSaving = otherPlayers.some((p) => pointsPerTurn - (spendByVoter[p.id] ?? 0) >= 8);
  if (someoneSaving) highPool.add("Alguém está guardando muitos pontos para o próximo turno.");

  // 4. Someone (not me) spent all points
  const someoneSpentAll = otherPlayers.some((p) => (spendByVoter[p.id] ?? 0) >= pointsPerTurn);
  if (someoneSpentAll) highPool.add("Alguém gastou todos os seus pontos neste turno.");

  // 5. Others voted on MY personal scope
  const seen5 = new Set<string>();
  for (const vote of otherVotes) {
    if (typeof vote.scope !== "object" || vote.scope.playerId !== myId) continue;
    const key = `${vote.field}:${String(vote.value)}`;
    if (seen5.has(key)) continue;
    seen5.add(key);
    highPool.add(playerVoteRumor(vote.field, vote.value, configSchema, leaders, true));
  }

  // 6. Others (not me) voted on OTHER players' personal scopes
  for (const player of otherPlayers) {
    const seen6 = new Set<string>();
    for (const vote of otherVotes) {
      if (typeof vote.scope !== "object" || vote.scope.playerId !== player.id) continue;
      const key = `${vote.field}:${String(vote.value)}`;
      if (seen6.has(key)) continue;
      seen6.add(key);
      highPool.add(playerVoteRumor(vote.field, vote.value, configSchema, leaders, false, player.nickname));
    }
  }

  // Fill up to 3: high-priority first, low-priority as filler
  const high = shuffle([...highPool]).slice(0, 3);
  const low = shuffle([...lowPool]).slice(0, Math.max(0, 3 - high.length));
  return [...high, ...low];
}
