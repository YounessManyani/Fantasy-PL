import { FPLRules } from "../../types";

export const FPL_RULES: FPLRules = {
  maxPlayersPerClub: 3,
  maxTransfers: 2,
  squadSize: 15,
  squadComposition: {
    goalkeepers: 2,
    defenders: 5,
    midfielders: 5,
    forwards: 3,
  },
  startingXI: 11,
  budget: 100.0,
  maxTransfersPerWeek: 1,
  extraTransferCost: -4,
};
