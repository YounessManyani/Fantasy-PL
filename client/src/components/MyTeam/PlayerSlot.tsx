import type { Player, Position } from '../../types';
import { getPlayerInitials, getPlayerLastName } from '../../services/playerService';
import { getPositionColor } from '../../services/teamService.ts';

interface PlayerSlotProps {
  position: Position;
  player: Player | null;
  onClick: () => void;
  onRemove: () => void;
}

export const PlayerSlot = ({ position, player, onClick, onRemove }: PlayerSlotProps) => {
  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button 
          onClick={onClick}
          className="w-16 h-16 rounded-full border-2 border-dashed border-white/60 bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center group backdrop-blur-sm"
        >
          <span className="text-white text-3xl font-light group-hover:scale-110 transition-transform">+</span>
        </button>
        <span className="text-xs font-semibold text-white bg-gray-900/50 px-3 py-1 rounded-full backdrop-blur-sm">
          Add {position}
        </span>
      </div>
    );
  }

  const lastName = getPlayerLastName(player.playerName);

  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className="relative">
        <button 
          onClick={onClick}
          className={`w-16 h-16 rounded-full ${getPositionColor(position)} hover:ring-4 hover:ring-white/50 transition-all flex items-center justify-center shadow-lg`}
        >
          <span className="text-white text-sm font-bold">{getPlayerInitials(player.playerName)}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          ×
        </button>
      </div>
      <span className="text-xs font-semibold text-white bg-gray-900/70 px-3 py-1 rounded-full backdrop-blur-sm max-w-[100px] truncate">
        {lastName}
      </span>
    </div>
  );
};