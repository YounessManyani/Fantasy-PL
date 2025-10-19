import type { Player, Position } from '../types';
import { api } from './api';

// Cache par position pour éviter les conflits
const playersCacheByPosition: Record<Position, { players: Player[], timestamp: number }> = {} as any;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getPlayersByPosition = async (position: Position): Promise<Player[]> => {
  try {
    const now = Date.now();
    const cache = playersCacheByPosition[position];
    
    // Utiliser le cache si disponible et pas expiré
    if (cache && (now - cache.timestamp) < CACHE_DURATION) {
      return cache.players;
    }
    
    // Sinon, fetch depuis l'API
    const players = await api.getPlayers({ position, limit: 50 });
    const sortedPlayers = players.sort((a, b) => b.score - a.score);
    
    // Mettre en cache
    playersCacheByPosition[position] = {
      players: sortedPlayers,
      timestamp: now
    };
    
    return sortedPlayers;
  } catch (error) {
    console.error(`Failed to fetch ${position} players:`, error);
    // Retourner le cache même expiré en cas d'erreur
    return playersCacheByPosition[position]?.players || [];
  }
};

export const searchPlayers = async (
  position: Position,
  query: string,
  excludeIds: number[] = []
): Promise<Player[]> => {
  // Utiliser getPlayersByPosition qui a son propre cache par position
  const players = await getPlayersByPosition(position);
  
  return players
    .filter(p => !excludeIds.includes(p.id))
    .filter(p => 
      p.playerName.toLowerCase().includes(query.toLowerCase()) ||
      p.clubName.toLowerCase().includes(query.toLowerCase())
    );
};

export const getPlayerInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const getPlayerLastName = (name: string): string => {
  return name.split(' ').pop() || name;
};