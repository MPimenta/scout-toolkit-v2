export type ProgramExportGoal = {
  title: string;
  code: string;
};

export type ProgramExportSdg = {
  number: number;
  name: string;
};

export type ProgramExportActivity = {
  id: string;
  name: string | null;
  description: string | null;
  materials: string | null;
  approximate_duration_minutes: number | null;
  group_size: string | null;
  effort_level: string | null;
  location: string | null;
  activityType: { name: string | null };
  educationalGoals: ProgramExportGoal[];
  sdgs: ProgramExportSdg[];
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
