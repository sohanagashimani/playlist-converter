import React from "react";
import { Typography } from "antd";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import HealthStatus from "./HealthStatus";

const { Title, Text } = Typography;

const AppHeader: React.FC = () => {
  return (
    <header className="w-full bg-white shadow-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between h-full px-4 py-2">
        <div className="flex items-center space-x-3">
          <div className="tuneswap-icon-bg p-2 rounded-lg">
            <MusicalNoteIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <Title level={3} className="!mb-0 gradient-text">
              TuneSwap
            </Title>
            <Text className="text-gray-500 text-sm">
              Spotify → YouTube Music
            </Text>
          </div>
        </div>
        <div className="hidden md:block">
          <HealthStatus />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
