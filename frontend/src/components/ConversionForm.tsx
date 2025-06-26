import { useState } from "react";
import { PlayIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui";
import { AlertCircle } from "lucide-react";

interface ConversionFormProps {
  onSubmit: (spotifyUrl: string) => void;
}

const ConversionForm: React.FC<ConversionFormProps> = ({ onSubmit }) => {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);

  const validateSpotifyUrl = (url: string): boolean => {
    const spotifyPlaylistRegex =
      /^https:\/\/(open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyPlaylistRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!spotifyUrl.trim()) {
      setError("Please enter a Spotify playlist URL");
      return;
    }

    if (!validateSpotifyUrl(spotifyUrl)) {
      setError("Please enter a valid Spotify playlist URL");
      return;
    }

    setIsValidating(true);
    try {
      onSubmit(spotifyUrl);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-primary" />
            How to get a Spotify playlist URL
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <div className="list-decimal list-inside space-y-1">
            <div>
              1. Open Spotify and navigate to the playlist you want to convert
            </div>
            <div>
              2. Make sure the playlist is set to{" "}
              <strong className="text-foreground">Public</strong>
            </div>
            <div>3. Click the three dots (⋯) menu</div>
            <div>4. Select "Share" → "Copy link to playlist"</div>
            <div>5. Paste the URL below</div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="spotifyUrl"
            className="text-sm font-medium text-foreground"
          >
            Spotify Playlist URL
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 font-bold text-lg">
              ♫
            </span>
            <Input
              id="spotifyUrl"
              type="url"
              value={spotifyUrl}
              onChange={e => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
              className="pl-10 h-12"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isValidating}
          size="lg"
          className="w-full h-12 text-lg modern-button"
        >
          <PlayIcon className="h-5 w-5 mr-2" />
          {isValidating ? "Validating..." : "Start Swapping"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Only public playlists can be converted. Make sure your playlist is set
        to public in Spotify.
      </p>
    </div>
  );
};

export default ConversionForm;
