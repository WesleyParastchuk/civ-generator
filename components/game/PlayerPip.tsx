"use client";

function playerHue(index: number, total: number): number {
  return Math.round((index * 360) / Math.max(total, 1)) % 360;
}

type Props = {
  index: number;
  total: number;
  nickname: string;
  sealed?: boolean;
  size?: "md" | "lg";
};

export function PlayerPip({ index, total, nickname, sealed = false, size = "md" }: Props) {
  const hue = playerHue(index, total);
  const accent = `hsl(${hue}, 15%, 48%)`;
  const accentDim = `hsl(${hue}, 12%, 34%)`;
  return (
    <div
      className={size === "lg" ? "player-pip player-pip--lg" : "player-pip"}
      style={{
        border: `1px solid ${sealed ? "rgba(79,141,107,0.7)" : accentDim}`,
        background: `linear-gradient(to top, rgb(11,28,52), rgb(11,28,52) 40%, ${accent})`,
        boxShadow: sealed
          ? "0 0 5px rgba(79,141,107,0.7), 0 0 10px rgba(79,141,107,0.4), 0 0 20px rgba(79,141,107,0.2)"
          : undefined,
      }}
    >
      <span className="player-pip__letter" style={{ color: `hsl(${hue}, 85%, 88%)` }}>
        {nickname.charAt(0).toUpperCase()}
      </span>
      {sealed && <div className="player-pip__badge" />}
    </div>
  );
}
