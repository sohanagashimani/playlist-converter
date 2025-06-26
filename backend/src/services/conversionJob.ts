import spotifyService from "./spotify";
import ytmusicService from "./ytmusic";
import firestoreService from "./firestore";
import { ConversionResult, ConversionTrack } from "../types";

class ConversionJobService {
  private readonly MAX_CONCURRENT_JOBS = 5; // Maximum concurrent conversions
  private readonly API_CALL_DELAY = 200; // 200ms delay between YouTube Music API calls (prevents overwhelming their API)

  // Track cancelled conversions to stop processing
  private cancelledConversions = new Set<string>();

  /**
   * Add a small delay between API calls to prevent overwhelming YouTube Music service
   */
  private async apiCallDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.API_CALL_DELAY));
  }

  /**
   * Cancel a conversion by marking it as cancelled
   */
  async cancelConversion(
    conversionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Add to cancelled set
      this.cancelledConversions.add(conversionId);

      // Update Firestore status
      await firestoreService.updateConversionStatus(
        conversionId,
        "cancelled",
        0,
        {
          error: "Conversion cancelled by user",
          cancelledAt: new Date().toISOString(),
        }
      );

      // Remove from active jobs
      await firestoreService.removeActiveJob(conversionId);

      console.log(`❌ Conversion ${conversionId} cancelled by user`);

      return {
        success: true,
        message: "Conversion cancelled successfully",
      };
    } catch (error: any) {
      console.error(`❌ Failed to cancel conversion ${conversionId}:`, error);
      return {
        success: false,
        message: error.message || "Failed to cancel conversion",
      };
    }
  }

  /**
   * Check if a conversion is cancelled
   */
  private isConversionCancelled(conversionId: string): boolean {
    return this.cancelledConversions.has(conversionId);
  }

  /**
   * Clean up cancelled conversion from memory
   */
  private cleanupCancelledConversion(conversionId: string): void {
    this.cancelledConversions.delete(conversionId);
  }

  /**
   * Start a new conversion job and return immediately with conversion ID
   */
  async startConversion(
    spotifyPlaylistUrl: string
  ): Promise<{ conversionId: string; success: boolean; error?: string }> {
    try {
      // Validate URL first
      if (!spotifyPlaylistUrl) {
        return {
          conversionId: "",
          success: false,
          error: "Spotify playlist URL is required",
        };
      }

      // Check concurrency limit using Firestore
      const activeJobsCount = await firestoreService.getActiveJobsCount();
      if (activeJobsCount >= this.MAX_CONCURRENT_JOBS) {
        return {
          conversionId: "",
          success: false,
          error: `Server is busy processing ${activeJobsCount} conversions. Please try again in a few minutes.`,
        };
      }

      // Check if YouTube Music service is available
      const ytMusicHealthy = await ytmusicService.healthCheck();
      if (!ytMusicHealthy) {
        return {
          conversionId: "",
          success: false,
          error:
            "YouTube Music service is not available. Please try again later.",
        };
      }

      // Create conversion job with auto-generated Firestore ID
      const initialData = {
        spotifyPlaylistUrl,
        status: "started",
        progress: 0,
      };

      const conversionId = await firestoreService.createConversionJob(
        initialData
      );
      if (!conversionId) {
        return {
          conversionId: "",
          success: false,
          error: "Failed to create conversion job",
        };
      }

      // Add to active jobs in Firestore
      await firestoreService.addActiveJob(conversionId);

      // Start background processing (no await - let it run async)
      this.processConversionInBackground(conversionId, spotifyPlaylistUrl);

      const updatedActiveCount = await firestoreService.getActiveJobsCount();
      console.log(
        `🎯 Started conversion ${conversionId} for: ${spotifyPlaylistUrl} (${updatedActiveCount}/${this.MAX_CONCURRENT_JOBS} active)`
      );

      return { conversionId, success: true };
    } catch (error: any) {
      console.error("❌ Failed to start conversion:", error);
      return {
        conversionId: "",
        success: false,
        error: error.message || "Failed to start conversion",
      };
    }
  }

  /**
   * Process the conversion in the background
   */
  private async processConversionInBackground(
    conversionId: string,
    spotifyPlaylistUrl: string
  ): Promise<void> {
    try {
      // Check if cancelled before starting
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} was cancelled before processing started`
        );
        return;
      }

      // Update status to processing
      await firestoreService.updateConversionStatus(
        conversionId,
        "fetching-spotify",
        10
      );

      // Step 1: Fetch Spotify playlist
      console.log(`📡 ${conversionId}: Fetching Spotify playlist...`);
      const spotifyPlaylist = await spotifyService.getPlaylist(
        spotifyPlaylistUrl
      );
      const tracks = spotifyService.getSimplifiedTracks(spotifyPlaylist);

      // Check if cancelled after Spotify fetch
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled after Spotify fetch`
        );
        return;
      }

      if (tracks.length === 0) {
        await firestoreService.updateConversionStatus(
          conversionId,
          "failed",
          0,
          {
            error: "No tracks found in the playlist or playlist is empty",
          }
        );
        return;
      }

      console.log(
        `📝 ${conversionId}: Found ${tracks.length} tracks to convert`
      );

      // Update progress
      await firestoreService.updateConversionStatus(
        conversionId,
        "creating-playlist",
        20
      );

      // Check if cancelled before creating playlist
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled before playlist creation`
        );
        return;
      }

      // Step 2: Create YouTube Music playlist
      const ytPlaylistTitle = `${spotifyPlaylist.name} (Converted)`;
      const ytPlaylistDescription = `Converted from Spotify playlist: ${spotifyPlaylist.name}\nOriginal URL: ${spotifyPlaylistUrl}`;

      console.log(`📝 ${conversionId}: Creating YouTube Music playlist...`);
      const ytPlaylist = await ytmusicService.createPlaylist(
        ytPlaylistTitle,
        ytPlaylistDescription,
        conversionId
      );

      // Check if cancelled after playlist creation
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled after playlist creation`
        );
        return;
      }

      // Update progress
      await firestoreService.updateConversionStatus(
        conversionId,
        "converting-tracks",
        30
      );

      // Step 3: Search and convert tracks
      console.log(
        `🔍 ${conversionId}: Starting track search and conversion...`
      );
      const conversionTracks: ConversionTrack[] = [];
      const videoIds: string[] = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        // Check for cancellation before each track
        if (this.isConversionCancelled(conversionId)) {
          console.log(
            `⏹️ Conversion ${conversionId} cancelled during track ${i + 1}/${
              tracks.length
            }`
          );
          return;
        }

        // Searching takes 30-65% (35% total), leaving more room for playlist addition
        const trackProgress = 30 + Math.floor((i / tracks.length) * 35);

        await firestoreService.updateConversionStatus(
          conversionId,
          "converting-tracks",
          trackProgress,
          {
            currentTrack: `${track.title} by ${track.artist}`,
            processed: i,
            total: tracks.length,
          }
        );

        console.log(
          `🔄 ${conversionId}: Processing track ${i + 1}/${tracks.length}: "${
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
          // API rate limiting: Add delay before API call to prevent overwhelming YouTube Music
          if (i > 0) {
            // Skip delay for first track
            await this.apiCallDelay();
          }

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
            `❌ ${conversionId}: Error processing track "${track.title}":`,
            error.message
          );
        }

        conversionTracks.push(conversionTrack);
      }

      // Update progress to adding phase (Track searching is now complete at 65%)
      await firestoreService.updateConversionStatus(
        conversionId,
        "converting-tracks",
        65,
        {
          message: `Adding ${videoIds.length} found tracks to playlist...`,
          tracksToAdd: videoIds.length,
        }
      );

      // Step 4: Add successful tracks to YouTube Music playlist
      console.log(
        `➕ ${conversionId}: Adding ${videoIds.length} tracks to playlist...`
      );
      let addResults = { success: 0, failed: 0 };
      if (videoIds.length > 0) {
        // Check for cancellation before starting playlist addition
        if (this.isConversionCancelled(conversionId)) {
          console.log(
            `⏹️ Conversion ${conversionId} cancelled before playlist addition`
          );
          return;
        }

        // Use dynamic progress during playlist addition
        addResults = await ytmusicService.addTracksToPlaylist(
          ytPlaylist.playlistId,
          videoIds,
          async (
            current: number,
            total: number,
            success: number,
            failed: number
          ) => {
            // Check for cancellation during each track addition
            if (this.isConversionCancelled(conversionId)) {
              console.log(
                `⏹️ Conversion ${conversionId} cancelled during playlist addition (${current}/${total})`
              );
              return;
            }

            // Progress from 65% to 95% during playlist addition (30% total)
            const addProgress = Math.floor(65 + (current / total) * 30);

            await firestoreService.updateConversionStatus(
              conversionId,
              "converting-tracks",
              addProgress,
              {
                message: `Adding tracks to playlist... (${current}/${total})`,
                tracksProcessed: current,
                tracksToAdd: total,
                tracksAdded: success,
                tracksFailed: failed,
              }
            );
          }
        );

        // Final update for playlist addition phase
        await firestoreService.updateConversionStatus(
          conversionId,
          "converting-tracks",
          95,
          {
            message: `Successfully added ${addResults.success} tracks to playlist`,
            tracksAdded: addResults.success,
            tracksFailed: addResults.failed,
          }
        );
      } else {
        // No tracks to add
        await firestoreService.updateConversionStatus(
          conversionId,
          "converting-tracks",
          95,
          {
            message: "No tracks found to add to playlist",
            tracksToAdd: 0,
          }
        );
      }

      // Step 5: Prepare final result
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

      // Final cancellation check before marking as completed
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled before final completion`
        );
        return;
      }

      // Final update - mark as completed
      await firestoreService.updateConversionStatus(
        conversionId,
        "completed",
        100,
        conversionResult
      );

      console.log(
        `✅ Conversion ${conversionId} completed: ${successfulTracks}/${tracks.length} tracks successful`
      );
    } catch (error: any) {
      console.error(`❌ Conversion ${conversionId} failed:`, error.message);

      // Handle cancellation specifically - don't mark as failed
      if (error.message === "CONVERSION_CANCELLED") {
        console.log(
          `🛑 Conversion ${conversionId} was cancelled during processing`
        );
        await firestoreService.updateConversionStatus(
          conversionId,
          "cancelled",
          0,
          {
            error: "Conversion cancelled by user",
            cancelledAt: new Date().toISOString(),
          }
        );
      } else {
        await firestoreService.updateConversionStatus(
          conversionId,
          "failed",
          0,
          {
            error: error.message || "Conversion failed",
          }
        );
      }
    } finally {
      // Remove from active jobs when done (success or failure)
      await firestoreService.removeActiveJob(conversionId);

      // Clean up cancellation tracking
      this.cleanupCancelledConversion(conversionId);

      const remainingActiveJobs = await firestoreService.getActiveJobsCount();
      console.log(
        `🔄 Job ${conversionId} completed. Active jobs: ${remainingActiveJobs}/${this.MAX_CONCURRENT_JOBS}`
      );
    }
  }

  /**
   * Get conversion status by ID
   */
  async getConversionStatus(conversionId: string): Promise<any | null> {
    return await firestoreService.getConversionData(conversionId);
  }

  /**
   * Get all conversions
   */
  async getAllConversions(): Promise<any[]> {
    return await firestoreService.getAllConversions();
  }

  /**
   * Get system status (active jobs, load, etc.)
   */
  async getSystemStatus(): Promise<any> {
    const activeJobsCount = await firestoreService.getActiveJobsCount();
    const activeJobIds = await firestoreService.getActiveJobs();

    return {
      activeJobs: activeJobsCount,
      activeJobIds,
      maxConcurrentJobs: this.MAX_CONCURRENT_JOBS,
      loadPercentage: Math.round(
        (activeJobsCount / this.MAX_CONCURRENT_JOBS) * 100
      ),
      apiCallDelay: this.API_CALL_DELAY,
      canAcceptNewJobs: activeJobsCount < this.MAX_CONCURRENT_JOBS,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

export default new ConversionJobService();
