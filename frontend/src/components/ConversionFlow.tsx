import React from "react";
import { Typography, Button } from "antd";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { SpotifyIcon, YouTubeMusicIcon } from "../icons";
import ConversionForm from "./ConversionForm";
import ConversionProgress from "./ConversionProgress";
import ConversionStatus from "./ConversionStatus";
import ConversionResults from "./ConversionResults";
import type {
  ConversionResult,
  ConversionProgress as ConversionProgressType,
} from "../types";

const { Text } = Typography;

interface ConversionFlowProps {
  isConverting: boolean;
  conversionResult: ConversionResult | null;
  showStatusChecker: boolean;
  conversionId: string | null;
  progress: ConversionProgressType;
  onConversionStart: (spotifyUrl: string) => Promise<void>;
  onViewResults: (result: ConversionResult) => void;
  onReset: () => Promise<void>;
  onCheckExistingConversion: () => void;
}

const ConversionFlow: React.FC<ConversionFlowProps> = ({
  isConverting,
  conversionResult,
  showStatusChecker,
  conversionId,
  progress,
  onConversionStart,
  onViewResults,
  onReset,
  onCheckExistingConversion,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 md:p-6 hover:shadow-lg transition-shadow p-4">
      {/* Service Flow Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <SpotifyIcon className="w-5 h-5 text-white" />
          </div>
          <Text strong>Spotify</Text>
        </div>
        <ArrowRightIcon className="h-6 w-6 text-gray-400" />
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
            <YouTubeMusicIcon className="w-5 h-5 text-white" />
          </div>
          <Text strong>YouTube Music</Text>
        </div>
      </div>

      {/* Conversion Form */}
      {!isConverting && !conversionResult && !showStatusChecker && (
        <>
          <ConversionForm onSubmit={onConversionStart} />
          {/* Check Existing Conversion Button */}
          <div className="text-center mt-4">
            <Button type="link" onClick={onCheckExistingConversion}>
              Check existing conversion status
            </Button>
          </div>
        </>
      )}

      {/* Progress (only for immediate feedback) */}
      {isConverting && <ConversionProgress progress={progress} />}

      {/* Status Checker */}
      {showStatusChecker && conversionId && (
        <ConversionStatus
          conversionId={conversionId}
          onViewResults={onViewResults}
          onReset={onReset}
        />
      )}

      {/* Results */}
      {conversionResult && (
        <ConversionResults result={conversionResult} onReset={onReset} />
      )}
    </div>
  );
};

export default ConversionFlow;
