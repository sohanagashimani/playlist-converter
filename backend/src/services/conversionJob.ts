import spotifyService from "./spotify";
import ytmusicService from "./ytmusic";
import firestoreService from "./firestore";
import { ConversionResult, ConversionTrack } from "../types";

class ConversionJobService {
  private readonly MAX_CONCURRENT_JOBS = 3; // Reduced from 5 to 3 for free tier
  private readonly API_CALL_DELAY = 500; // Increased from 200ms to 500ms to be more conservative

  private cancelledConversions = new Set<string>();

  private async apiCallDelay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.API_CALL_DELAY));
  }

  async cancelConversion(
    conversionId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.cancelledConversions.add(conversionId);

      await firestoreService.updateConversionStatus(
        conversionId,
        "cancelled",
        0,
        {
          error: "Conversion cancelled by user",
          cancelledAt: new Date().toISOString(),
        }
      );

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

  private isConversionCancelled(conversionId: string): boolean {
    return this.cancelledConversions.has(conversionId);
  }

  private cleanupCancelledConversion(conversionId: string): void {
    this.cancelledConversions.delete(conversionId);
  }

  async startConversion(
    spotifyPlaylistUrl: string
  ): Promise<{ conversionId: string; success: boolean; error?: string }> {
    try {
      if (!spotifyPlaylistUrl) {
        return {
          conversionId: "",
          success: false,
          error: "Spotify playlist URL is required",
        };
      }

      const activeJobsCount = await firestoreService.getActiveJobsCount();
      if (activeJobsCount >= this.MAX_CONCURRENT_JOBS) {
        return {
          conversionId: "",
          success: false,
          error: `Server is busy processing ${activeJobsCount} conversions. Please try again in a few minutes.`,
        };
      }

      const ytMusicHealthy = await ytmusicService.healthCheck();
      if (!ytMusicHealthy) {
        return {
          conversionId: "",
          success: false,
          error:
            "YouTube Music service is not available. Please try again later.",
        };
      }

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

      await firestoreService.addActiveJob(conversionId);

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

  private async processConversionInBackground(
    conversionId: string,
    spotifyPlaylistUrl: string
  ): Promise<void> {
    try {
      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} was cancelled before processing started`
        );
        return;
      }

      await firestoreService.updateConversionStatus(
        conversionId,
        "fetching-spotify",
        10
      );

      console.log(`📡 ${conversionId}: Fetching Spotify playlist...`);
      const spotifyPlaylist = await spotifyService.getPlaylist(
        spotifyPlaylistUrl
      );
      const tracks = spotifyService.getSimplifiedTracks(spotifyPlaylist);

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

      await firestoreService.updateConversionStatus(
        conversionId,
        "creating-playlist",
        20
      );

      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled before playlist creation`
        );
        return;
      }

      const ytPlaylistTitle = `${spotifyPlaylist.name} (Converted)`;
      const ytPlaylistDescription = `Converted from Spotify playlist: ${spotifyPlaylist.name}\nOriginal URL: ${spotifyPlaylistUrl}`;

      console.log(`📝 ${conversionId}: Creating YouTube Music playlist...`);
      const ytPlaylist = await ytmusicService.createPlaylist(
        ytPlaylistTitle,
        ytPlaylistDescription,
        conversionId
      );

      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled after playlist creation`
        );
        return;
      }

      await firestoreService.updateConversionStatus(
        conversionId,
        "converting-tracks",
        30
      );

      console.log(
        `🔍 ${conversionId}: Starting track search and conversion...`
      );
      const conversionTracks: ConversionTrack[] = [];
      const videoIds: string[] = [];

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];

        if (this.isConversionCancelled(conversionId)) {
          console.log(
            `⏹️ Conversion ${conversionId} cancelled during track ${i + 1}/${
              tracks.length
            }`
          );
          return;
        }

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
          if (i > 0) {
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

      await firestoreService.updateConversionStatus(
        conversionId,
        "converting-tracks",
        65,
        {
          message: `Adding ${videoIds.length} found tracks to playlist...`,
          tracksToAdd: videoIds.length,
          currentTrack: null,
        }
      );

      console.log(
        `➕ ${conversionId}: Adding ${videoIds.length} tracks to playlist...`
      );
      let addResults = { success: 0, failed: 0 };
      if (videoIds.length > 0) {
        if (this.isConversionCancelled(conversionId)) {
          console.log(
            `⏹️ Conversion ${conversionId} cancelled before playlist addition`
          );
          return;
        }

        addResults = await ytmusicService.addTracksToPlaylist(
          ytPlaylist.playlistId,
          videoIds,
          async (
            current: number,
            total: number,
            success: number,
            failed: number
          ) => {
            if (this.isConversionCancelled(conversionId)) {
              console.log(
                `⏹️ Conversion ${conversionId} cancelled during playlist addition (${current}/${total})`
              );
              return;
            }

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
                currentTrack: null,
              }
            );
          }
        );

        await firestoreService.updateConversionStatus(
          conversionId,
          "converting-tracks",
          95,
          {
            message: `Successfully added ${addResults.success} tracks to playlist`,
            tracksAdded: addResults.success,
            tracksFailed: addResults.failed,
            currentTrack: null,
          }
        );
      } else {
        await firestoreService.updateConversionStatus(
          conversionId,
          "converting-tracks",
          95,
          {
            message: "No tracks found to add to playlist",
            tracksToAdd: 0,
            currentTrack: null,
          }
        );
      }

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

      if (this.isConversionCancelled(conversionId)) {
        console.log(
          `⏹️ Conversion ${conversionId} cancelled before final completion`
        );
        return;
      }

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
      await firestoreService.removeActiveJob(conversionId);

      this.cleanupCancelledConversion(conversionId);

      const remainingActiveJobs = await firestoreService.getActiveJobsCount();
      console.log(
        `🔄 Job ${conversionId} completed. Active jobs: ${remainingActiveJobs}/${this.MAX_CONCURRENT_JOBS}`
      );
    }
  }

  async getConversionStatus(conversionId: string): Promise<any | null> {
    return await firestoreService.getConversionData(conversionId);
  }

  async getAllConversions(): Promise<any[]> {
    return await firestoreService.getAllConversions();
  }

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
