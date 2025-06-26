import React from "react";
import { Card, Typography } from "antd";
import { MusicalNoteIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

const { Title, Text } = Typography;

const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: MusicalNoteIcon,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      title: "Smart Matching",
      description:
        "Advanced fuzzy matching to find the best YouTube Music equivalents for your tracks.",
    },
    {
      icon: ArrowRightIcon,
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      title: "Fast Conversion",
      description:
        "Quick and efficient playlist conversion with real-time progress updates.",
    },
    {
      icon: MusicalNoteIcon,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      title: "Detailed Results",
      description:
        "See exactly which tracks were converted and which ones couldn't be found.",
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
