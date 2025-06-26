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

// Professional rate limiting for conversion endpoints
const conversionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // Max 10 conversion requests per minute per IP
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

/**
 * Start async conversion - returns immediately with conversion ID
 */
router.post(
  "/start-conversion",
  conversionRateLimit, // Apply rate limiting middleware
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

/**
 * Get conversion status by ID
 */
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

/**
 * Cancel a conversion by ID
 */
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

/**
 * Get all conversions (for admin/debugging)
 */
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

/**
 * Get system status (load, concurrency, etc.)
 */
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

/**
 * Convert Spotify playlist to YouTube Music (LEGACY - synchronous)
 */
router.post(
  "/convert",
  conversionRateLimit, // Apply rate limiting middleware
  asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { spotifyPlaylistUrl }: ConversionRequest = req.body;

    if (!spotifyPlaylistUrl) {
      return res.status(400).json({
        success: false,
        error: "Spotify playlist URL is required",
      } as ApiResponse<null>);
    }

    // Check if YouTube Music service is available
    const ytMusicHealthy = await ytmusicService.healthCheck();
    if (!ytMusicHealthy) {
      return res.status(503).json({
        success: false,
        error:
          "YouTube Music service is not available. Please try again later.",
      } as ApiResponse<null>);
    }

    // Create conversion job with auto-generated Firestore ID for tracking
    const conversionData = {
      spotifyPlaylistUrl,
      status: "processing",
      progress: 0,
    };

    const conversionId = await firestoreService.createConversionJob(
      conversionData
    );
    if (!conversionId) {
      return res.status(500).json({
        success: false,
        error: "Failed to create conversion tracking",
      } as ApiResponse<null>);
    }

    console.log(
      `🎯 Starting conversion ${conversionId} for: ${spotifyPlaylistUrl}`
    );

    try {
      // Step 1: Fetch Spotify playlist
      const spotifyPlaylist = await spotifyService.getPlaylist(
        spotifyPlaylistUrl
      );
      const tracks = spotifyService.getSimplifiedTracks(spotifyPlaylist);

      if (tracks.length === 0) {
        return res.status(400).json({
          success: false,
          error: "No tracks found in the playlist or playlist is empty",
        } as ApiResponse<null>);
      }

      console.log(`📝 Found ${tracks.length} tracks to convert`);

      // Step 2: Create YouTube Music playlist
      const ytPlaylistTitle = `${spotifyPlaylist.name} (Converted)`;
      const ytPlaylistDescription = `Converted from Spotify playlist: ${spotifyPlaylist.name}\nOriginal URL: ${spotifyPlaylistUrl}`;

      const ytPlaylist = await ytmusicService.createPlaylist(
        ytPlaylistTitle,
        ytPlaylistDescription
      );

      // Step 3: Search and convert tracks
      const conversionTracks: ConversionTrack[] = [];
      const videoIds: string[] = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        console.log(
          `🔄 Processing track ${i + 1}/${tracks.length}: "${
            track.title
          }" by "${track.artist}"`
        );

        const conversionTrack: ConversionTrack = {
          originalTitle: track.title,
          originalArtist: track.artist,
          spotifyUrl: track.spotifyUrl,
          success: false,
        };

        try {
          const ytResult = await ytmusicService.searchTrack(
            track.title,
            track.artist
          );

          if (ytResult) {
            conversionTrack.ytMusicResult = ytResult;
            conversionTrack.success = true;
            videoIds.push(ytResult.videoId);
          } else {
            conversionTrack.error = "No matching track found on YouTube Music";
          }
        } catch (error: any) {
          conversionTrack.error = error.message;
          console.error(
            `❌ Error processing track "${track.title}":`,
            error.message
          );
        }

        conversionTracks.push(conversionTrack);
      }

      // Step 4: Add successful tracks to YouTube Music playlist
      console.log(
        `➕ ${conversionId}: Adding ${videoIds.length} tracks to playlist...`
      );
      if (videoIds.length > 0) {
        await ytmusicService.addTracksToPlaylist(
          ytPlaylist.playlistId,
          videoIds
        );
      }

      // Step 5: Prepare conversion result
      const successfulTracks = conversionTracks.filter(
        track => track.success
      ).length;
      const failedTracks = conversionTracks.length - successfulTracks;

      const conversionResult: ConversionResult = {
        spotifyPlaylistUrl,
        ytMusicPlaylistUrl: ytmusicService.getPlaylistUrl(
          ytPlaylist.playlistId
        ),
        ytMusicPlaylist: {
          ...ytPlaylist,
          url: ytmusicService.getPlaylistUrl(ytPlaylist.playlistId),
        },
        tracks: conversionTracks,
        totalTracks: tracks.length,
        successfulTracks,
        failedTracks,
        conversionId,
        timestamp: new Date().toISOString(),
      };

      console.log(
        `✅ Conversion ${conversionId} completed: ${successfulTracks}/${tracks.length} tracks successful`
      );

      res.json({
        success: true,
        data: conversionResult,
        message: `Conversion completed! ${successfulTracks} out of ${tracks.length} tracks were successfully added to YouTube Music.`,
      } as ApiResponse<ConversionResult>);
    } catch (error: any) {
      console.error(`❌ Conversion ${conversionId} failed:`, error.message);

      res.status(500).json({
        success: false,
        error: error.message,
        message: "Conversion failed. Please try again.",
      } as ApiResponse<null>);
    }
  })
);

/**
 * Health check endpoint
 */
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
