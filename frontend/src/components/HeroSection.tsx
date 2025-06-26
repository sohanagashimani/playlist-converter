import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

const HeroSection: React.FC = () => {
  return (
    <div className="text-center py-8">
      <Title level={1} className="gradient-text !mb-2">
        Welcome to TuneSwap
      </Title>
      <Title level={2} className="!mb-4 !text-gray-700">
        Seamlessly Transfer Your Music
      </Title>
      <Text className="text-lg text-gray-600 block max-w-2xl mx-auto">
        Transform your Spotify playlists into YouTube Music collections
        effortlessly. Simply paste your public Spotify playlist URL and watch
        the magic happen – TuneSwap handles all the heavy lifting for you.
      </Text>
    </div>
  );
};

export default HeroSection;
