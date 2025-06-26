import { useState, useEffect } from "react";
import { Badge, Tooltip, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
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

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    if (status.loading) return "processing";
    if (status.backend && status.ytmusicService) return "success";
    if (status.backend && !status.ytmusicService) return "warning";
    return "error";
  };

  const getStatusText = () => {
    if (status.loading) return "Checking services...";
    if (status.backend && status.ytmusicService)
      return "All services operational";
    if (status.backend && !status.ytmusicService)
      return "YouTube Music service unavailable";
    return "Services unavailable";
  };

  return (
    <div className="flex items-center space-x-2">
      <Tooltip
        title={
          <div className="space-y-1">
            <div>
              Backend API: {status.backend ? "✅ Online" : "❌ Offline"}
            </div>
            <div>
              YouTube Music Service:{" "}
              {status.ytmusicService ? "✅ Online" : "❌ Offline"}
            </div>
          </div>
        }
      >
        <Badge status={getOverallStatus()} text={getStatusText()} />
      </Tooltip>

      <Button
        type="text"
        size="small"
        icon={<ReloadOutlined spin={status.loading} />}
        onClick={checkHealth}
        className="text-gray-500"
      />
    </div>
  );
};

export default HealthStatus;
