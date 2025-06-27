import axios from "axios";
import { YTMusicSearchResult, YTMusicPlaylist } from "../types";

class YTMusicService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.YTMUSIC_SERVICE_URL || "http://localhost:8000";
  }

  async searchTrack(
    title: string,
    artist: string
  ): Promise<YTMusicSearchResult | null> {
    try {
      const searchQuery = `${title} ${artist}`.trim();
      console.log(`🔍 Searching YouTube Music for: "${searchQuery}"`);

      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query: searchQuery,
          title,
          artist,
        },
        {}
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

  async createPlaylistWithTracks(
    title: string,
    videoIds: string[],
    description?: string,
    conversionId?: string
  ): Promise<YTMusicPlaylist & { tracksAdded: number }> {
    try {
      console.log(
        `📝 Creating YouTube Music playlist with ${videoIds.length} tracks: "${title}"`
      );

      const response = await axios.post(
        `${this.baseUrl}/create-playlist-with-tracks`,
        {
          title,
          description:
            description ||
            `Converted from Spotify playlist - ${new Date().toLocaleDateString()}`,
          videoIds,
          conversionId,
        }
      );

      if (response.data.success && response.data.playlist) {
        console.log(
          `✅ Created playlist with ${response.data.playlist.tracksAdded} tracks - ID: ${response.data.playlist.playlistId}`
        );
        return response.data.playlist;
      } else {
        throw new Error(
          `Failed to create playlist with tracks: ${
            response.data.error || "Unknown error"
          }`
        );
      }
    } catch (error: any) {
      if (error.response?.status === 409 && error.response?.data?.cancelled) {
        console.log("🛑 Playlist creation aborted - conversion was cancelled");
        throw new Error("CONVERSION_CANCELLED");
      }

      console.error(
        "❌ Error creating YouTube Music playlist with tracks:",
        error.message
      );
      throw new Error(
        `YTMusic playlist creation with tracks failed: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  }

  getPlaylistUrl(playlistId: string): string {
    return `https://music.youtube.com/playlist?list=${playlistId}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      console.error("❌ YouTube Music service health check failed:", error);
      return false;
    }
  }
}

export default new YTMusicService();
