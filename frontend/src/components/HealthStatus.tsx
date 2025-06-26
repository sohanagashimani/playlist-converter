import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import apiService from "../services/api";

const HealthStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    backend: boolean;
    ytmusicService: boolean;
    loading: boolean;
  }>({
    backend: false,
    ytmusicService: false,
    loading: true,
  });

  const checkHealth = async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const healthData = await apiService.healthCheck();
      setStatus({
        backend: healthData.backend,
        ytmusicService: healthData.ytmusicService,
        loading: false,
      });
    } catch {
      setStatus({
        backend: false,
        ytmusicService: false,
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const getStatusIcon = () => {
    if (status.loading) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (status.backend && status.ytmusicService)
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status.backend && !status.ytmusicService)
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (status.loading) return "Checking...";
    if (status.backend && status.ytmusicService) return "All services online";
    if (status.backend && !status.ytmusicService)
      return "YouTube Music unavailable";
    return "Services offline";
  };

  const getStatusColor = () => {
    if (status.loading) return "text-muted-foreground";
    if (status.backend && status.ytmusicService) return "text-green-600";
    if (status.backend && !status.ytmusicService) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center space-x-3 text-sm">
      <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="hidden lg:inline">{getStatusText()}</span>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={checkHealth}
        disabled={status.loading}
        className="h-8 w-8 p-0"
      >
        <RefreshCw
          className={`h-4 w-4 ${status.loading ? "animate-spin" : ""}`}
        />
      </Button>
    </div>
  );
};

export default HealthStatus;
