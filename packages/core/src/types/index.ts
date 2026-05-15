export type UserRole =
  | 'aspirant'
  | 'strategist'
  | 'candidate'
  | 'campaign_manager'
  | 'coordinator'
  | 'agent'
  | 'finance_officer'
  | 'citizen'
  | 'admin';

export type OfficeSought =
  | 'president'
  | 'governor'
  | 'senate'
  | 'house_of_reps'
  | 'state_assembly';

export interface Constituency {
  id: string;
  name: string;
  state: string;
  office: OfficeSought;
}

export interface Race {
  id: string;
  office: OfficeSought;
  state: string;
  constituency: Constituency | null;
  cycle: number; // e.g. 2027
}

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface ScenarioProjection {
  candidateId: string;
  party: string;
  voteShare: number;
  confidence: ConfidenceTier;
}
