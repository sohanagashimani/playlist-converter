import { useState } from "react";
import { Card, CardContent, Button, Progress, useToast } from "@/components/ui";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Loader2, AlertCircle } from "lucide-react";
import apiService from "../services/api";
import type { ConversionResult, ConversionProgress } from "../types";

interface ConversionStatusProps {
  conversionId: string;
  progress: ConversionProgress;
  onViewResults: (result: ConversionResult) => void;
  onReset: () => Promise<void>;
}

const ConversionStatus: React.FC<ConversionStatusProps> = ({
  conversionId,
  progress,
  onViewResults,
  onReset,
}) => {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiService.cancelConversion(conversionId);
      showToast("Conversion cancelled successfully", "info");
    } catch {
      showToast("Failed to cancel conversion", "error");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusMessage = () => {
    switch (progress.stage) {
      case "idle":
        return "Loading...";
      case "fetching-spotify":
        return "Fetching Spotify playlist data...";
      case "creating-playlist":
        return "Creating YouTube Music playlist...";
      case "converting-tracks":
        return progress.currentTrack
          ? `Searching: ${progress.currentTrack}`
          : progress.message || "Converting tracks...";
      case "completed":
        return "Conversion completed successfully!";
      case "failed":
      case "error":
        return "Something went wrong. Please try again.";
      case "cancelled":
        return "Conversion was cancelled";
      default:
        return `Status: ${progress.stage}`;
    }
  };

  const getStatusIcon = () => {
    switch (progress.stage) {
      case "completed":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case "cancelled":
        return <XMarkIcon className="h-6 w-6 text-orange-500" />;
      default:
        return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
    }
  };

  const getProgressPercent = () => {
    return progress.progress || 0;
  };

  const handleViewResults = () => {
    if (progress.stage === "completed") {
      // The result should be passed from the parent component
      // Since useConversion already handles this, we just need to trigger it
      onViewResults({} as ConversionResult); // Parent will handle the actual result
    }
  };

  const isConversionActive = () => {
    return !["completed", "failed", "cancelled", "idle"].includes(
      progress.stage
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary" />
            <div>
              <h4 className="font-medium">Conversion in Progress</h4>
              <p className="text-sm text-muted-foreground">
                Your playlist conversion is running in the background. Updates
                happen automatically in real-time!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="modern-card">
        <CardContent className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-semibold">Conversion Status</h3>
            <p className="text-sm text-muted-foreground">
              Conversion ID: {conversionId}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3">
              {getStatusIcon()}
              <span className="font-medium text-lg">{getStatusMessage()}</span>
            </div>

            <div className="space-y-2">
              <Progress value={getProgressPercent()} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{getProgressPercent()}% complete</span>
                {progress.processed !== undefined && progress.total && (
                  <span>
                    {progress.processed} / {progress.total} tracks
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center pt-4 border-t border-border">
            {progress.stage === "completed" && (
              <Button
                onClick={handleViewResults}
                className="flex items-center gap-2"
              >
                <EyeIcon className="h-4 w-4" />
                View Results
              </Button>
            )}

            <Button variant="outline" onClick={onReset}>
              Start New Conversion
            </Button>

            {isConversionActive() && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-2"
              >
                {cancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <XMarkIcon className="h-4 w-4" />
                )}
                {cancelling ? "Cancelling..." : "Cancel"}
              </Button>
            )}
          </div>

          {progress.stage === "failed" && (
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <XCircleIcon className="h-5 w-5 text-destructive" />
                  <div>
                    <h4 className="font-medium text-destructive">
                      Conversion Failed
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Something went wrong. Please try again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionStatus;
