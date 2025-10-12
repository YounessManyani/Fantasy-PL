export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface ApiError {
    error: string;
    message: string;
    details?: any;
  }
  
  export interface HealthResponse {
    status: string;
    version: string;
    environment: string;
    playersLoaded: number;
    llm: {
      enabled: boolean;
      provider: string;
      model: string;
      hasKey: boolean;
    };
  }
  
  export interface ParseTeamRequest {
    teamText: string;
    strictMode?: boolean;
    includeSuggestions?: boolean;
    useLLM?: boolean;
    gameweek?: number;
  }
  
  export interface RecommendRequest extends ParseTeamRequest {
    bank?: number;
    maxTransfers?: number;
    strategy?: string;
  }
  
  export interface AnalyzeFixturesRequest {
    query: string;
    teamText?: string;
    gameweek?: number;
    bank?: number;
    includeTransfers?: boolean;
  }
  
  export interface ComparePlayersRequest {
    players: string[];
    gameweeksAhead?: number;
    currentGameweek?: number;
  }