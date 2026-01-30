/**
 * Authentication middleware for protected API endpoints
 * Validates Clerk session and extracts userId
 */

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { ApiErrors, type ApiErrorResponse } from "./api-error";

export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Wraps an API route handler to require authentication
 * Returns 401 if no valid Clerk session is found
 * Injects userId into the request context for authenticated users
 */
export function withAuth<T = unknown>(
  handler: (req: Request, context: { userId: string }) => Promise<NextResponse<T>>
) {
  return async (req: Request): Promise<NextResponse<T | ApiErrorResponse>> => {
    try {
      // Get Clerk session
      const { userId } = await auth();

      // Return 401 if not authenticated
      if (!userId) {
        return ApiErrors.unauthorized("Authentication required").toResponse();
      }

      // Call handler with userId in context
      return await handler(req, { userId });
    } catch (error) {
      console.error("Auth middleware error:", error);

      // Handle unexpected errors
      const message =
        error instanceof Error ? error.message : "Authentication failed";
      return ApiErrors.internal(message).toResponse();
    }
  };
}

/**
 * Optional: withAuth + error handling combo
 * Use this for protected endpoints that need both auth and error handling
 */
export function withAuthAndErrors<T = unknown>(
  handler: (req: Request, context: { userId: string }) => Promise<NextResponse<T>>
) {
  return withAuth(async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API Error:", error);

      // Handle ApiError instances
      if (error instanceof Error && "statusCode" in error) {
        return NextResponse.json(
          {
            error: {
              code: (error as any).code || "ERROR",
              message: error.message,
              details: (error as any).details,
            },
          },
          { status: (error as any).statusCode || 500 }
        );
      }

      // Handle unknown errors
      const message =
        error instanceof Error ? error.message : "Unknown error occurred";
      return ApiErrors.internal(message).toResponse();
    }
  });
}
