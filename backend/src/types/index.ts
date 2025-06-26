export interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  external_urls: {
    spotify: string;
  };
  tracks: {
    total: number;
    items: Array<{
      track: SpotifyTrack;
    }>;
  };
}

export interface SpotifyAccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface YTMusicSearchResult {
  videoId: string;
  title: string;
  artists: Array<{ name: string }>;
  duration?: string;
}

export interface YTMusicPlaylist {
  playlistId: string;
  title: string;
  description?: string;
  url: string;
}

export interface ConversionTrack {
  originalTitle: string;
  originalArtist: string;
  spotifyUrl: string;
  ytMusicResult?: YTMusicSearchResult;
  success: boolean;
  error?: string;
}

export interface ConversionResult {
  spotifyPlaylistUrl: string;
  ytMusicPlaylistUrl?: string;
  ytMusicPlaylist?: YTMusicPlaylist;
  tracks: ConversionTrack[];
  totalTracks: number;
  successfulTracks: number;
  failedTracks: number;
  conversionId: string;
  timestamp: string;
}

export interface ConversionRequest {
  spotifyPlaylistUrl: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
