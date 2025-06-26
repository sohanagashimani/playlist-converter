import React from "react";
import { Typography, Divider } from "antd";

const { Text } = Typography;

const AppFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-center">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <Text className="text-gray-500">
          TuneSwap © 2025. Swap your tunes, enjoy everywhere.
        </Text>
        <Divider type="vertical" />
        <Text className="text-gray-500">
          Built with React, TypeScript, and lots of ♪
        </Text>
      </div>
    </footer>
  );
};

export default AppFooter;
