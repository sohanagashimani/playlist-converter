import React from "react";

const HeroSection: React.FC = () => {
  return (
    <section className="text-center py-16 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
          Welcome to <span className="gradient-text">TuneSwap</span>
        </h1>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-muted-foreground">
          Seamlessly Transfer Your Music
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transform your Spotify playlists into YouTube Music collections
          effortlessly. Simply paste your public Spotify playlist URL and watch
          the magic happen – TuneSwap handles all the heavy lifting for you.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
