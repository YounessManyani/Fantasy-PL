import { Users } from 'lucide-react';
import type { ParsedTeamResult } from '../../types/myteam.types';
import { getFDRColor, getPositionColor } from '../../services/teamService.ts';
import { TransferRecommendations } from './TransferRecommendations';

interface ParsedTeamResultsProps {
  result: ParsedTeamResult;
  gameweek: number;
}

export const ParsedTeamResults = ({ result, gameweek }: ParsedTeamResultsProps) => {
  return (
    <div className="mt-8 space-y-6">
      {/* Success Message */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-bold text-emerald-900 mb-1">Success</h3>
        <p className="text-sm text-emerald-700">
          Team parsed successfully. Found {result.transfers?.length || 0} transfer suggestion{result.transfers && result.transfers.length > 1 ? 's' : ''}.
        </p>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-700 mb-1">Team Value</p>
          <p className="text-2xl font-bold text-emerald-700">£{result.totalValue.toFixed(1)}m</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700 mb-1">Formation</p>
          <p className="text-2xl font-bold text-blue-700">{result.formation}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-700 mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-purple-700">{result.avgScore.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700 mb-1">Players</p>
          <p className="text-2xl font-bold text-orange-700">{result.players.length}</p>
        </div>
      </div>

      {/* Current Squad */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">
              Current Squad (GW{gameweek} Fixtures)
            </h2>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {result.players
            .sort((a, b) => {
              const order = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
              return order[a.position] - order[b.position];
            })
            .map((player) => (
              <div key={player.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-sm ${getPositionColor(player.position)}`}>
                    {player.position}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{player.playerName}</h3>
                    <p className="text-sm text-gray-600">{player.clubName} • £{player.price.toFixed(1)}m</p>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Base Score</p>
                      <p className="text-lg font-bold text-gray-900">{player.score.toFixed(1)}</p>
                    </div>

                    {player.nextFixture && (
                      <>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Next: {player.nextFixture.opponent}</p>
                          <p className="text-xs text-gray-600">{player.nextFixture.home ? 'Home' : 'Away'}</p>
                        </div>

                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getFDRColor(player.nextFixture.fdr)}`}>
                            FDR {player.nextFixture.fdr}
                          </span>
                        </div>
                      </>
                    )}

                    <div className="text-right">
                      <p className="text-xs text-gray-500">Adjusted</p>
                      <p className="text-lg font-bold text-purple-600">{player.adjustedScore.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* AI Transfer Recommendations */}
      {result.transfers && result.totalGain && (
        <TransferRecommendations 
          transfers={result.transfers} 
          totalGain={result.totalGain} 
        />
      )}
    </div>
  );
};