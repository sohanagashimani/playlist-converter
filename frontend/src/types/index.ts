export interface ConversionTrack {
  originalTitle: string;
  originalArtist: string;
  spotifyUrl: string;
  ytMusicResult?: {
    videoId: string;
    title: string;
    artists: Array<{ name: string }>;
    duration?: string;
  };
  success: boolean;
  error?: string;
}

export interface YTMusicPlaylist {
  playlistId: string;
  title: string;
  description?: string;
  url: string;
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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ConversionRequest {
  spotifyPlaylistUrl: string;
}

export interface ConversionProgress {
  stage:
    | "idle"
    | "fetching-spotify"
    | "creating-playlist"
    | "converting-tracks"
    | "completed"
    | "failed"
    | "cancelled"
    | "error";
  progress: number;
  message?: string;
  currentTrack?: string;
  processed?: number;
  total?: number;
  tracksProcessed?: number;
  tracksToAdd?: number;
  tracksAdded?: number;
  tracksFailed?: number;
}
