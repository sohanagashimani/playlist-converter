import React from "react";
import { Card, CardContent } from "@/components/ui";
import { FileMusic, Zap, BarChart3 } from "lucide-react";

const FeatureCards: React.FC = () => {
  const features = [
    {
      icon: FileMusic,
      title: "Smart Tune Matching",
      description:
        "TuneSwap's intelligent algorithm finds the perfect YouTube Music matches for your Spotify tracks.",
      gradient: "from-green-400 to-emerald-600",
    },
    {
      icon: Zap,
      title: "Lightning Fast Swaps",
      description:
        "Watch your playlists transform in real-time with our high-speed conversion engine.",
      gradient: "from-blue-400 to-indigo-600",
    },
    {
      icon: BarChart3,
      title: "Crystal Clear Results",
      description:
        "Get detailed insights on every track swap with comprehensive success and failure reports.",
      gradient: "from-orange-400 to-red-600",
    },
  ];

  return (
    <section className="grid md:grid-cols-3 gap-6">
      {features.map((feature, index) => {
        const IconComponent = feature.icon;
        return (
          <Card key={index} className="modern-card border-border/50">
            <CardContent className="p-6 text-center space-y-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center mx-auto`}
              >
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
};

export default FeatureCards;
