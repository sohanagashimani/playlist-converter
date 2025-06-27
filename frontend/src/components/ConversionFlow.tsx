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
      {/* Simple Service Flow Indicator */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 md:w-14 md:h-14 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <SpotifyIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <Text strong className="text-gray-800">
              Spotify
            </Text>
            <div className="text-xs text-gray-500">Your playlist</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          <ArrowRightIcon className="h-4 w-4 md:h-5 md:w-5" />
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 md:w-14 md:h-14 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
            <YouTubeMusicIcon className="w-5 h-5 md:w-7 md:h-7 text-white" />
          </div>
          <div>
            <Text strong className="text-gray-800">
              YouTube Music
            </Text>
            <div className="text-xs text-gray-500">Converted playlist</div>
          </div>
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
          progress={progress}
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
