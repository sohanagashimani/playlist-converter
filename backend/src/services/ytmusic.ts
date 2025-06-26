import axios from "axios";
import { YTMusicSearchResult, YTMusicPlaylist } from "../types";

class YTMusicService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.YTMUSIC_SERVICE_URL || "http://localhost:8000";
  }

  /**
   * Get authentication headers for service-to-service calls (currently disabled)
   */
  private async getAuthHeaders(
    silent: boolean = false
  ): Promise<{ [key: string]: string }> {
    // Temporarily disabled authentication for simplicity
    if (!silent) {
      console.log("🔓 Using unauthenticated requests to ytmusic service");
    }
    return {};
  }

  /**
   * Search for a track on YouTube Music
   */
  async searchTrack(
    title: string,
    artist: string
  ): Promise<YTMusicSearchResult | null> {
    try {
      const searchQuery = `${title} ${artist}`.trim();
      console.log(`🔍 Searching YouTube Music for: "${searchQuery}"`);

      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query: searchQuery,
          title,
          artist,
        },
        { headers }
      );

      if (response.data.success && response.data.result) {
        console.log(`✅ Found match: "${response.data.result.title}"`);
        return response.data.result;
      } else {
        console.log(`❌ No match found for: "${searchQuery}"`);
        return null;
      }
    } catch (error: any) {
      console.error(
        `❌ Error searching for "${title}" by "${artist}":`,
        error.message
      );
      return null;
    }
  }

  /**
   * Create a new playlist on YouTube Music
   */
  async createPlaylist(
    title: string,
    description?: string,
    conversionId?: string
  ): Promise<YTMusicPlaylist> {
    try {
      console.log(`📝 Creating YouTube Music playlist: "${title}"`);

      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.baseUrl}/create-playlist`,
        {
          title,
          description:
            description ||
            `Converted from Spotify playlist - ${new Date().toLocaleDateString()}`,
          conversionId,
        },
        { headers }
      );

      if (response.data.success && response.data.playlist) {
        console.log(
          `✅ Created playlist with ID: ${response.data.playlist.playlistId}`
        );
        return response.data.playlist;
      } else {
        throw new Error(
          `Failed to create playlist: ${response.data.error || "Unknown error"}`
        );
      }
    } catch (error: any) {
      // Handle cancellation specifically
      if (error.response?.status === 409 && error.response?.data?.cancelled) {
        console.log("🛑 Playlist creation aborted - conversion was cancelled");
        throw new Error("CONVERSION_CANCELLED");
      }

      console.error("❌ Error creating YouTube Music playlist:", error.message);
      throw new Error(
        `YTMusic playlist creation failed: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  /**
   * Add a track to a YouTube Music playlist
   */
  async addTrackToPlaylist(
    playlistId: string,
    videoId: string
  ): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.baseUrl}/add-to-playlist`,
        {
          playlistId,
          videoId,
        },
        { headers }
      );

      if (response.data.success) {
        console.log(`✅ Added track ${videoId} to playlist ${playlistId}`);
        return true;
      } else {
        console.log(
          `❌ Failed to add track ${videoId} to playlist: ${response.data.error}`
        );
        return false;
      }
    } catch (error: any) {
      console.error(
        `❌ Error adding track ${videoId} to playlist:`,
        error.message
      );
      return false;
    }
  }

  /**
   * Batch add tracks to a playlist
   */
  async addTracksToPlaylist(
    playlistId: string,
    videoIds: string[],
    onProgress?: (
      current: number,
      total: number,
      success: number,
      failed: number
    ) => Promise<void>
  ): Promise<{ success: number; failed: number }> {
    console.log(
      `📚 Adding ${videoIds.length} tracks to playlist ${playlistId}`
    );

    let success = 0;
    let failed = 0;

    // Add tracks one by one with small delay to avoid rate limiting
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      const result = await this.addTrackToPlaylist(playlistId, videoId);
      if (result) {
        success++;
      } else {
        failed++;
      }

      // Call progress callback if provided
      if (onProgress) {
        await onProgress(i + 1, videoIds.length, success, failed);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(
      `📊 Batch add complete: ${success} succeeded, ${failed} failed`
    );
    return { success, failed };
  }

  /**
   * Get the public URL for a YouTube Music playlist
   */
  getPlaylistUrl(playlistId: string): string {
    return `https://music.youtube.com/playlist?list=${playlistId}`;
  }

  /**
   * Check if the YouTube Music service is running
   */
  async healthCheck(): Promise<boolean> {
    try {
      const headers = await this.getAuthHeaders(true); // Silent mode for health checks
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
        headers,
      });
      return response.status === 200;
    } catch (error) {
      console.error("❌ YouTube Music service health check failed:", error);
      return false;
    }
  }
}

export default new YTMusicService();
