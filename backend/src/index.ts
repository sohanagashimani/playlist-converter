import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import playlistRoutes from "./routes/playlist";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/playlist", playlistRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown handling
async function gracefulShutdown(signal: string) {
  console.log(`🛑 Received ${signal}, initiating graceful shutdown...`);

  try {
    // Import here to avoid circular dependencies
    const conversionJobService = (await import("./services/conversionJob"))
      .default;
    const firestoreService = (await import("./services/firestore")).default;

    // Get all active conversions
    const activeJobs = await firestoreService.getActiveJobs();
    console.log(
      `📊 Found ${activeJobs.length} active conversion(s) to mark as interrupted`
    );

    // Mark all active conversions as interrupted
    for (const jobId of activeJobs) {
      try {
        await firestoreService.updateConversionStatus(jobId, "interrupted", 0, {
          error: "Service restarted during conversion",
          interruptedAt: new Date().toISOString(),
          reason: "deployment",
        });

        // Remove from active jobs
        await firestoreService.removeActiveJob(jobId);

        console.log(`⏹️ Marked conversion ${jobId} as interrupted`);
      } catch (error) {
        console.error(`❌ Failed to cleanup conversion ${jobId}:`, error);
      }
    }

    // Cancel any in-memory conversion tracking
    activeJobs.forEach(jobId => {
      conversionJobService.cancelConversion(jobId);
    });

    console.log(`✅ Cleanup completed for ${activeJobs.length} conversion(s)`);
  } catch (error) {
    console.error(`❌ Error during graceful shutdown:`, error);
  }

  // Close the server
  server.close(() => {
    console.log(`🔌 HTTP server closed`);
    process.exit(0);
  });

  // Force exit after 10 seconds if server doesn't close gracefully
  setTimeout(() => {
    console.error(`⚠️ Forcing exit after timeout`);
    process.exit(1);
  }, 10000);
}

// Handle different shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGUSR2", () => gracefulShutdown("SIGUSR2")); // Nodemon restart

// Handle uncaught exceptions
process.on("uncaughtException", error => {
  console.error(`💥 Uncaught Exception:`, error);
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(`💥 Unhandled Rejection at:`, promise, "reason:", reason);
  gracefulShutdown("UNHANDLED_REJECTION");
});
