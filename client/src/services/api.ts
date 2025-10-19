import type { Player, Position } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  public status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `API Error: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// Fonction pour générer un ID unique basé sur le nom et le club
function generatePlayerId(name: string, club: string): number {
  const str = `${name}-${club}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
// Add type guard before the getPlayers function
const VALID_POSITIONS = ["GK", "DEF", "MID", "FWD"] as const;
export function isValidPosition(value: unknown): value is Position {
  return (
    typeof value === "string" && VALID_POSITIONS.includes(value as Position)
  );
}

// Define the BackendPlayer interface for raw API response data
interface BackendPlayer {
  name: string;
  club: string;
  position: unknown; // Keep as unknown since we validate it with isValidPosition
  price?: number;
  score?: number;
  pointsPerGame?: number;
}

// Update fetchApi call with proper typing
export async function getPlayers(filters?: {
  position?: Position;
  club?: string;
  limit?: number;
}): Promise<Player[]> {
  const params = new URLSearchParams();

  if (filters?.position) params.append("position", filters.position);
  if (filters?.club) params.append("club", filters.club);
  if (filters?.limit) params.append("limit", filters.limit.toString());

  const queryString = params.toString();
  const endpoint = `/api/v1/players${queryString ? `?${queryString}` : ""}`;

  const response = await fetchApi<{
    success: boolean;
    data: { players: BackendPlayer[] };
  }>(endpoint);

  // Filter out players with invalid positions and transform the data
  return response.data.players
    .filter((p): p is BackendPlayer & { position: Position } =>
      isValidPosition(p.position)
    )
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

export const api = {
  getPlayers,
};
