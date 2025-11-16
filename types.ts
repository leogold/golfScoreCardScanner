
export interface PlayerScore {
  playerName: string;
  scores: (number | null)[];
  out: number | null;
  in: number | null;
  total: number | null;
}

export type ScorecardData = PlayerScore[];
   