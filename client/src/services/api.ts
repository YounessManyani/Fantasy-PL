// src/services/api.ts (or your path)
import type { Player, Position } from "../types";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new ApiError(res.status, await res.text());
  return res.json();
}

/* ---------- existing players endpoint ---------- */

function generatePlayerId(name: string, club: string): number {
  const str = `${name}-${club}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const VALID_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export type PositionLiteral = (typeof VALID_POSITIONS)[number];
export function isValidPosition(value: unknown): value is Position {
  return typeof value === "string" && VALID_POSITIONS.includes(value as any);
}

type BackendPlayer = {
  name: string;
  club: string;
  position: unknown;
  price?: number;
  score?: number;
  pointsPerGame?: number;
};

export async function getPlayers(filters?: {
  position?: Position;
  club?: string;
  limit?: number;
}): Promise<Player[]> {
  const params = new URLSearchParams();
  if (filters?.position) params.append("position", filters.position);
  if (filters?.club) params.append("club", filters.club);
  if (filters?.limit) params.append("limit", String(filters.limit));

  const endpoint = `/api/v1/players${params.toString() ? `?${params}` : ""}`;
  const response = await fetchApi<{
    success: boolean;
    data: { players: BackendPlayer[] };
  }>(endpoint);

  return response.data.players
    .filter((p): p is BackendPlayer & { position: Position } => isValidPosition(p.position))
    .map((p) => ({
      id: generatePlayerId(p.name, p.club),
      playerName: p.name,
      clubName: p.club,
      position: p.position,
      price: p.price || 0,
      score: p.score || 0,
      pointsPerGame: p.pointsPerGame || 0,
    }));
}

/* ---------- NEW: team parse endpoint ---------- */

export type Difficulty = "easy" | "medium" | "hard";
export type ParseTeamApiRequest = {
  teamText: string;
  strictMode?: boolean;
  includeSuggestions?: boolean;
  useLLM?: boolean;
  gameweek?: number;
};

export type BackendFixture = {
  opponent: string;
  home: boolean;
  fdr: number;
  difficulty?: Difficulty;
};

export type BackendParsedPlayer = {
  id?: number;
  playerName: string;
  clubName: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  price: number;
  score: number;
  pointsPerGame: number;
  nextFixture?: BackendFixture | null;
  adjustedScore?: number;
};

export type BackendParseTeamResponse = {
  success: boolean;
  data: {
    players: BackendParsedPlayer[];
    stats?: {
      totalValue?: number;
      averageScore?: number;
      formation?: string;
      byPosition?: Record<string, number>;
      byClub?: Record<string, number>;
    };
    unknown?: string[];
    duplicates?: string[];
    suggestions?: Record<string, unknown>;
  };
};

export async function parseTeamApi(payload: ParseTeamApiRequest) {
  return fetchApi<BackendParseTeamResponse>("/api/v1/teams/parse", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ---------- expose both named + object + default ---------- */

export const api = { getPlayers, parseTeamApi };
export default api;
