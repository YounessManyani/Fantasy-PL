import type { Player, Position } from '../types';

// Mock data - Players
export const mockPlayers: Player[] = [
  { id: 1, playerName: 'Erling Haaland', clubName: 'Man City', position: 'FWD', price: 15.0, score: 9.8, pointsPerGame: 6.2 },
  { id: 2, playerName: 'Ollie Watkins', clubName: 'Aston Villa', position: 'FWD', price: 9.0, score: 7.4, pointsPerGame: 5.1 },
  { id: 3, playerName: 'Darwin Núñez', clubName: 'Liverpool', position: 'FWD', price: 7.5, score: 7.2, pointsPerGame: 4.6 },
  { id: 4, playerName: 'Alexander Isak', clubName: 'Newcastle', position: 'FWD', price: 8.5, score: 7.6, pointsPerGame: 4.9 },
  { id: 5, playerName: 'João Pedro', clubName: 'Brighton', position: 'FWD', price: 5.5, score: 6.8, pointsPerGame: 4.2 },
  
  { id: 6, playerName: 'Mohamed Salah', clubName: 'Liverpool', position: 'MID', price: 13.0, score: 9.5, pointsPerGame: 5.8 },
  { id: 7, playerName: 'Bukayo Saka', clubName: 'Arsenal', position: 'MID', price: 10.0, score: 8.2, pointsPerGame: 5.3 },
  { id: 8, playerName: 'Cole Palmer', clubName: 'Chelsea', position: 'MID', price: 11.0, score: 8.9, pointsPerGame: 5.5 },
  { id: 9, playerName: 'Declan Rice', clubName: 'Arsenal', position: 'MID', price: 6.5, score: 6.1, pointsPerGame: 4.2 },
  { id: 10, playerName: 'Phil Foden', clubName: 'Man City', position: 'MID', price: 9.5, score: 7.8, pointsPerGame: 5.2 },
  { id: 11, playerName: 'Bruno Fernandes', clubName: 'Man Utd', position: 'MID', price: 8.5, score: 7.3, pointsPerGame: 4.8 },
  { id: 12, playerName: 'Luis Díaz', clubName: 'Liverpool', position: 'MID', price: 8.0, score: 7.4, pointsPerGame: 4.9 },
  { id: 13, playerName: 'Kudus Mohammed', clubName: 'West Ham', position: 'MID', price: 7.0, score: 7.0, pointsPerGame: 4.5 },
  
  { id: 14, playerName: 'Trent Alexander-Arnold', clubName: 'Liverpool', position: 'DEF', price: 7.5, score: 7.8, pointsPerGame: 5.0 },
  { id: 15, playerName: 'William Saliba', clubName: 'Arsenal', position: 'DEF', price: 6.0, score: 6.5, pointsPerGame: 4.7 },
  { id: 16, playerName: 'Gabriel Magalhães', clubName: 'Arsenal', position: 'DEF', price: 6.0, score: 6.8, pointsPerGame: 4.8 },
  { id: 17, playerName: 'Kieran Trippier', clubName: 'Newcastle', position: 'DEF', price: 6.5, score: 5.9, pointsPerGame: 4.3 },
  { id: 18, playerName: 'Virgil van Dijk', clubName: 'Liverpool', position: 'DEF', price: 6.5, score: 7.5, pointsPerGame: 4.8 },
  { id: 19, playerName: 'Joško Gvardiol', clubName: 'Man City', position: 'DEF', price: 6.0, score: 7.2, pointsPerGame: 4.5 },
  { id: 20, playerName: 'Cristian Romero', clubName: 'Spurs', position: 'DEF', price: 5.5, score: 7.0, pointsPerGame: 4.4 },
  { id: 21, playerName: 'Tino Livramento', clubName: 'Newcastle', position: 'DEF', price: 5.0, score: 6.8, pointsPerGame: 4.2 },
  
  { id: 22, playerName: 'David Raya', clubName: 'Arsenal', position: 'GK', price: 5.5, score: 6.2, pointsPerGame: 4.6 },
  { id: 23, playerName: 'Alisson', clubName: 'Liverpool', position: 'GK', price: 5.5, score: 7.2, pointsPerGame: 4.5 },
  { id: 24, playerName: 'Aaron Ramsdale', clubName: 'Southampton', position: 'GK', price: 4.5, score: 6.5, pointsPerGame: 4.0 },
  { id: 25, playerName: 'Ederson', clubName: 'Man City', position: 'GK', price: 5.5, score: 6.8, pointsPerGame: 4.4 },
];

export const getPlayersByPosition = (position: Position): Player[] => {
  return mockPlayers
    .filter(p => p.position === position)
    .sort((a, b) => b.score - a.score);
};

export const searchPlayers = (
  position: Position,
  query: string,
  excludeIds: number[] = []
): Player[] => {
  return mockPlayers
    .filter(p => p.position === position)
    .filter(p => !excludeIds.includes(p.id))
    .filter(p => 
      p.playerName.toLowerCase().includes(query.toLowerCase()) ||
      p.clubName.toLowerCase().includes(query.toLowerCase())
    )
    .sort((a, b) => b.score - a.score);
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