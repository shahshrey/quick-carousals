/**
 * API Error Handling Utilities
 * Provides consistent error responses across all API endpoints
 */

import { NextResponse } from "next/server";

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(requestId?: string): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        error: {
          code: this.code,
          message: this.message,
          details: this.details,
          requestId,
        },
      },
      { status: this.statusCode }
    );
  }
}

/**
 * Common API error factory functions
 */
export const ApiErrors = {
  /**
   * 400 - Validation Error
   */
  validation: (message: string, details?: unknown) =>
    new ApiError("VALIDATION_ERROR", message, 400, details),

  /**
   * 401 - Not Authenticated
   */
  unauthorized: (message: string = "Authentication required") =>
    new ApiError("UNAUTHORIZED", message, 401),

  /**
   * 403 - Not Authorized (tier/limit)
   */
  forbidden: (message: string = "Insufficient permissions") =>
    new ApiError("FORBIDDEN", message, 403),

  /**
   * 404 - Not Found
   */
  notFound: (resource: string = "Resource") =>
    new ApiError("NOT_FOUND", `${resource} not found`, 404),

  /**
   * 429 - Rate Limited
   */
  rateLimited: (retryAfter: number = 60) =>
    new ApiError(
      "RATE_LIMITED",
      `Too many requests. Please try again in ${retryAfter} seconds.`,
      429,
      { retryAfter }
    ),

  /**
   * 500 - Internal Server Error
   */
  internal: (message: string = "An internal error occurred") =>
    new ApiError("INTERNAL_ERROR", message, 500),
};

/**
 * Wrap async API route handlers with error handling
 */
export function withErrorHandler<T = unknown>(
  handler: (req: Request) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API Error:", error);

      // Handle ApiError instances
      if (error instanceof ApiError) {
        return error.toResponse();
      }

      // Handle unknown errors
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return ApiErrors.internal(message).toResponse();
    }
  };
}
