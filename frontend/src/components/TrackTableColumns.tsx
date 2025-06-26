import { CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { SpotifyIcon, YouTubeMusicIcon } from "../icons";
import type { ConversionTrack } from "../types";

export const getTrackTableColumns = () => [
  {
    title: "Original Track",
    key: "original",
    width: "25%",
    render: (record: ConversionTrack) => (
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-sm text-foreground truncate">
          {record.originalTitle}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {record.originalArtist}
        </p>
      </div>
    ),
  },
  {
    title: "YouTube Music Match",
    key: "ytMatch",
    width: "25%",
    render: (record: ConversionTrack) => {
      if (record.ytMusicResult) {
        const artists = record.ytMusicResult.artists
          .map(artist => (typeof artist === "string" ? artist : artist.name))
          .join(", ");
        return (
          <div className="min-w-0 space-y-1">
            <p className="text-sm text-foreground truncate">
              {record.ytMusicResult.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">{artists}</p>
            {record.ytMusicResult.duration && (
              <p className="text-xs text-muted-foreground">
                {record.ytMusicResult.duration}
              </p>
            )}
          </div>
        );
      }
      return <p className="text-sm text-muted-foreground">No match found</p>;
    },
  },
  {
    title: "Status",
    key: "status",
    width: "15%",
    render: (record: ConversionTrack) => (
      <div className="space-y-1">
        {record.success ? (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Converted
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              Failed
            </span>
          </div>
        )}
        {record.error && (
          <p className="text-xs text-destructive mt-1">{record.error}</p>
        )}
      </div>
    ),
  },
  {
    title: "Links",
    key: "links",
    width: "35%",
    render: (record: ConversionTrack) => (
      <div className="flex items-center gap-4">
        {record.spotifyUrl && (
          <a
            href={record.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
          >
            <SpotifyIcon className="w-3 h-3" />
            <span className="text-xs font-medium">Spotify</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        {record.ytMusicResult && (
          <a
            href={`https://music.youtube.com/watch?v=${record.ytMusicResult.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
          >
            <YouTubeMusicIcon className="w-3 h-3" />
            <span className="text-xs font-medium">YouTube Music</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    ),
  },
];
