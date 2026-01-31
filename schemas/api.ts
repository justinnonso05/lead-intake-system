export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any; // For validation errors etc
}

export function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function createErrorResponse(error: string, details?: any): ApiResponse {
  return {
    success: false,
    error,
    details,
  };
}
