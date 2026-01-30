/**
 * Zod Schema Validation Helpers for API Routes
 */

import { z, type ZodSchema } from "zod";
import { ApiErrors } from "../api-error";

/**
 * Validate request JSON body against a Zod schema
 * @throws {ApiError} If validation fails
 */
export async function validateBody<T extends ZodSchema>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.validation("Invalid request body", {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    throw ApiErrors.validation("Failed to parse request body");
  }
}

/**
 * Validate URL search params against a Zod schema
 * @throws {ApiError} If validation fails
 */
export function validateSearchParams<T extends ZodSchema>(
  searchParams: URLSearchParams,
  schema: T
): z.infer<T> {
  try {
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.validation("Invalid query parameters", {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    throw ApiErrors.validation("Failed to parse query parameters");
  }
}

/**
 * Validate path params against a Zod schema
 * @throws {ApiError} If validation fails
 */
export function validateParams<T extends ZodSchema>(
  params: Record<string, string | string[]>,
  schema: T
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.validation("Invalid path parameters", {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    throw ApiErrors.validation("Failed to parse path parameters");
  }
}

/**
 * Validate any data against a Zod schema
 * Useful for validating data after fetching from database or external APIs
 * @throws {ApiError} If validation fails
 */
export function validate<T extends ZodSchema>(
  data: unknown,
  schema: T,
  errorMessage: string = "Validation failed"
): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw ApiErrors.validation(errorMessage, {
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    throw ApiErrors.validation(errorMessage);
  }
}
