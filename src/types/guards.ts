// Type Guard Functions
// These functions provide runtime type validation

import { 
  AgeGroup, 
  GroupSize, 
  EffortLevel, 
  Location, 
  UserRole,
  User,
  Activity,
  Program,
  ProgramEntry,
  ActivityType,
  EducationalGoal,
  Sdg,
  Review
} from './database';

import { 
  ApiActivity,
  ApiProgram,
  ApiProgramEntry
} from './api';

import { AppError, ErrorCode } from './errors';

// Primitive type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Union type guards
export function isAgeGroup(value: unknown): value is AgeGroup {
  return isString(value) && ['cub_scouts', 'scouts', 'adventurers', 'rovers', 'leaders'].includes(value);
}

export function isGroupSize(value: unknown): value is GroupSize {
  return isString(value) && ['small', 'medium', 'large'].includes(value);
}

export function isEffortLevel(value: unknown): value is EffortLevel {
  return isString(value) && ['low', 'medium', 'high'].includes(value);
}

export function isLocation(value: unknown): value is Location {
  return isString(value) && ['inside', 'outside'].includes(value);
}

export function isUserRole(value: unknown): value is UserRole {
  return isString(value) && ['user', 'admin'].includes(value);
}

export function isEntryType(value: unknown): value is 'activity' | 'custom' {
  return isString(value) && ['activity', 'custom'].includes(value);
}

// Entity type guards
export function isUser(value: unknown): value is User {
  return isObject(value) &&
    isString(value['id']) &&
    isString(value['email']) &&
    isString(value['name']) &&
    isUserRole(value['role']) &&
    isString(value['created_at']) &&
    isString(value['updated_at']);
}

export function isActivity(value: unknown): value is Activity {
  return isObject(value) &&
    isString(value['id']) &&
    isString(value['name']) &&
    isString(value['description']) &&
    isString(value['materials']) &&
    isNumber(value['approximate_duration_minutes']) &&
    isGroupSize(value['group_size']) &&
    isEffortLevel(value['effort_level']) &&
    isLocation(value['location']) &&
    isAgeGroup(value['age_group']) &&
    isString(value['activity_type_id']) &&
    isString(value['created_at']) &&
    isString(value['updated_at']) &&
    isBoolean(value['is_approved']);
}

export function isProgram(value: unknown): value is Program {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.start_time) &&
    isString(value.user_id) &&
    isBoolean(value.is_public) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

export function isProgramEntry(value: unknown): value is ProgramEntry {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.program_id) &&
    isNumber(value.position) &&
    isString(value.start_time) &&
    isString(value.end_time) &&
    isEntryType(value.entry_type) &&
    isString(value.created_at);
}

export function isActivityType(value: unknown): value is ActivityType {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name);
}

export function isEducationalGoal(value: unknown): value is EducationalGoal {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.code) &&
    isString(value.area);
}

export function isSdg(value: unknown): value is Sdg {
  return isObject(value) &&
    isString(value.id) &&
    isNumber(value.number) &&
    isString(value.name) &&
    isString(value.description);
}

export function isReview(value: unknown): value is Review {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.activity_id) &&
    isString(value.user_id) &&
    isNumber(value.rating) &&
    isString(value.created_at) &&
    isString(value.updated_at);
}

// API response type guards
export function isApiActivity(value: unknown): value is ApiActivity {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.description) &&
    isString(value.materials) &&
    isNumber(value.approximate_duration_minutes) &&
    isGroupSize(value.group_size) &&
    isEffortLevel(value.effort_level) &&
    isLocation(value.location) &&
    isAgeGroup(value.age_group) &&
    isString(value.created_at) &&
    isObject(value.activity_type) &&
    isString(value.activity_type.id) &&
    isString(value.activity_type.name) &&
    isArray(value.educational_goals) &&
    isArray(value.sdgs);
}

export function isApiProgram(value: unknown): value is ApiProgram {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.start_time) &&
    isBoolean(value.is_public) &&
    isString(value.created_at) &&
    isString(value.updated_at) &&
    isNumber(value.entry_count) &&
    isNumber(value.total_duration_minutes);
}

export function isApiProgramEntry(value: unknown): value is ApiProgramEntry {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.program_id) &&
    isNumber(value.position) &&
    isString(value.start_time) &&
    isString(value.end_time) &&
    isEntryType(value.entry_type) &&
    isString(value.created_at);
}

// Error type guards
export function isErrorCode(value: unknown): value is ErrorCode {
  return isString(value) && [
    'VALIDATION_ERROR',
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND',
    'CONFLICT',
    'INTERNAL_ERROR',
    'NETWORK_ERROR',
    'TIMEOUT_ERROR'
  ].includes(value);
}

export function isAppError(value: unknown): value is AppError {
  return isObject(value) &&
    isErrorCode(value.code) &&
    isString(value.message);
}

// Array type guards
export function isUserArray(value: unknown): value is User[] {
  return isArray(value) && value.every(isUser);
}

export function isActivityArray(value: unknown): value is Activity[] {
  return isArray(value) && value.every(isActivity);
}

export function isProgramArray(value: unknown): value is Program[] {
  return isArray(value) && value.every(isProgram);
}

export function isProgramEntryArray(value: unknown): value is ProgramEntry[] {
  return isArray(value) && value.every(isProgramEntry);
}

export function isApiActivityArray(value: unknown): value is ApiActivity[] {
  return isArray(value) && value.every(isApiActivity);
}

export function isApiProgramArray(value: unknown): value is ApiProgram[] {
  return isArray(value) && value.every(isApiProgram);
}

export function isApiProgramEntryArray(value: unknown): value is ApiProgramEntry[] {
  return isArray(value) && value.every(isApiProgramEntry);
}
