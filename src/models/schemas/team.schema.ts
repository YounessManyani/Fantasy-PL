import { z } from 'zod';

export const parseTeamSchema = z.object({
  teamText: z.string().min(1, 'Team text is required'),
  strictMode: z.boolean().optional().default(false),
  includeSuggestions: z.boolean().optional().default(true),
  useLLM: z.boolean().optional().default(false),
  gameweek: z.number().int().min(1).max(38).optional()
});

export const recommendSchema = z.object({
  teamText: z.string().min(1, 'Team text is required'),
  bank: z.number().min(0).max(100).optional().default(0),
  maxTransfers: z.number().int().min(1).max(2).optional().default(1),
  strictMode: z.boolean().optional().default(false),
  useLLM: z.boolean().optional().default(false),
  gameweek: z.number().int().min(1).max(38).optional(),
  strategy: z.enum(['best_gain', 'best_value', 'balanced']).optional().default('best_gain')
});

export const analyzeFixturesSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  teamText: z.string().optional(),
  gameweek: z.number().int().min(1).max(38).optional(),
  bank: z.number().min(0).max(100).optional().default(0),
  includeTransfers: z.boolean().optional().default(false)
});

export const comparePlayersSchema = z.object({
  players: z.array(z.string()).min(2).max(5),
  gameweeksAhead: z.number().int().min(1).max(10).optional().default(5),
  currentGameweek: z.number().int().min(1).max(38).optional()
});

export type ParseTeamInput = z.infer<typeof parseTeamSchema>;
export type RecommendInput = z.infer<typeof recommendSchema>;
export type AnalyzeFixturesInput = z.infer<typeof analyzeFixturesSchema>;
export type ComparePlayersInput = z.infer<typeof comparePlayersSchema>;