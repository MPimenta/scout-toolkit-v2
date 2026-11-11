export type ProgramExportGoal = {
  title: string;
  code: string;
};

export type ProgramExportSdg = {
  number: number;
  name: string;
  justification?: string | null;
};

export type ProgramExportRisk = {
  level: string | null;
  risk: string | null;
  mitigation: string | null;
};

export type ProgramExportObjective = {
  code: string;
  title: string;
  age_group: string;
  behaviour: string | null;
};

export type ProgramExportActivity = {
  id: string;
  name: string | null;
  description: string | null;
  materials: string | null;
  instructions?: string | null;
  approximate_duration_minutes: number | null;
  group_sizes: string[];
  effort_level: string | null;
  locations: string[];
  /** Names of the activity's format, main focus and secondary focus (null when it has none). */
  format?: string | null;
  focus?: string | null;
  secondaryFocus?: string | null;
  educationalGoals: ProgramExportGoal[];
  sdgs: ProgramExportSdg[];
  /** Safety first: risks with their mitigation, then objectives per division with behaviours. */
  physicalRisk?: ProgramExportRisk;
  psychologicalRisk?: ProgramExportRisk;
  objectives?: ProgramExportObjective[];
  challenges?: Array<{ code: string; title: string }>;
  source?: { name: string; url: string | null; license: string | null } | null;
};

export type ProgramExportEntry = {
  id: string;
  position: number;
  start_time: string;
  end_time: string;
  entry_type: string;
  custom_title: string | null;
  custom_duration_minutes: number | null;
  activity: ProgramExportActivity | null;
};

export type ProgramForExport = {
  id: string;
  name: string;
  date: string | Date | null;
  start_time: string;
  is_public: boolean;
  user_id: string;
  created_at: string | Date;
  updated_at: string | Date;
  user: { name: string | null };
  entries: ProgramExportEntry[];
};
