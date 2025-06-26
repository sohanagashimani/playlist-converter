import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Title level={1} className="gradient-text !mb-4">
        Convert Your Spotify Playlists
      </Title>
      <Text className="text-lg text-gray-600 block max-w-2xl mx-auto">
        Easily transfer your favorite Spotify playlists to YouTube Music. Just
        paste a public Spotify playlist URL and we'll handle the rest.
      </Text>
    </div>
  );
};

export default HeroSection;
