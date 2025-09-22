import fs from "fs";
import { parse } from "csv-parse/sync";
import { normalizeName } from "./normalizer.js";
import { normalizePosition } from "./positionNormalizer.js";

// Helper: convert string to number with fallback
function toNumber(value, defaultValue = 0) {
  const num = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(num) ? num : defaultValue;
}

// Z-score standardization helper
function zScore(value, mean = 0, stddev = 1) {
  if (stddev === 0) return 0;
  return (value - mean) / stddev;
}

// Enhanced scoring with Z-scores and real weights
function calculateScore(position, stats, zMeans, zStddevs) {
  const pos = normalizePosition(position);

  // Standardize all stats present in your dataset
  const ppg_z = zScore(
    stats.points_per_game,
    zMeans.points_per_game,
    zStddevs.points_per_game
  );
  const goals_z = zScore(
    stats.goals_scored,
    zMeans.goals_scored,
    zStddevs.goals_scored
  );
  const assists_z = zScore(stats.assists, zMeans.assists, zStddevs.assists);
  const cs_z = zScore(
    stats.clean_sheets,
    zMeans.clean_sheets,
    zStddevs.clean_sheets
  );
  const saves_z = zScore(stats.saves, zMeans.saves, zStddevs.saves);
  const gc_z = zScore(
    stats.goals_conceded,
    zMeans.goals_conceded,
    zStddevs.goals_conceded
  );
  const bonus_z = zScore(stats.bonus, zMeans.bonus, zStddevs.bonus);
  const yellow_z = zScore(
    stats.yellow_cards || 0,
    zMeans.yellow_cards || 0,
    zStddevs.yellow_cards || 1
  );
  const red_z = zScore(
    stats.red_cards || 0,
    zMeans.red_cards || 0,
    zStddevs.red_cards || 1
  );
  const xgi_z = zScore(
    stats.expected_goal_involvements,
    zMeans.expected_goal_involvements,
    zStddevs.expected_goal_involvements
  );
//remps de jeux a ajouter obligatoirement
  switch (pos) {
    case "GK":
      return (
        0.4 * ppg_z +
        0.3 * cs_z +
        0.2 * saves_z -
        0.2 * gc_z +
        0.1 * bonus_z -
        0.3 * yellow_z -
        0.5 * red_z
      );

    case "DEF":
      return (
        0.3 * ppg_z +
        0.25 * cs_z +
        0.15 * goals_z +
        0.15 * assists_z -
        0.2 * gc_z +
        0.1 * bonus_z -
        0.3 * yellow_z -
        0.5 * red_z
      );

    case "MID":
      return (
        0.35 * ppg_z +
        0.25 * xgi_z +
        0.2 * goals_z +
        0.15 * assists_z +
        0.05 * bonus_z -
        0.25 * yellow_z -
        0.4 * red_z
      );

    case "FWD":
      return (
        0.45 * ppg_z +
        0.35 * xgi_z +
        0.15 * goals_z +
        0.05 * assists_z -
        0.3 * yellow_z -
        0.4 * red_z
      );

    default:
      return (
        0.35 * ppg_z +
        0.25 * xgi_z +
        0.2 * goals_z +
        0.15 * assists_z +
        0.05 * bonus_z -
        0.25 * yellow_z -
        0.4 * red_z
      );
  }
}

// You must supply these calculated from your dataset analysis
const zMeans = {
  points_per_game: 1.4328147100424329,
  goals_scored: 0.07213578500707214,
  assists: 0.06647807637906648,
  clean_sheets: 0.2347949080622348,
  saves: 0.12871287128712872,
  goals_conceded: 0.809052333804809,
  bonus: 0.17256011315417255,
  yellow_cards: 0.09476661951909476,
  red_cards: 0.004243281471004243,
  expected_goal_involvements: 0.11891089108910892,
};

const zStddevs = {
  points_per_game: 2.202627561252349,
  goals_scored: 0.2992708606605565,
  assists: 0.28112607069430867,
  clean_sheets: 0.4742656726290995,
  saves: 0.8199140334356423,
  goals_conceded: 1.461056013564097,
  bonus: 0.6458962679568987,
  yellow_cards: 0.3116108544322986,
  red_cards: 0.06500212329887455,
  expected_goal_involvements: 0.27477562245602194,
};

export function loadPlayers(csvPath) {
  const text = fs.readFileSync(csvPath, "utf8");
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
  });

  if (!rows.length) {
    throw new Error("No data found in CSV");
  }

  const columns = Object.keys(rows[0]);
  const required = [
    "player_name",
    "club_name",
    "position_name",
    "now_cost",
    "points_per_game",
  ];

  const missing = required.filter((col) => !columns.includes(col));
  if (missing.length) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`);
  }

  // Helper to find columns by partial case-insensitive match
  const findColumn = (needle) =>
    columns.find((col) => col.toLowerCase().includes(needle.toLowerCase()));

  const webNameColumn = findColumn("web_name");

  return rows.map((row, index) => {
    const rawPosition = row.position_name;
    const normalizedPosition = normalizePosition(rawPosition);
    const normalizedName = normalizeName(row.player_name);
    const nameParts = normalizedName.split(" ").filter(Boolean);

    const stats = {
      points_per_game: toNumber(row.points_per_game),
      goals_scored: toNumber(row.goals_scored),
      assists: toNumber(row.assists),
      clean_sheets: toNumber(row.clean_sheets),
      saves: toNumber(row.saves),
      goals_conceded: toNumber(row.goals_conceded),
      bonus: toNumber(row.bonus),
      yellow_cards: toNumber(row.yellow_cards || 0),
      red_cards: toNumber(row.red_cards || 0),
      expected_goal_involvements: toNumber(row.expected_goal_involvements),
    };

    return {
      id: index,
      player_name: row.player_name,
      normalized_name: normalizedName,
      surname: nameParts[nameParts.length - 1] || normalizedName,
      web_name: webNameColumn ? row[webNameColumn] : "",
      club_name: row.club_name,
      position: normalizedPosition,
      raw_position: rawPosition,
      price: toNumber(row.now_cost),
      points_per_game: stats.points_per_game,
      score: calculateScore(normalizedPosition, stats, zMeans, zStddevs),
      total_points: toNumber(row.total_points),
      minutes: toNumber(row.minutes),
    };
  });
}
