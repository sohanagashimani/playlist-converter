import { Progress, Card, CardContent } from "@/components/ui";
import { Loader2 } from "lucide-react";
import type { ConversionProgress as ConversionProgressType } from "../types";

interface ConversionProgressProps {
  progress: ConversionProgressType;
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress,
}) => {
  const getStageText = (stage: ConversionProgressType["stage"]) => {
    switch (stage) {
      case "fetching-spotify":
        return "Fetching Spotify Playlist";
      case "creating-playlist":
        return "Creating YouTube Music Playlist";
      case "converting-tracks":
        return "Converting Tracks";
      case "completed":
        return "Conversion Completed";
      case "cancelled":
        return "Conversion Cancelled";
      case "error":
        return "Conversion Failed";
      default:
        return "Initializing";
    }
  };

  const isLoading =
    progress.stage !== "completed" &&
    progress.stage !== "error" &&
    progress.stage !== "cancelled";

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="modern-card">
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-3">
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <h3 className="text-xl font-medium text-foreground">
              {getStageText(progress.stage)}
            </h3>
            {progress.message && (
              <p className="text-sm text-muted-foreground">
                {progress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Progress value={progress.progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.progress}% complete</span>
              <span>
                {progress.progress === 100 ? "Done!" : "Processing..."}
              </span>
            </div>
          </div>

          {progress.currentTrack && (
            <Card className="bg-muted/30 border-border/50">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-foreground mb-1">
                  Currently processing:
                </p>
                <p className="text-xs text-muted-foreground">
                  {progress.currentTrack}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              This may take a few minutes depending on the playlist size...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionProgress;
