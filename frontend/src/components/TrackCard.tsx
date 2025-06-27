import React from "react";
import { Card, Typography, Tag, Space, Tooltip, Badge } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  SoundOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { SpotifyIcon, YouTubeMusicIcon } from "../icons";
import type { ConversionTrack } from "../types";

const { Title, Text, Link } = Typography;

interface TrackCardProps {
  track: ConversionTrack;
  index: number;
}

const TrackCard: React.FC<TrackCardProps> = ({ track, index }) => {
  const cardKey = `${track.originalTitle}-${track.originalArtist}-${index}`;

  return (
    <Card
      key={cardKey}
      className={`
        relative overflow-hidden transition-all duration-300 hover:shadow-lg
        ${
          track.success
            ? "border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white hover:from-green-100"
            : "border-l-4 border-l-red-500 bg-gradient-to-r from-red-50 to-white hover:from-red-100"
        }
      `}
      size="small"
      bodyStyle={{ padding: "16px" }}
    >
      {/* Status Badge */}
      <div className="absolute top-3 right-3">
        {track.success ? (
          <Badge
            count={<CheckCircleOutlined className="text-green-500" />}
            style={{ backgroundColor: "transparent" }}
          />
        ) : (
          <Badge
            count={<CloseCircleOutlined className="text-red-500" />}
            style={{ backgroundColor: "transparent" }}
          />
        )}
      </div>

      <div className="space-y-3">
        {/* Original Track */}
        <div className="pr-8">
          <div className="flex items-start space-x-2">
            <SoundOutlined className="text-gray-400 mt-1 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <Title level={5} className="mb-1 !text-gray-800 truncate">
                {track.originalTitle}
              </Title>
              <div className="flex items-center space-x-1 text-gray-500 md:hidden">
                <UserOutlined className="text-xs" />
                <Text className="text-sm truncate">{track.originalArtist}</Text>
              </div>
            </div>
          </div>
        </div>

        {/* YouTube Music Result */}
        <div className="hidden md:block">
          {track.ytMusicResult ? (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <PlayCircleOutlined className="text-red-500 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <Text strong className="text-gray-800 block truncate">
                    {track.ytMusicResult.title}
                  </Text>
                  <div className="flex items-center space-x-1 text-gray-500 mt-1">
                    <UserOutlined className="text-xs" />
                    <Text className="text-sm truncate">
                      {track.ytMusicResult.artists
                        .map(artist =>
                          typeof artist === "string" ? artist : artist.name
                        )
                        .join(", ")}
                    </Text>
                  </div>
                  {track.ytMusicResult.duration && (
                    <div className="flex items-center space-x-1 text-gray-400 mt-1">
                      <ClockCircleOutlined className="text-xs" />
                      <Text className="text-xs">
                        {track.ytMusicResult.duration}
                      </Text>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <CloseCircleOutlined className="text-gray-400 mb-2" />
              <Text type="secondary" className="block text-sm">
                No match found
              </Text>
              {track.error && (
                <Text
                  type="secondary"
                  className="text-xs block mt-1 text-red-500"
                >
                  {track.error}
                </Text>
              )}
            </div>
          )}
        </div>

        {/* Action Links */}
        <div className="flex justify-between md:items-center items-baseline pt-2 border-t border-gray-100">
          <Space
            size="middle"
            className="flex flex-col md:flex-row justify-start items-start"
          >
            {track.spotifyUrl && (
              <Tooltip title="Open in Spotify">
                <Link
                  href={track.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                >
                  <SpotifyIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">
                    Spotify
                  </span>
                </Link>
              </Tooltip>
            )}
            {track.ytMusicResult && (
              <Tooltip title="Open in YouTube Music">
                <Link
                  href={`https://music.youtube.com/watch?v=${track.ytMusicResult.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                >
                  <YouTubeMusicIcon className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="text-xs md:text-sm font-medium">
                    YouTube Music
                  </span>
                </Link>
              </Tooltip>
            )}
          </Space>

          <Tag
            color={track.success ? "success" : "error"}
            className="border-0 font-medium"
          >
            {track.success ? "Converted" : "Failed"}
          </Tag>
        </div>
      </div>
    </Card>
  );
};

export default TrackCard;
