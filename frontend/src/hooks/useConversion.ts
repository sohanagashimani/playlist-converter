import { useState, useEffect } from "react";
import { message } from "antd";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import apiService from "../services/api";
import type {
  ConversionResult,
  ConversionProgress as ConversionProgressType,
} from "../types";

export const useConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [progress, setProgress] = useState<ConversionProgressType>({
    stage: "idle",
    progress: 0,
  });
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [showStatusChecker, setShowStatusChecker] = useState(false);

  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);
  useEffect(() => {
    const storedConversionId = localStorage.getItem("conversionId");
    if (storedConversionId) {
      setConversionId(storedConversionId);
      setShowStatusChecker(true);
    }
  }, []);

  useEffect(() => {
    if (conversionId) {
      if (unsubscribe) {
        unsubscribe();
      }
      const docRef = doc(db, "conversion-jobs", conversionId);
      const newUnsubscribe = onSnapshot(
        docRef,
        docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setProgress({
              stage: data.status || "idle",
              progress: data.progress || 0,
              message: data.result?.message,
              currentTrack: data.result?.currentTrack,
              processed: data.result?.processed,
              total: data.result?.total,
              tracksProcessed: data.result?.tracksProcessed,
              tracksToAdd: data.result?.tracksToAdd,
              tracksAdded: data.result?.tracksAdded,
              tracksFailed: data.result?.tracksFailed,
            });

            if (data.status === "completed" && data.result) {
              if (data.result?.cancelledAt) {
                console.warn("Conversion completed despite being cancelled");
                setProgress({ stage: "cancelled", progress: 0 });
                setShowStatusChecker(false);
                localStorage.removeItem("conversionId");
                message.warning(
                  "Conversion was cancelled but may have partially completed"
                );
              } else {
                setConversionResult(data.result);
                setShowStatusChecker(false);
                localStorage.removeItem("conversionId");
                message.success("Conversion completed successfully!");
              }
            }

            if (data.status === "cancelled") {
              setProgress({ stage: "cancelled", progress: 0 });
              setShowStatusChecker(false);
              localStorage.removeItem("conversionId");
              message.info("Conversion terminated");
            }

            if (data.status === "failed") {
              setProgress({ stage: "failed", progress: 0 });
              setShowStatusChecker(false);
              localStorage.removeItem("conversionId");
              message.error("Something went wrong. Please try again.");
            }
          } else {
            setShowStatusChecker(false);
            localStorage.removeItem("conversionId");
            message.error("Conversion not found or expired");
          }
        },
        () => {
          message.error("Something went wrong. Please try again.");
        }
      );

      setUnsubscribe(() => newUnsubscribe);
    } else {
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversionId]);

  const handleConversionStart = async (spotifyUrl: string) => {
    setIsConverting(true);
    setConversionResult(null);
    setProgress({ stage: "idle", progress: 0 });

    try {
      const existingConversionId = localStorage.getItem("conversionId");
      if (existingConversionId) {
        try {
          await apiService.cancelConversion(existingConversionId);
        } catch (error: unknown) {
          message.error("Something went wrong. Please try again.");
          throw error;
        }
      }

      const result = await apiService.startConversion({
        spotifyPlaylistUrl: spotifyUrl,
      });

      localStorage.setItem("conversionId", result.conversionId);
      setConversionId(result.conversionId);
      setShowStatusChecker(true);

      message.success(
        "Conversion started! You'll see real-time progress updates below."
      );
    } catch (error: unknown) {
      message.error("Something went wrong. Please try again.");
      throw error;
    } finally {
      setIsConverting(false);
    }
  };

  const handleReset = async () => {
    if (conversionId) {
      try {
        await apiService.cancelConversion(conversionId);
      } catch (error: unknown) {
        message.error("Something went wrong. Please try again.");
        throw error;
      }
    }

    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }

    setConversionResult(null);
    setProgress({ stage: "idle", progress: 0 });
    setConversionId(null);
    setShowStatusChecker(false);
    localStorage.removeItem("conversionId");
  };

  const handleViewResults = (result: ConversionResult) => {
    setConversionResult(result);
    setShowStatusChecker(false);
    localStorage.removeItem("conversionId");

    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }
  };

  const handleCheckExistingConversion = () => {
    const storedConversionId = localStorage.getItem("conversionId");
    if (storedConversionId) {
      setConversionId(storedConversionId);
      setShowStatusChecker(true);
    } else {
      message.info("No pending conversion found");
    }
  };

  return {
    // State
    isConverting,
    conversionResult,
    progress,
    conversionId,
    showStatusChecker,

    // Actions
    handleConversionStart,
    handleReset,
    handleViewResults,
    handleCheckExistingConversion,
  };
};
