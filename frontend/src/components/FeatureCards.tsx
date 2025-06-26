import React from "react";
import { Card, Typography } from "antd";
import { MusicalNoteIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const { Title, Text } = Typography;

const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: MusicalNoteIcon,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      title: "Smart Tune Matching",
      description:
        "TuneSwap's intelligent algorithm finds the perfect YouTube Music matches for your Spotify tracks.",
    },
    {
      icon: ArrowRightIcon,
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-50",
      title: "Lightning Fast Swaps",
      description:
        "Watch your playlists transform in real-time with our high-speed conversion engine.",
    },
    {
      icon: MusicalNoteIcon,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      title: "Crystal Clear Results",
      description:
        "Get detailed insights on every track swap with comprehensive success and failure reports.",
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const IconComponent = feature.icon;
        return (
          <Card
            key={index}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition-shadow text-center"
          >
            <div
              className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}
            >
              <IconComponent className={`h-6 w-6 ${feature.iconColor}`} />
            </div>
            <Title level={4}>{feature.title}</Title>
            <Text className="text-gray-600">{feature.description}</Text>
          </Card>
        );
      })}
    </div>
  );
};

export default FeatureCards;
