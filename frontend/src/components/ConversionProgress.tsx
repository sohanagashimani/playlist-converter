import { Progress, Typography, Card, Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import type { ConversionProgress as ConversionProgressType } from "../types";

const { Title, Text } = Typography;

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

  const getProgressColor = (stage: ConversionProgressType["stage"]) => {
    switch (stage) {
      case "completed":
        return "#52c41a";
      case "cancelled":
        return "#faad14";
      case "error":
        return "#ff4d4f";
      default:
        return "#1890ff";
    }
  };

  // Determine what to show in the current activity section
  const getCurrentActivity = () => {
    const {
      currentTrack,
      message,
      stage,
      tracksProcessed,
      tracksToAdd,
      tracksAdded,
    } = progress;

    // If we have a message that indicates adding to playlist, show enhanced feedback
    if (message && message.includes("Adding") && message.includes("playlist")) {
      let enhancedMessage = message;

      // Add success/failure details if available
      if (tracksProcessed && tracksToAdd && tracksAdded !== undefined) {
        const remaining = tracksToAdd - tracksProcessed;
        enhancedMessage = `Adding tracks to playlist... (${tracksProcessed}/${tracksToAdd})`;
        if (tracksAdded > 0) {
          enhancedMessage += ` - ${tracksAdded} added successfully`;
        }
        if (remaining > 0) {
          enhancedMessage += `, ${remaining} remaining`;
        }
      }

      return {
        label: "Current activity:",
        content: enhancedMessage,
      };
    }

    // If we're in converting tracks stage and have a currentTrack, show searching feedback
    if (
      stage === "converting-tracks" &&
      currentTrack &&
      (!message || !message.includes("Adding"))
    ) {
      return {
        label: "Currently searching:",
        content: currentTrack,
      };
    }

    // Show general message if available
    if (message) {
      return {
        label: "Status:",
        content: message,
      };
    }

    return null;
  };

  const antIcon = <LoadingOutlined style={{ fontSize: 24 }} spin />;
  const currentActivity = getCurrentActivity();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <div className="mb-6">
          {progress.stage !== "completed" && progress.stage !== "error" && (
            <Spin indicator={antIcon} />
          )}
          <Title level={3} className="mt-4 mb-2">
            {getStageText(progress.stage)}
          </Title>
          {progress.message && (
            <Text className="text-gray-600">{progress.message}</Text>
          )}
        </div>

        <Progress
          percent={progress.progress}
          status={
            progress.stage === "error"
              ? "exception"
              : progress.stage === "completed"
              ? "success"
              : progress.stage === "cancelled"
              ? "exception"
              : "active"
          }
          strokeColor={getProgressColor(progress.stage)}
          size="default"
          className="mb-4"
        />

        {currentActivity && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <Text strong>{currentActivity.label}</Text>
            <br />
            <Text className="text-gray-600">{currentActivity.content}</Text>
          </div>
        )}

        <div className="mt-6">
          <Text type="secondary">
            This may take a few minutes depending on the playlist size...
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ConversionProgress;
