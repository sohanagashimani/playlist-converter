import React from "react";

const AppFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-background/50 backdrop-blur">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>TuneSwap © 2025. Swap your tunes, enjoy everywhere.</span>
          <span className="hidden sm:inline">•</span>
          <span>Built with React, TypeScript, and lots of ♪</span>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
