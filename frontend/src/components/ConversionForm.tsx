import { useState } from "react";
import { Form, Input, Button, Typography, Collapse } from "antd";
import { PlayIcon } from "@heroicons/react/24/solid";
import { QuestionCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { Panel } = Collapse;

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
      {/* Compact Help Section */}
      <div className="mb-4">
        <Collapse ghost size="small">
          <Panel
            header={
              <Text className="text-sm text-gray-600">
                <QuestionCircleOutlined className="mr-2" />
                Need help finding your playlist URL?
              </Text>
            }
            key="1"
          >
            <div className="text-sm text-gray-600 space-y-2 pb-2">
              <div>1. Open your playlist in Spotify</div>
              <div>
                2. Make sure it's set to{" "}
                <span className="px-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  Public
                </span>
              </div>
              <div>
                3. Click the three dots (⋯) → Share → Copy link to playlist
              </div>
              <div className="text-xs text-amber-600 mt-2">
                💡 Only public playlists can be converted
              </div>
            </div>
          </Panel>
        </Collapse>
      </div>

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
            className="w-full btn-tuneswap h-12 text-lg"
          >
            {isValidating ? "Validating..." : "Start Swapping"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ConversionForm;
