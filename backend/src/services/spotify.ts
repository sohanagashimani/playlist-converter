import axios from "axios";
import dotenv from "dotenv";
import { SpotifyAccessToken, SpotifyPlaylist } from "../types";

dotenv.config();

class SpotifyService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = "https://api.spotify.com/v1";
  private tokenUrl = "https://accounts.spotify.com/api/token";
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID!;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("Spotify credentials not found in environment variables");
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(
        `${this.clientId}:${this.clientSecret}`
      ).toString("base64");

      const response = await axios.post<SpotifyAccessToken>(
        this.tokenUrl,
        "grant_type=client_credentials",
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const { access_token, expires_in } = response.data;
      this.accessToken = access_token;
      this.tokenExpiresAt = Date.now() + (expires_in - 60) * 1000; // Refresh 60 seconds early

      console.log("✅ Spotify access token obtained");
      return access_token;
    } catch (error: any) {
      console.error(
        "❌ Spotify authentication failed:",
        error.response?.data || error.message
      );
      throw new Error(
        `Spotify authentication failed: ${
          error.response?.data?.error_description || error.message
        }`
      );
    }
  }

  private extractPlaylistId(url: string): string {
    const regex = /(?:playlist\/|playlist\/)([a-zA-Z0-9]+)/;
    const match = url.match(regex);

    if (!match) {
      throw new Error(
        "Invalid playlist URL. Please provide a valid Spotify playlist URL."
      );
    }

    return match[1];
  }

  async getPlaylist(playlistUrl: string): Promise<SpotifyPlaylist> {
    try {
      const playlistId = this.extractPlaylistId(playlistUrl);
      const token = await this.getAccessToken();

      console.log(`🎵 Fetching Spotify playlist: ${playlistId}`);

      const response = await axios.get<SpotifyPlaylist>(
        `${this.baseUrl}/playlists/${playlistId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            fields:
              "id,name,description,external_urls,tracks.total,tracks.items(track(name,artists(name),duration_ms,external_urls))",
            limit: 50,
          },
        }
      );

      const playlist = response.data;

      if (playlist.tracks.total > 50) {
        await this.getAllPlaylistTracks(playlist, token);
      }

      console.log(
        `✅ Retrieved ${playlist.tracks.items.length} tracks from playlist "${playlist.name}"`
      );
      return playlist;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(
          "Playlist not found. Please check the URL and ensure the playlist is public."
        );
      }
      if (error.response?.status === 403) {
        throw new Error("Access denied. Please ensure the playlist is public.");
      }

      console.error(
        "❌ Error fetching Spotify playlist:",
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to fetch Spotify playlist: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  }

  private async getAllPlaylistTracks(
    playlist: SpotifyPlaylist,
    token: string
  ): Promise<void> {
    const allTracks = [...playlist.tracks.items];
    let offset = 50;

    while (offset < playlist.tracks.total) {
      try {
        const response = await axios.get(
          `${this.baseUrl}/playlists/${playlist.id}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              fields:
                "items(track(name,artists(name),duration_ms,external_urls))",
              limit: 50,
              offset,
            },
          }
        );

        allTracks.push(...response.data.items);
        offset += 50;
      } catch (error) {
        console.error(`❌ Error fetching tracks at offset ${offset}:`, error);
        break;
      }
    }

    playlist.tracks.items = allTracks;
  }

  getSimplifiedTracks(
    playlist: SpotifyPlaylist
  ): Array<{ title: string; artist: string; spotifyUrl: string }> {
    return playlist.tracks.items
      .filter(item => item.track && item.track.name) // Filter out null/invalid tracks
      .map(item => ({
        title: item.track.name,
        artist: item.track.artists.map(artist => artist.name).join(", "),
        spotifyUrl: item.track.external_urls.spotify,
      }));
  }
}

export default new SpotifyService();
