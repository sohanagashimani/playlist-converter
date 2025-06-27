import { useState } from "react";
import { Card, Button, Typography, Progress, Alert, Spin, message } from "antd";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import apiService from "../services/api";
import type { ConversionResult, ConversionProgress } from "../types";

const { Title, Text } = Typography;

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
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiService.cancelConversion(conversionId);
    } catch {
      message.error("Something went wrong. Please try again.");
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
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case "cancelled":
        return <XMarkIcon className="h-5 w-5 text-orange-500" />;
      default:
        return <Spin size="small" />;
    }
  };

  const getProgressPercent = () => {
    return progress.progress || 0;
  };

  const handleViewResults = () => {
    if (progress.stage === "completed") {
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
      {/* Simple, nicer alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-1">
              Conversion in Progress
            </h3>
            <p className="text-sm text-blue-700">
              Your playlist is being converted. Stay tuned!
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-white rounded-lg shadow-md">
        <div className="space-y-6">
          <div className="text-center">
            <Title level={3}>Conversion Status</Title>
            <Text className="text-gray-500">Conversion ID: {conversionId}</Text>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <Text strong>{getStatusMessage()}</Text>
            </div>

            <Progress
              percent={getProgressPercent()}
              status={
                progress.stage === "failed"
                  ? "exception"
                  : progress.stage === "cancelled"
                  ? "exception"
                  : "active"
              }
              showInfo={true}
            />

            {/* Show track processing info - phase-aware */}
            {progress.stage === "converting-tracks" &&
            progress.message &&
            progress.message.includes("Adding") &&
            progress.tracksProcessed !== undefined &&
            progress.tracksToAdd ? (
              <Text className="text-sm text-gray-500">
                Adding {progress.tracksProcessed} of {progress.tracksToAdd}{" "}
                tracks to playlist
              </Text>
            ) : (
              progress.processed !== undefined &&
              progress.total && (
                <Text className="text-sm text-gray-500">
                  Processed {progress.processed} of {progress.total} tracks
                </Text>
              )
            )}
          </div>

          <div className="flex space-x-4 justify-center">
            {progress.stage === "completed" && (
              <Button
                type="primary"
                icon={<EyeIcon className="h-4 w-4" />}
                onClick={handleViewResults}
              >
                View Results
              </Button>
            )}

            <Button onClick={onReset}>Start New Conversion</Button>

            {isConversionActive() && (
              <Button
                type="primary"
                icon={<XMarkIcon className="h-4 w-4" />}
                onClick={handleCancel}
                loading={cancelling}
              >
                Cancel
              </Button>
            )}
          </div>

          {progress.stage === "failed" && (
            <Alert
              message="Conversion Failed"
              description="Something went wrong. Please try again."
              type="error"
              showIcon
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ConversionStatus;
