import React from "react";
import { Card, CardContent } from "@/components/ui";
import {
  CheckCircle,
  XCircle,
  Play,
  Music,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import { SpotifyIcon, YouTubeMusicIcon } from "../icons";
import type { ConversionTrack } from "../types";

interface TrackCardProps {
  track: ConversionTrack;
  index: number;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  const cardKey = `${track.originalTitle}-${track.originalArtist}-${index}`;

  return (
    <Card
      key={cardKey}
      className={`
        modern-card
        ${
          track.success
            ? "border-l-4 border-l-green-500"
            : "border-l-4 border-l-red-500"
        }
      `}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header with status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <Music className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate">
                {track.originalTitle}
              </h4>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span className="truncate">{track.originalArtist}</span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0">
            {track.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* YouTube Music Result */}
        {track.ytMusicResult ? (
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-start space-x-3">
                <Play className="h-4 w-4 text-red-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-1">
                  <h5 className="font-medium text-foreground truncate">
                    {track.ytMusicResult.title}
                  </h5>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">
                      {track.ytMusicResult.artists
                        .map(artist =>
                          typeof artist === "string" ? artist : artist.name
                        )
                        .join(", ")}
                    </span>
                  </div>
                  {track.ytMusicResult.duration && (
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{track.ytMusicResult.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-3 text-center">
              <XCircle className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No match found</p>
              {track.error && (
                <p className="text-xs text-destructive mt-1">{track.error}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Links and Status */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center space-x-4">
            {track.spotifyUrl && (
              <a
                href={track.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
              >
                <SpotifyIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Spotify</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {track.ytMusicResult && (
              <a
                href={`https://music.youtube.com/watch?v=${track.ytMusicResult.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <YouTubeMusicIcon className="w-4 h-4" />
                <span className="text-sm font-medium">YouTube Music</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              track.success
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-red-500/10 text-red-700 dark:text-red-400"
            }`}
          >
            {track.success ? "Converted" : "Failed"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackCard;
