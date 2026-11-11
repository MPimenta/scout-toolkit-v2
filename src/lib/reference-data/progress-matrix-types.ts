import type { AgeGroupValue } from '../../../drizzle/schema/category-values';

/** Shape of drizzle/seeds/data/progress-matrix.json (generated; do not edit by hand). */
export interface MatrixGoal {
  code: string;
  general_objective_code: string;
  area_code: string;
  title: string;
  age_groups: AgeGroupValue[];
  position: number;
}

export interface ProgressMatrixDataset {
  version: 1;
  sources: { workbook: string; regulamento: string; sheet: string };
  areas: { code: string; name: string; icon: string; position: number }[];
  paths: { code: string; area_code: string; name: string; position: number }[];
  general_objectives: {
    code: string;
    area_code: string;
    path_code: string;
    title: string;
    position: number;
  }[];
  goals: MatrixGoal[];
  challenge_types: { code: string; name: string; position: number }[];
  challenges: {
    code: string;
    type_code: string;
    age_group: AgeGroupValue;
    position: number;
    /** Full official text, without the integration marker. */
    title: string;
    /** Short title from the reference sheet, for lists and pills. */
    short_title: string;
    /** Divisions for which this desafio is mandatory to complete the first stage (integração). */
    integration_age_groups: AgeGroupValue[];
    goal_codes: string[];
  }[];
}
