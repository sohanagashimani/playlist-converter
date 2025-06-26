import React from "react";
import { MusicalNoteIcon } from "@heroicons/react/24/outline";
import HealthStatus from "./HealthStatus";
import { useTheme } from "./theme-provider";
import { Button } from "@/components/ui";
import { Moon, Sun } from "lucide-react";

const AppHeader: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <MusicalNoteIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">TuneSwap</h1>
            <p className="text-sm text-muted-foreground">
              Spotify → YouTube Music
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <HealthStatus />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
