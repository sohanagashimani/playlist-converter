import { useState, useEffect } from "react";
import { Card, Button, Typography, Progress, Alert, Spin, message } from "antd";
import {
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import apiService from "../services/api";
import type { ConversionResult } from "../types";

const { Title, Text } = Typography;

interface ConversionStatusProps {
  conversionId: string;
  onViewResults: (result: ConversionResult) => void;
  onReset: () => Promise<void>;
}

const ConversionStatus: React.FC<ConversionStatusProps> = ({
  conversionId,
  onViewResults,
  onReset,
}) => {
  const [status, setStatus] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = async () => {
    if (!conversionId) return;

    try {
      const statusData = await apiService.getConversionStatus(conversionId);
      setStatus(statusData);

      // Stop auto-refresh if conversion is completed, failed, or cancelled
      if (
        statusData.status === "completed" ||
        statusData.status === "failed" ||
        statusData.status === "cancelled"
      ) {
        setAutoRefresh(false);

        if (statusData.status === "completed" && statusData.result) {
          message.success(
            'Conversion completed! Click "View Results" to see your playlist.'
          );
        } else if (statusData.status === "failed") {
          message.error("Something went wrong. Please try again.");
        }
      }
    } catch {
      message.error("Something went wrong. Please try again.");
      setAutoRefresh(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiService.cancelConversion(conversionId);
      setAutoRefresh(false);
      await fetchStatus(); // Refresh to show cancelled status
    } catch {
      message.error("Something went wrong. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversionId]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStatus, 3500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, conversionId]);

  const getStatusMessage = () => {
    if (!status) return "Loading...";

    switch (status.status) {
      case "started":
        return "Conversion started...";
      case "fetching_spotify_data":
        return "Fetching Spotify playlist data...";
      case "creating_playlist":
        return "Creating YouTube Music playlist...";
      case "searching_tracks":
        return status.result?.currentTrack
          ? `Searching: ${status.result.currentTrack}`
          : "Searching for tracks on YouTube Music...";
      case "adding_to_playlist":
        if (status.result?.message) {
          return status.result.message;
        }
        return status.result?.tracksToAdd
          ? `Adding ${status.result.tracksToAdd} tracks to YouTube Music playlist...`
          : "Adding tracks to YouTube Music playlist...";
      case "completed":
        return "Conversion completed successfully!";
      case "failed":
        return "Something went wrong. Please try again.";
      case "cancelled":
        return "Conversion was cancelled";
      default:
        return `Status: ${status.status}`;
    }
  };

  const getStatusIcon = () => {
    if (!status) return <Spin size="small" />;

    switch (status.status) {
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
    return status?.progress || 0;
  };

  const handleViewResults = () => {
    if (status?.result && status.status === "completed") {
      onViewResults(status.result);
    }
  };

  const isConversionActive = () => {
    return (
      status && !["completed", "failed", "cancelled"].includes(status.status)
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Alert
        message="Conversion in Progress"
        description="Your playlist conversion is running in the background. Updates happen automatically in real-time!"
        type="info"
        showIcon
        className="mb-6"
      />

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
                status?.status === "failed"
                  ? "exception"
                  : status?.status === "cancelled"
                  ? "exception"
                  : "active"
              }
              showInfo={true}
            />

            {/* Show track processing info during search phase */}
            {status?.result?.processed !== undefined &&
              status?.result?.total && (
                <Text className="text-sm text-gray-500">
                  Processed {status.result.processed} of {status.result.total}{" "}
                  tracks
                </Text>
              )}

            {/* Show track addition info during adding phase */}
            {status?.status === "adding_to_playlist" &&
              status?.result?.tracksAdded !== undefined && (
                <Text className="text-sm text-gray-500">
                  Added {status.result.tracksAdded} tracks to playlist
                  {status.result.tracksFailed > 0 &&
                    ` (${status.result.tracksFailed} failed)`}
                </Text>
              )}

            {/* Show tracks to be added info */}
            {status?.status === "adding_to_playlist" &&
              status?.result?.tracksToAdd !== undefined &&
              status?.result?.tracksAdded === undefined && (
                <Text className="text-sm text-gray-500">
                  {status.result.tracksToAdd} tracks ready to add
                </Text>
              )}
          </div>

          <div className="flex space-x-4 justify-center">
            {status?.status === "completed" && (
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

          {status?.status === "failed" && (
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
