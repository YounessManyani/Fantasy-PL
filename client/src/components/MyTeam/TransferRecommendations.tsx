import type { TransferRecommendation } from '../../types/myteam.types';
import { getPositionColor } from '../../services/teamService.ts';

interface TransferRecommendationsProps {
  transfers: TransferRecommendation[];
  totalGain: number;
}

export const TransferRecommendations = ({ transfers, totalGain }: TransferRecommendationsProps) => {
  if (!transfers || transfers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Transfer Recommendations</h2>
              <p className="text-sm text-gray-600">Found {transfers.length} suggested transfer{transfers.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <span className="text-2xl font-bold text-purple-600">+{totalGain.toFixed(2)} pts</span>
          </div>
        </div>
      </div>

      {/* Transfer List */}
      <div className="p-6 space-y-6">
        {transfers.map((transfer, index) => (
          <div key={index} className="space-y-4">
            {/* Transfer Header */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-purple-600">{index + 1}</span>
              </div>
              <h3 className="font-semibold text-gray-700">Transfer {index + 1}</h3>
            </div>

            {/* Transfer Cards */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-4 items-center">
              {/* OUT Card */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-red-700 mb-2">OUT</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${getPositionColor(transfer.out.position)}`}>
                    {transfer.out.position}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{transfer.out.playerName}</p>
                    <p className="text-sm text-gray-600">
                      {transfer.out.clubName} • £{transfer.out.price.toFixed(1)}m
                    </p>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>

              {/* IN Card */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 relative">
                <p className="text-xs font-semibold text-emerald-700 mb-2">IN</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs ${getPositionColor(transfer.in.position)}`}>
                    {transfer.in.position}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{transfer.in.playerName}</p>
                    <p className="text-sm text-gray-600">
                      {transfer.in.clubName} • £{transfer.in.price.toFixed(1)}m
                    </p>
                  </div>
                </div>
                {/* Gain Badge */}
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  +{transfer.gain.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">{transfer.explanation}</p>
            </div>

            {/* Divider (except for last item) */}
            {index < transfers.length - 1 && (
              <div className="border-t border-gray-200 mt-6" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Total Expected Gain</p>
            <p className="text-xs text-gray-500">Based on fixture difficulty and recent form</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-purple-600">+{totalGain.toFixed(2)}</p>
            <p className="text-sm text-gray-600">points</p>
          </div>
        </div>
      </div>
    </div>
  );
};