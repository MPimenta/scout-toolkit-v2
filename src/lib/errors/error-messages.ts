// Standardized Portuguese Error Messages
// This file contains all error messages used throughout the application

export const ERROR_MESSAGES = {
  // Core error codes (matching ErrorCode type)
  VALIDATION_ERROR: 'Dados inválidos',
  AUTHENTICATION_ERROR: 'Não está autenticado',
  AUTHORIZATION_ERROR: 'Acesso negado',
  NOT_FOUND: 'Recurso não encontrado',
  CONFLICT: 'Conflito de dados',
  INTERNAL_ERROR: 'Erro interno do servidor',
  NETWORK_ERROR: 'Erro de rede',
  TIMEOUT_ERROR: 'Tempo limite excedido',
  
  // Additional specific messages
  UNAUTHORIZED: 'Não está autenticado',
  FORBIDDEN: 'Acesso negado',
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  SESSION_EXPIRED: 'Sessão expirada',
  
  // Not Found
  ACTIVITY_NOT_FOUND: 'Atividade não encontrada',
  PROGRAM_NOT_FOUND: 'Programa não encontrado',
  USER_NOT_FOUND: 'Utilizador não encontrado',
  RESOURCE_NOT_FOUND: 'Recurso não encontrado',
  
  // Validation
  INVALID_INPUT: 'Dados inválidos',
  MISSING_REQUIRED_FIELD: 'Campo obrigatório em falta',
  INVALID_EMAIL: 'Email inválido',
  INVALID_DATE: 'Data inválida',
  INVALID_TIME: 'Hora inválida',
  INVALID_DURATION: 'Duração inválida',
  
  // Program-specific
  PROGRAM_NAME_REQUIRED: 'Nome do programa é obrigatório',
  PROGRAM_START_TIME_REQUIRED: 'Hora de início é obrigatória',
  PROGRAM_ENTRY_POSITION_REQUIRED: 'Posição da entrada é obrigatória',
  PROGRAM_ENTRY_TYPE_REQUIRED: 'Tipo de entrada é obrigatório',
  PROGRAM_ENTRY_TIMES_REQUIRED: 'Horas de início e fim são obrigatórias',
  
  // Activity-specific
  ACTIVITY_NAME_REQUIRED: 'Nome da atividade é obrigatório',
  ACTIVITY_DESCRIPTION_REQUIRED: 'Descrição da atividade é obrigatória',
  ACTIVITY_DURATION_REQUIRED: 'Duração da atividade é obrigatória',
  
  // Database & Server
  DATABASE_ERROR: 'Erro na base de dados',
  INTERNAL_SERVER_ERROR: 'Erro interno do servidor',
  
  // File & Upload
  FILE_TOO_LARGE: 'Ficheiro demasiado grande',
  INVALID_FILE_TYPE: 'Tipo de ficheiro inválido',
  UPLOAD_FAILED: 'Falha no carregamento',
  
  // Conflict
  RESOURCE_ALREADY_EXISTS: 'Recurso já existe',
  DUPLICATE_ENTRY: 'Entrada duplicada',
  CONFLICTING_DATA: 'Dados em conflito',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Limite de taxa excedido',
  TOO_MANY_REQUESTS: 'Muitas solicitações',
  
  // Generic
  UNKNOWN_ERROR: 'Erro desconhecido',
  OPERATION_FAILED: 'Operação falhou',
  VALIDATION_FAILED: 'Validação falhou',
} as const;

// Error message type for type safety
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

// Helper function to get error message
export function getErrorMessage(key: ErrorMessageKey): string {
  return ERROR_MESSAGES[key];
}

// Helper function to get error message with fallback
export function getErrorMessageSafe(key: ErrorMessageKey, fallback?: string): string {
  return ERROR_MESSAGES[key] || fallback || ERROR_MESSAGES.UNKNOWN_ERROR;
}
