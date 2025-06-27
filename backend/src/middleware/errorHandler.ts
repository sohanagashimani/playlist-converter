import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const error = { ...err };
  error.message = err.message;

  // Log error
  console.error(`❌ Error: ${error.message}`);
  console.error(err.stack);

  // Default error
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal Server Error";

  // Spotify API errors
  if (error.message.includes("Spotify")) {
    statusCode = 400;
    message = `Spotify API error: ${error.message}`;
  }

  // YouTube Music API errors
  if (error.message.includes("YTMusic")) {
    statusCode = 400;
    message = `YouTube Music API error: ${error.message}`;
  }

  // Invalid playlist URL
  if (error.message.includes("Invalid playlist URL")) {
    statusCode = 400;
    message = "Invalid Spotify playlist URL provided";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);
