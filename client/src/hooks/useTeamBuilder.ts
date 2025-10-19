import { useState, useCallback } from 'react';
import type { Player, Position } from '../types';
import type { Formation, ParsedTeamResult, PlayerSlot } from '../types/myteam.types';

export const useTeamBuilder = (initialFormation: Formation = '4-4-2') => {
  const [selectedFormation, setSelectedFormation] = useState<Formation>(initialFormation);
  const [useAI, setUseAI] = useState(false);
  const [gameweek, setGameweek] = useState(7);
  const [teamSlots, setTeamSlots] = useState<Map<string, Player>>(new Map());
  const [parsedResult, setParsedResult] = useState<ParsedTeamResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSlotKey = useCallback((position: Position, index: number): string => {
    return `${position}-${index}`;
  }, []);

  const getPlayerInSlot = useCallback((position: Position, slotIndex: number): Player | null => {
    return teamSlots.get(getSlotKey(position, slotIndex)) || null;
  }, [teamSlots, getSlotKey]);

  const addPlayer = useCallback((slot: PlayerSlot, player: Player) => {
    const newSlots = new Map(teamSlots);
    newSlots.set(getSlotKey(slot.position, slot.index), player);
    setTeamSlots(newSlots);
  }, [teamSlots, getSlotKey]);

  const removePlayer = useCallback((position: Position, slotIndex: number) => {
    const newSlots = new Map(teamSlots);
    newSlots.delete(getSlotKey(position, slotIndex));
    setTeamSlots(newSlots);
    setParsedResult(null);
  }, [teamSlots, getSlotKey]);

  const selectedPlayers = Array.from(teamSlots.values());
  const totalSpent = selectedPlayers.reduce((sum, p) => sum + p.price, 0);
  const remaining = 100.0 - totalSpent;

  const clubCounts = new Map<string, number>();
  selectedPlayers.forEach(player => {
    clubCounts.set(player.clubName, (clubCounts.get(player.clubName) || 0) + 1);
  });
  const clubLimitValid = Array.from(clubCounts.values()).every(count => count <= 3);

  const clearTeam = useCallback(() => {
    setTeamSlots(new Map());
    setParsedResult(null);
    setError(null);
  }, []);

  return {
    // State
    selectedFormation,
    useAI,
    gameweek,
    teamSlots,
    parsedResult,
    isLoading,
    error,
    
    // Computed
    selectedPlayers,
    totalSpent,
    remaining,
    clubLimitValid,
    
    // Actions
    setSelectedFormation,
    setUseAI,
    setGameweek,
    setParsedResult,
    setIsLoading,
    setError,
    getPlayerInSlot,
    addPlayer,
    removePlayer,
    clearTeam,
  };
};