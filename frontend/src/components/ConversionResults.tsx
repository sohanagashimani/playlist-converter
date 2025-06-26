import React, { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
} from "@/components/ui";
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  RotateCcw,
  Search,
  Grid3X3,
  List,
  Copy,
} from "lucide-react";
import TrackCard from "./TrackCard";
import { getTrackTableColumns } from "./TrackTableColumns";
import type { ConversionResult } from "../types";

interface ConversionResultsProps {
  result: ConversionResult;
  onReset: () => Promise<void>;
}

const ConversionResults: React.FC<ConversionResultsProps> = ({
  result,
  onReset,
}) => {
  // Smart default: cards for small playlists (≤20 tracks), table for large ones
  const defaultView = result.totalTracks <= 20 ? "cards" : "table";

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultView === "cards" ? 12 : 20);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">(defaultView);

  // Filter tracks based on search term
  const filteredTracks = result.tracks.filter(
    track =>
      track.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.originalArtist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (track.ytMusicResult?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Paginate filtered tracks
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTracks = filteredTracks.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTracks.length / pageSize);

  const successRate = Math.round(
    (result.successfulTracks / result.totalTracks) * 100
  );

  // Handle view mode change
  const handleViewModeChange = (mode: "cards" | "table") => {
    setViewMode(mode);
    // Adjust page size for different views
    setPageSize(mode === "cards" ? 12 : 20);
    setCurrentPage(1);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                Conversion Completed!
              </h3>
              <div className="text-green-700 dark:text-green-300">
                <p>
                  Your playlist has been successfully converted to YouTube
                  Music.
                  {result.ytMusicPlaylistUrl && (
                    <>
                      {" "}
                      <a
                        href={result.ytMusicPlaylistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline hover:no-underline inline-flex items-center gap-1"
                      >
                        Click here to open your new YouTube Music playlist
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card className="modern-card">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">
                {result.totalTracks}
              </div>
              <div className="text-sm text-muted-foreground">Total Tracks</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
                {result.successfulTracks}
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">Successful</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
                {result.failedTracks}
                <XCircle className="h-5 w-5" />
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="space-y-2">
              <div
                className={`text-2xl font-bold ${
                  successRate >= 80
                    ? "text-green-600"
                    : successRate >= 60
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {successRate}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Playlist Information */}
      {result.ytMusicPlaylist && (
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>YouTube Music Playlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Title: </span>
              <span>{result.ytMusicPlaylist.title}</span>
            </div>
            {result.ytMusicPlaylist.description && (
              <div>
                <span className="font-medium">Description: </span>
                <span className="text-muted-foreground">
                  {result.ytMusicPlaylist.description}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-medium">Playlist URL: </span>
              <a
                href={result.ytMusicPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                {result.ytMusicPlaylistUrl}
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result.ytMusicPlaylistUrl)}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Track Details */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <CardTitle>
              Track Conversion Details ({result.totalTracks} tracks)
            </CardTitle>
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Convert Another Playlist
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks..."
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                View:
              </span>
              <div className="flex rounded-md border border-border">
                <Button
                  variant={viewMode === "cards" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("cards")}
                  className="rounded-r-none flex items-center gap-2"
                >
                  <Grid3X3 className="h-4 w-4" />
                  Cards
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => handleViewModeChange("table")}
                  className="rounded-l-none flex items-center gap-2"
                >
                  <List className="h-4 w-4" />
                  Table
                </Button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          {paginatedTracks.length > 0 ? (
            <>
              {viewMode === "cards" ? (
                /* Card Grid View */
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {paginatedTracks.map((track, index) => (
                    <TrackCard
                      key={`${track.originalTitle}-${track.originalArtist}-${
                        startIndex + index
                      }`}
                      track={track}
                      index={startIndex + index}
                    />
                  ))}
                </div>
              ) : (
                /* Simple Table View - simplified for now */
                <div className="space-y-2 mb-6">
                  {paginatedTracks.map((track, index) => (
                    <div
                      key={`${track.originalTitle}-${track.originalArtist}-${
                        startIndex + index
                      }`}
                      className={`p-4 rounded-lg border ${
                        track.success
                          ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div>
                          <div className="font-medium">
                            {track.originalTitle}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {track.originalArtist}
                          </div>
                        </div>
                        <div>
                          {track.ytMusicResult ? (
                            <>
                              <div className="font-medium">
                                {track.ytMusicResult.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {track.ytMusicResult.artists
                                  .map(artist =>
                                    typeof artist === "string"
                                      ? artist
                                      : artist.name
                                  )
                                  .join(", ")}
                              </div>
                            </>
                          ) : (
                            <div className="text-muted-foreground">
                              No match found
                            </div>
                          )}
                        </div>
                        <div>
                          <Badge
                            variant={track.success ? "default" : "destructive"}
                            className="flex items-center gap-1 w-fit"
                          >
                            {track.success ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <XCircle className="h-3 w-3" />
                            )}
                            {track.success ? "Converted" : "Failed"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          {track.spotifyUrl && (
                            <a
                              href={track.spotifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          {track.ytMusicResult && (
                            <a
                              href={`https://music.youtube.com/watch?v=${track.ytMusicResult.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-red-600 hover:text-red-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Simple Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchTerm
                  ? `No tracks found matching "${searchTerm}"`
                  : "No tracks to display"}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Info */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-lg">Conversion Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Conversion ID: </span>
              <code className="px-2 py-1 bg-muted rounded text-xs">
                {result.conversionId}
              </code>
            </div>
            <div>
              <span className="font-medium">Completed: </span>
              <span>{new Date(result.timestamp).toLocaleString()}</span>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium">Original Playlist: </span>
              <a
                href={result.spotifyPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline inline-flex items-center gap-1"
              >
                Open in Spotify <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionResults;
