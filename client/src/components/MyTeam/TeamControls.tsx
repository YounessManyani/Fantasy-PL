import { Search, AlertCircle } from 'lucide-react';

interface TeamControlsProps {
  useAI: boolean;
  onToggleAI: (value: boolean) => void;
  gameweek: number;
  onGameweekChange: (gw: number) => void;
  onParseTeam: () => void;
  isLoading: boolean;
  disabled: boolean;
  error: string | null;
}

export const TeamControls = ({
  useAI,
  onToggleAI,
  gameweek,
  onGameweekChange,
  onParseTeam,
  isLoading,
  disabled,
  error,
}: TeamControlsProps) => {
  return (
    <>
      {/* AI Toggle and Gameweek Selector */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleAI(!useAI)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              useAI ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                useAI ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm font-medium text-gray-700">Use AI Name Resolution</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Gameweek:</label>
          <select
            value={gameweek}
            onChange={(e) => onGameweekChange(Number(e.target.value))}
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {Array.from({ length: 38 }, (_, i) => i + 1).map((gw) => (
              <option key={gw} value={gw}>{gw}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Parse Button */}
      <button 
        onClick={onParseTeam}
        disabled={isLoading || disabled}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-colors flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Parsing Team...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Parse Team & Get Transfer Suggestions
          </>
        )}
      </button>
    </>
  );
};