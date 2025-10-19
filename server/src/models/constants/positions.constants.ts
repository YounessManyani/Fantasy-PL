import { Position } from "../../types";

export const POSITIONS: Record<string, Position> = {
  GKP: "GK",
  GK: "GK",
  GOALKEEPER: "GK",
  G: "GK",

  DEF: "DEF",
  DEFENDER: "DEF",
  D: "DEF",
  DF: "DEF",
  DEFENCE: "DEF",

  MID: "MID",
  MIDFIELDER: "MID",
  M: "MID",
  MF: "MID",
  MIDFIELD: "MID",

  FWD: "FWD",
  FORWARD: "FWD",
  F: "FWD",
  FW: "FWD",
  STRIKER: "FWD",
  ST: "FWD",
  ATT: "FWD",
  ATTACKER: "FWD",
};

export const POSITION_LIMITS = {
  GK: { min: 1, max: 1 },
  DEF: { min: 3, max: 5 },
  MID: { min: 2, max: 5 },
  FWD: { min: 1, max: 3 },
} as const;

export const POSITION_NAMES: Record<Position, string> = {
  GK: "Goalkeeper",
  DEF: "Defender",
  MID: "Midfielder",
  FWD: "Forward",
};
