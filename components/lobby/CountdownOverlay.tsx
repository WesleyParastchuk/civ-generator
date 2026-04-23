import { CountdownShell, CountdownNumber } from "@/components/game/CountdownDisplay";

type Props = { seconds: number };

export function CountdownOverlay({ seconds }: Props) {
  return (
    <CountdownShell subtitle="Preparando para a votação...">
      <CountdownNumber key={seconds} value={seconds} animated={seconds <= 3} />
    </CountdownShell>
  );
}
