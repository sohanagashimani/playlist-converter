import React from "react";
import { Button } from "@/components/ui";
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
    <div className="modern-card bg-card border border-border rounded-xl shadow-lg p-6">
      {/* Service Flow Indicator */}
      <div className="flex items-center justify-center space-x-6 mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md">
            <SpotifyIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">Spotify</span>
        </div>
        <ArrowRightIcon className="h-6 w-6 text-muted-foreground" />
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center shadow-md">
            <YouTubeMusicIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-foreground">YouTube Music</span>
        </div>
      </div>

      {/* Conversion Form */}
      {!isConverting && !conversionResult && !showStatusChecker && (
        <>
          <ConversionForm onSubmit={onConversionStart} />
          {/* Check Existing Conversion Button */}
          <div className="text-center mt-6">
            <Button variant="ghost" onClick={onCheckExistingConversion}>
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
