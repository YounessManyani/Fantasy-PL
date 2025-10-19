// src/pages/myteam/index.tsx
import { useState } from "react";
import { Users } from "lucide-react";
import { useTeamBuilder } from "../../hooks/useTeamBuilder";
import { FORMATIONS } from "../../types/myteam.types";
import { parseTeam } from "../../services/teamService.ts";
import type { PlayerSlot } from "../../types/myteam.types";
import type { Player } from "../../types";

// Components
import { FormationSelector } from "./FormationSelector";
import { SquadBuilder } from "./SquadBuilder";
import { FootballField } from "./FootballField";
import { TeamControls } from "./TeamControls";
import { PlayerSelectionModal } from "./PlayerSelectionModal";
import { ParsedTeamResults } from "./ParsedTeamResults";

const MyTeam = () => {
  const {
    selectedFormation,
    useAI,
    gameweek,
    parsedResult,
    isLoading,
    error,
    selectedPlayers,
    totalSpent,
    remaining,
    clubLimitValid,
    setSelectedFormation,
    setUseAI,
    setGameweek,
    setParsedResult,
    setIsLoading,
    setError,
    getPlayerInSlot,
    addPlayer,
    removePlayer,
  } = useTeamBuilder();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<PlayerSlot | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const config = FORMATIONS[selectedFormation];

  const openPlayerModal = (slot: PlayerSlot) => {
    setCurrentSlot(slot);
    setIsModalOpen(true);
    setSearchQuery("");
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentSlot(null);
    setSearchQuery("");
  };

  const selectPlayer = (player: Player) => {
    if (currentSlot) {
      addPlayer(currentSlot, player);
    }
    closeModal();
  };

  /** Helper pour parser avec des overrides (utile pour auto-parse au toggle/GW) */
  const handleParseTeamWith = async (ai: boolean, gw: number) => {
    if (selectedPlayers.length !== 11) {
      setError("Please select all 11 players");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await parseTeam(selectedPlayers, selectedFormation, ai, gw);
      setParsedResult(result);
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to parse team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseTeam = async () => {
    await handleParseTeamWith(useAI, gameweek);
  };

// Handlers pour les contrôles
const handleToggleAI = (v:boolean)=> setUseAI(v);
const handleChangeGW = (gw:number)=> setGameweek(gw);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Parse Your Team
            </h1>
            <p className="text-gray-600">
              Get instant analysis and transfer suggestions
            </p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 max-w-7xl mx-auto">
        {/* Formation Selector */}
        <FormationSelector
          selectedFormation={selectedFormation}
          onFormationChange={setSelectedFormation}
        />

        {/* Squad Builder Stats */}
        <SquadBuilder
          teamSize={selectedPlayers.length}
          clubLimitValid={clubLimitValid}
          totalSpent={totalSpent}
          remaining={remaining}
        />

        {/* Football Field */}
        <FootballField
          config={config}
          getPlayerInSlot={getPlayerInSlot}
          onPlayerClick={openPlayerModal}
          onPlayerRemove={removePlayer}
        />

        {/* Team Controls */}
        <TeamControls
          useAI={useAI}
          onToggleAI={handleToggleAI}
          gameweek={gameweek}
          onGameweekChange={handleChangeGW}
          onParseTeam={handleParseTeam}
          isLoading={isLoading}
          disabled={selectedPlayers.length !== 11}
          error={error}
        />

        {/* Parsed Results */}
        {parsedResult && (
          <ParsedTeamResults result={parsedResult} gameweek={gameweek} />
        )}
      </div>

      {/* Player Selection Modal */}
      {isModalOpen && currentSlot && (
        <PlayerSelectionModal
          key={currentSlot.position}
          position={currentSlot.position}
          searchQuery={searchQuery}
          excludeIds={selectedPlayers.map((p) => p.id)}
          onSearchChange={setSearchQuery}
          onSelectPlayer={selectPlayer}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default MyTeam;
