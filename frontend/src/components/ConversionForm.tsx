import { useState } from "react";
import { Form, Input, Button, Typography, Alert } from "antd";
import { PlayIcon } from "@heroicons/react/24/solid";

const { Text } = Typography;

interface ConversionFormProps {
  onSubmit: (spotifyUrl: string) => void;
}

const ConversionForm: React.FC<ConversionFormProps> = ({ onSubmit }) => {
  const [form] = Form.useForm();
  const [isValidating, setIsValidating] = useState(false);

  const validateSpotifyUrl = (url: string): boolean => {
    const spotifyPlaylistRegex =
      /^https:\/\/(open\.)?spotify\.com\/playlist\/[a-zA-Z0-9]+(\?.*)?$/;
    return spotifyPlaylistRegex.test(url);
  };

  const handleSubmit = async (values: { spotifyUrl: string }) => {
    const { spotifyUrl } = values;

    if (!validateSpotifyUrl(spotifyUrl)) {
      form.setFields([
        {
          name: "spotifyUrl",
          errors: ["Please enter a valid Spotify playlist URL"],
        },
      ]);
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
    <div className="max-w-2xl mx-auto">
      <Alert
        message="How to get a Spotify playlist URL"
        description={
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>
              Open Spotify and navigate to the playlist you want to convert
            </li>
            <li>
              Make sure the playlist is set to <strong>Public</strong>
            </li>
            <li>Click the three dots (⋯) menu</li>
            <li>Select "Share" → "Copy link to playlist"</li>
            <li>Paste the URL below</li>
          </ol>
        }
        type="info"
        showIcon
        className="md:mb-6 mb-4 p-3 md:p-4"
      />

      <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
        <Form.Item
          name="spotifyUrl"
          label={<Text strong>Spotify Playlist URL</Text>}
          rules={[
            { required: true, message: "Please enter a Spotify playlist URL" },
            {
              validator: (_, value) => {
                if (!value || validateSpotifyUrl(value)) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error("Please enter a valid Spotify playlist URL")
                );
              },
            },
          ]}
        >
          <Input
            placeholder="https://open.spotify.com/playlist/..."
            className="input-field"
            prefix={<span className="text-green-500 font-bold">♫</span>}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isValidating}
            size="large"
            icon={<PlayIcon className="h-5 w-5" />}
            className="w-full btn-primary h-12 text-lg font-semibold"
          >
            {isValidating ? "Validating..." : "Convert Playlist"}
          </Button>
        </Form.Item>
      </Form>

      <div className="text-center mt-4">
        <Text type="secondary" className="text-sm">
          Only public playlists can be converted. Make sure your playlist is set
          to public in Spotify.
        </Text>
      </div>
    </div>
  );
};

export default ConversionForm;
