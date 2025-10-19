import type { Player, Position } from '../../types';
import type { FormationConfig, PlayerSlot as PlayerSlotType } from '../../types/myteam.types';
import { PlayerSlot } from './PlayerSlot';

interface FootballFieldProps {
  config: FormationConfig;
  getPlayerInSlot: (position: Position, index: number) => Player | null;
  onPlayerClick: (slot: PlayerSlotType) => void;
  onPlayerRemove: (position: Position, index: number) => void;
}

export const FootballField = ({ 
  config, 
  getPlayerInSlot, 
  onPlayerClick, 
  onPlayerRemove 
}: FootballFieldProps) => {
  return (
    <div className="bg-gradient-to-b from-emerald-600 to-emerald-700 rounded-2xl p-8 mb-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/2 w-px h-full bg-white transform -translate-x-1/2" />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative space-y-16">
        {/* Forwards */}
        <div className="flex justify-center items-center gap-12">
          {Array.from({ length: config.forwards }).map((_, i) => (
            <PlayerSlot 
              key={`fwd-${i}`} 
              position="FWD"
              player={getPlayerInSlot('FWD', i)}
              onClick={() => onPlayerClick({ position: 'FWD', index: i })}
              onRemove={() => onPlayerRemove('FWD', i)}
            />
          ))}
        </div>

        {/* Midfielders */}
        <div className="flex justify-center items-center gap-8">
          {Array.from({ length: config.midfielders }).map((_, i) => (
            <PlayerSlot 
              key={`mid-${i}`} 
              position="MID"
              player={getPlayerInSlot('MID', i)}
              onClick={() => onPlayerClick({ position: 'MID', index: i })}
              onRemove={() => onPlayerRemove('MID', i)}
            />
          ))}
        </div>

        {/* Defenders */}
        <div className="flex justify-center items-center gap-8">
          {Array.from({ length: config.defenders }).map((_, i) => (
            <PlayerSlot 
              key={`def-${i}`} 
              position="DEF"
              player={getPlayerInSlot('DEF', i)}
              onClick={() => onPlayerClick({ position: 'DEF', index: i })}
              onRemove={() => onPlayerRemove('DEF', i)}
            />
          ))}
        </div>

        {/* Goalkeeper */}
        <div className="flex justify-center">
          <PlayerSlot 
            position="GK"
            player={getPlayerInSlot('GK', 0)}
            onClick={() => onPlayerClick({ position: 'GK', index: 0 })}
            onRemove={() => onPlayerRemove('GK', 0)}
          />
        </div>
      </div>
    </div>
  );
};