// src/services/teamService.ts
import type { Player } from "../types";
import type { Formation, ParsedTeamResult, EnrichedPlayer } from "../types/myteam.types";
import { parseTeamApi, type BackendParsedPlayer } from "./api";

/** === helpers de couleurs utilisés par tes composants === */
export const getFDRColor = (fdr: number): string => {
  if (fdr <= 2) return "bg-emerald-100 text-emerald-700";
  if (fdr === 3) return "bg-yellow-100 text-yellow-700";
  if (fdr === 4) return "bg-orange-100 text-orange-700";
  return "bg-red-100 text-red-700";
};

export const getPositionColor = (position: string): string => {
  switch (position) {
    case "GK": return "bg-yellow-500";
    case "DEF": return "bg-blue-500";
    case "MID": return "bg-emerald-500";
    case "FWD": return "bg-red-500";
    default: return "bg-gray-500";
  }
};

/** === util === */
function hashId(name: string, club: string) {
  const s = `${name}-${club}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function mapPlayer(p: BackendParsedPlayer): EnrichedPlayer {
  return {
    id: typeof p.id === "number" ? p.id : hashId(p.playerName, p.clubName),
    playerName: p.playerName,
    clubName: p.clubName,
    position: p.position,
    price: p.price ?? 0,
    score: p.score ?? 0,
    pointsPerGame: p.pointsPerGame ?? 0,
    nextFixture: p.nextFixture ?? null,
    adjustedScore: p.adjustedScore ?? p.score ?? 0,
  };
}

/**
 * Appelle le backend pour parser l'équipe sélectionnée.
 * Respecte ta signature existante ET ajoute gameweek (optionnel).
 */
export async function parseTeam(
  selectedPlayers: Player[],
  selectedFormation: Formation,
  useAI: boolean,
  gameweek?: number
): Promise<ParsedTeamResult> {
  const teamText = selectedPlayers.map(p => p.playerName).join(", ");

  const res = await parseTeamApi({
    teamText,
    strictMode: false,
    includeSuggestions: true,
    useLLM: useAI,
    gameweek,
  });

  const players = res.data.players.map(mapPlayer);

  const totalValue =
    res.data.stats?.totalValue ??
    players.reduce((sum, p) => sum + (p.price || 0), 0);

  const avgScore =
    res.data.stats?.averageScore ??
    (players.length
      ? players.reduce((s, p) => s + (p.score || 0), 0) / players.length
      : 0);

  const formation =
    (res.data.stats?.formation as Formation | undefined) ?? selectedFormation;

  return {
    players,
    totalValue: Math.round(totalValue * 10) / 10,
    avgScore: Math.round(avgScore * 100) / 100,
    formation,
    // Tu pourras brancher les transferts plus tard si tu as un endpoint dédié:
    // transfers, totalGain
  };
}
