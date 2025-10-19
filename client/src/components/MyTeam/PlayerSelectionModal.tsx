import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { Player, Position } from '../../types';

interface PlayerSelectionModalProps {
  position: Position;
  searchQuery: string;
  excludeIds: number[];
  onSearchChange: (query: string) => void;
  onSelectPlayer: (player: Player) => void;
  onClose: () => void;
}

export const PlayerSelectionModal = ({
  position,
  searchQuery,
  excludeIds,
  onSearchChange,
  onSelectPlayer,
  onClose,
}: PlayerSelectionModalProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []); // Se déclenche au montage du composant

  const loadPlayers = async () => {
    setIsLoading(true);
    setError(null);
    setPlayers([]);
    
    try {
      const { searchPlayers } = await import('../../services/playerService');
      // Ne pas exclure ici, on le fera côté client
      const data = await searchPlayers(position, '', []);
      setPlayers(data);
    } catch (err) {
      setError('Failed to load players');
      console.error('Error loading players:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer côté client pour exclure les joueurs déjà sélectionnés
  const availablePlayers = players.filter(p => !excludeIds.includes(p.id));

  // Puis filtrer par recherche
  const filteredPlayers = availablePlayers.filter(p => 
    p.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.clubName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Select {position}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${position}...`}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              {error}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No players found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="w-full p-3 rounded-lg hover:bg-purple-50 transition-colors text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 group-hover:text-purple-700">
                        {player.playerName}
                      </p>
                      <p className="text-sm text-gray-600">{player.clubName}</p>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      £{player.price.toFixed(1)}m
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};