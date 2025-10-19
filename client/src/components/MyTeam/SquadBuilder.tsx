interface SquadBuilderProps {
  teamSize: number;
  clubLimitValid: boolean;
  totalSpent: number;
  remaining: number;
}

export const SquadBuilder = ({ 
  teamSize, 
  clubLimitValid, 
  totalSpent, 
  remaining 
}: SquadBuilderProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">Squad Builder</h2>
      <div className="grid grid-cols-4 gap-4">
        <div className={`${teamSize === 11 ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'} border rounded-lg p-4`}>
          <p className={`text-sm mb-1 ${teamSize === 11 ? 'text-emerald-700' : 'text-gray-600'}`}>Team Size</p>
          <p className={`text-2xl font-bold ${teamSize === 11 ? 'text-emerald-700' : 'text-gray-900'}`}>
            {teamSize}/11
          </p>
        </div>
        <div className={`${clubLimitValid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <p className={`text-sm mb-1 ${clubLimitValid ? 'text-emerald-700' : 'text-red-700'}`}>Club Limit</p>
          <p className={`text-2xl font-bold ${clubLimitValid ? 'text-emerald-700' : 'text-red-700'}`}>
            {clubLimitValid ? '✓' : '✗'}
          </p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-sm text-emerald-700 mb-1">Budget</p>
          <p className="text-2xl font-bold text-emerald-700">£{totalSpent.toFixed(1)}m</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-1">Remaining</p>
          <p className="text-2xl font-bold text-gray-900">£{remaining.toFixed(1)}m</p>
        </div>
      </div>
    </div>
  );
};