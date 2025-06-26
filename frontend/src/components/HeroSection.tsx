import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-6">
      <Title level={1} className="gradient-text !mb-2">
        Welcome to TuneSwap
      </Title>
      <Title level={2} className="!mb-3 !text-gray-700">
        Convert Spotify Playlists to YouTube Music
      </Title>
      <Text className="text-gray-600 block max-w-xl mx-auto">
        Paste your public Spotify playlist URL below and we'll create a matching
        playlist on YouTube Music.
      </Text>
    </div>
  );
};

export default HeroSection;
