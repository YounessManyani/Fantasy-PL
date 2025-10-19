import type { Player } from '../types';
import type { EnrichedPlayer, ParsedTeamResult, TransferRecommendation, Formation } from '../types/myteam.types';

// Mock fixtures data
const mockFixtures: Record<string, { opponent: string; home: boolean; fdr: number }> = {
  'Arsenal': { opponent: 'Southampton', home: true, fdr: 2 },
  'Liverpool': { opponent: 'Chelsea', home: false, fdr: 4 },
  'Man City': { opponent: 'Newcastle', home: true, fdr: 2 },
  'Chelsea': { opponent: 'Liverpool', home: true, fdr: 4 },
  'Aston Villa': { opponent: 'Wolves', home: true, fdr: 3 },
  'Newcastle': { opponent: 'Man City', home: false, fdr: 5 },
  'Brighton': { opponent: 'Everton', home: true, fdr: 2 },
  'Man Utd': { opponent: 'Brighton', home: false, fdr: 3 },
  'West Ham': { opponent: 'Fulham', home: true, fdr: 3 },
  'Spurs': { opponent: 'West Ham', home: false, fdr: 3 },
  'Southampton': { opponent: 'Arsenal', home: false, fdr: 5 },
};

export const enrichPlayer = (player: Player): EnrichedPlayer => {
  const fixture = mockFixtures[player.clubName] || null;
  let adjustedScore = player.score;

  if (fixture) {
    const factor = fixture.fdr <= 2 ? 1.1 : fixture.fdr === 3 ? 1.0 : 0.9;
    adjustedScore = player.score * factor;
  }

  return {
    ...player,
    nextFixture: fixture,
    adjustedScore: Math.round(adjustedScore * 100) / 100,
  };
};

export const parseTeam = async (
  players: Player[],
  formation: Formation,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _useAI: boolean = false
): Promise<ParsedTeamResult> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Enrich players with fixtures
  const enrichedPlayers: EnrichedPlayer[] = players.map(enrichPlayer);

  const avgScore = enrichedPlayers.reduce((sum, p) => sum + p.score, 0) / enrichedPlayers.length;
  const totalValue = players.reduce((sum, p) => sum + p.price, 0);

  // Find worst player for transfer suggestion
  const worstPlayer = [...enrichedPlayers].sort((a, b) => a.adjustedScore - b.adjustedScore)[0];

  // Mock better replacement
  const betterReplacement: EnrichedPlayer = {
    id: 99,
    playerName: 'Tino Livramento',
    clubName: 'Newcastle',
    position: worstPlayer.position,
    price: worstPlayer.price - 0.5,
    score: worstPlayer.score + 1.5,
    pointsPerGame: worstPlayer.pointsPerGame + 1.0,
    nextFixture: { opponent: 'Wolves', home: true, fdr: 2 },
    adjustedScore: (worstPlayer.score + 1.5) * 1.1,
  };

  const transferGain = betterReplacement.adjustedScore - worstPlayer.adjustedScore;

  const transfers: TransferRecommendation[] = [
    {
      out: worstPlayer,
      in: betterReplacement,
      gain: Math.round(transferGain * 100) / 100,
      explanation: `${worstPlayer.playerName} faces difficult fixtures (FDR ${worstPlayer.nextFixture?.fdr}). ${betterReplacement.playerName} has easier upcoming games and better form.`
    }
  ];

  return {
    players: enrichedPlayers,
    totalValue: Math.round(totalValue * 10) / 10,
    formation,
    avgScore: Math.round(avgScore * 100) / 100,
    transfers,
    totalGain: Math.round(transferGain * 100) / 100,
  };
};

export const getFDRColor = (fdr: number): string => {
  if (fdr <= 2) return 'bg-emerald-100 text-emerald-700';
  if (fdr === 3) return 'bg-yellow-100 text-yellow-700';
  if (fdr === 4) return 'bg-orange-100 text-orange-700';
  return 'bg-red-100 text-red-700';
};

export const getPositionColor = (position: string): string => {
  switch (position) {
    case 'GK': return 'bg-yellow-500';
    case 'DEF': return 'bg-blue-500';
    case 'MID': return 'bg-emerald-500';
    case 'FWD': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};