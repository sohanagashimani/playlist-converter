import express, { Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { asyncHandler } from "../middleware/errorHandler";
import spotifyService from "../services/spotify";
import ytmusicService from "../services/ytmusic";
import conversionJobService from "../services/conversionJob";
import firestoreService from "../services/firestore";
import {
  ConversionRequest,
  ConversionResult,
  ConversionTrack,
  ApiResponse,
} from "../types";

const globalConversionLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 3, // Max 3 total conversions per minute (~4,320/day = safe for 20K writes)
  message: {
    success: false,
    error: "System is at capacity. Please try again in a minute.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: () => "global", // Single key for all requests
});

const conversionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // Reduced from 10 to 5 per IP to be more conservative
  message: {
    success: false,
    error: "Too many conversion requests. Please try again in a minute.",
  },
  standardHeaders: "draft-8", // Include standard RateLimit headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skipSuccessfulRequests: false, // Count all requests
  keyGenerator: req => req.ip || req.connection.remoteAddress || "unknown",
});

const router = express.Router();

router.post(
  "/start-conversion",
  globalConversionLimit, // Apply global rate limiting first
  conversionRateLimit, // Then per-IP rate limiting
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { spotifyPlaylistUrl }: ConversionRequest = req.body;

    if (!spotifyPlaylistUrl) {
      return res.status(400).json({
        success: false,
        error: "Spotify playlist URL is required",
      } as ApiResponse<null>);
    }

    const result = await conversionJobService.startConversion(
      spotifyPlaylistUrl
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: { conversionId: result.conversionId },
      message:
        "Conversion started! Check back in a few minutes to see the results.",
    } as ApiResponse<{ conversionId: string }>);
  })
);

router.get(
  "/conversion-status/:conversionId",
  asyncHandler(
    async (
      req: Request,
      res: Response,
      _next: express.NextFunction
    ): Promise<any> => {
      const { conversionId } = req.params;

      if (!conversionId) {
        return res.status(400).json({
          success: false,
          error: "Conversion ID is required",
        } as ApiResponse<null>);
      }

      const conversionData = await conversionJobService.getConversionStatus(
        conversionId
      );

      if (!conversionData) {
        return res.status(404).json({
          success: false,
          error: "Conversion not found or expired",
        } as ApiResponse<null>);
      }

      res.json({
        success: true,
        data: conversionData,
        message: `Conversion status: ${conversionData.status}`,
      } as ApiResponse<any>);
    }
  )
);

router.post(
  "/cancel-conversion/:conversionId",
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { conversionId } = req.params;

    if (!conversionId) {
      return res.status(400).json({
        success: false,
        error: "Conversion ID is required",
      } as ApiResponse<null>);
    }

    const result = await conversionJobService.cancelConversion(conversionId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      } as ApiResponse<null>);
    }

    res.json({
      success: true,
      data: { conversionId },
      message: result.message,
    } as ApiResponse<{ conversionId: string }>);
  })
);

router.get(
  "/conversions",
  asyncHandler(async (req: Request, res: Response) => {
    const conversions = await conversionJobService.getAllConversions();

    res.json({
      success: true,
      data: conversions,
      message: `Found ${conversions.length} conversions`,
    } as ApiResponse<any[]>);
  })
);

router.get(
  "/system-status",
  asyncHandler(async (req: Request, res: Response) => {
    const systemStatus = await conversionJobService.getSystemStatus();

    res.json({
      success: true,
      data: systemStatus,
      message: "System status retrieved",
    } as ApiResponse<any>);
  })
);

router.get(
  "/health",
  asyncHandler(async (req: Request, res: Response) => {
    const ytMusicHealthy = await ytmusicService.healthCheck();

    res.json({
      success: true,
      data: {
        backend: true,
        ytmusicService: ytMusicHealthy,
        timestamp: new Date().toISOString(),
      },
    });
  })
);

export default router;
