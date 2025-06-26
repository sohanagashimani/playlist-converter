import { useState, useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import apiService from "../services/api";
import { useToast } from "@/components/ui";
import type {
  ConversionResult,
  ConversionProgress as ConversionProgressType,
} from "../types";

export const useConversion = () => {
  const { showToast } = useToast();
  const [isConverting, setIsConverting] = useState(false);
  const [conversionResult, setConversionResult] =
    useState<ConversionResult | null>(null);
  const [progress, setProgress] = useState<ConversionProgressType>({
    stage: "idle",
    progress: 0,
  });
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [showStatusChecker, setShowStatusChecker] = useState(false);

  // Firestore listener - using function type instead of Unsubscribe
  const [unsubscribe, setUnsubscribe] = useState<(() => void) | null>(null);

  // Check for stored conversion ID on app load
  useEffect(() => {
    const storedConversionId = localStorage.getItem("conversionId");
    if (storedConversionId) {
      setConversionId(storedConversionId);
      setShowStatusChecker(true);
    }
  }, []);

  // Set up real-time listener when conversionId changes
  useEffect(() => {
    if (conversionId) {
      // Clean up existing listener
      if (unsubscribe) {
        unsubscribe();
      }

      // Create new listener
      const docRef = doc(db, "conversion-jobs", conversionId);
      const newUnsubscribe = onSnapshot(
        docRef,
        docSnapshot => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();

            // Update progress
            setProgress({
              stage: data.status || "idle",
              progress: data.progress || 0,
              message: data.result?.message,
              currentTrack: data.result?.currentTrack,
              processed: data.result?.processed,
              total: data.result?.total,
            });

            // Handle completed conversion
            if (data.status === "completed" && data.result) {
              // Check if this conversion was supposed to be cancelled
              if (data.result?.cancelledAt) {
                // This should not happen, but handle gracefully
                console.warn("Conversion completed despite being cancelled");
                setProgress({ stage: "cancelled", progress: 0 });
                setShowStatusChecker(false);
                localStorage.removeItem("conversionId");
                showToast(
                  "Conversion was cancelled but may have partially completed",
                  "warning"
                );
              } else {
                setConversionResult(data.result);
                setShowStatusChecker(false);
                localStorage.removeItem("conversionId");
                showToast("Conversion completed successfully!", "success");
              }
            }

            // Handle cancelled conversion
            if (data.status === "cancelled") {
              setProgress({ stage: "cancelled", progress: 0 });
              setShowStatusChecker(false);
              localStorage.removeItem("conversionId");
              showToast("Conversion was cancelled", "info");
            }

            // Handle failed conversion
            if (data.status === "failed") {
              setProgress({ stage: "failed", progress: 0 });
              setShowStatusChecker(false);
              localStorage.removeItem("conversionId");
              showToast("Something went wrong. Please try again.", "error");
            }
          } else {
            setShowStatusChecker(false);
            localStorage.removeItem("conversionId");
            showToast("Conversion not found or expired", "error");
          }
        },
        () => {
          showToast("Something went wrong. Please try again.", "error");
        }
      );

      setUnsubscribe(() => newUnsubscribe);
    } else {
      // Clean up listener if no conversionId
      if (unsubscribe) {
        unsubscribe();
        setUnsubscribe(null);
      }
    }

    // Cleanup on unmount or conversionId change
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
      // Cancel any existing conversion first
      const existingConversionId = localStorage.getItem("conversionId");
      if (existingConversionId) {
        try {
          await apiService.cancelConversion(existingConversionId);
        } catch (error: unknown) {
          showToast("Something went wrong. Please try again.", "error");
          throw error;
          // Continue anyway - maybe it was already completed/failed
        }
      }

      // Start new async conversion
      const result = await apiService.startConversion({
        spotifyPlaylistUrl: spotifyUrl,
      });

      // Store conversion ID and set up real-time listener
      localStorage.setItem("conversionId", result.conversionId);
      setConversionId(result.conversionId);
      setShowStatusChecker(true);

      showToast(
        "Conversion started! You'll see real-time progress updates below.",
        "success"
      );
    } catch (error: unknown) {
      showToast("Something went wrong. Please try again.", "error");
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
        showToast("Something went wrong. Please try again.", "error");
        throw error;
      }
    }

    // Clean up listener
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

    // Clean up listener
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
      showToast("No existing conversion found", "info");
    }
  };

  return {
    isConverting,
    conversionResult,
    progress,
    conversionId,
    showStatusChecker,
    handleConversionStart,
    handleReset,
    handleViewResults,
    handleCheckExistingConversion,
  };
};
