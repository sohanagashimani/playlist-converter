import React from "react";
import { Typography, Tag, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { SpotifyIcon, YouTubeMusicIcon } from "../icons";
import type { ConversionTrack } from "../types";

const { Text, Link } = Typography;

export const getTrackTableColumns = () => [
  {
    title: "Original Track",
    key: "original",
    width: "25%",
    render: (record: ConversionTrack) => (
      <div className="min-w-0">
        <Text strong className="block truncate text-sm">
          {record.originalTitle}
        </Text>
        <Text type="secondary" className="text-xs truncate block">
          {record.originalArtist}
        </Text>
      </div>
    ),
  },
  {
    title: "YouTube Music Match",
    key: "ytMatch",
    width: "25%",
    render: (record: ConversionTrack) => {
      if (record.ytMusicResult) {
        const artists = record.ytMusicResult.artists
          .map(artist => (typeof artist === "string" ? artist : artist.name))
          .join(", ");
        return (
          <div className="min-w-0">
            <Text className="block truncate text-sm">
              {record.ytMusicResult.title}
            </Text>
            <Text type="secondary" className="text-xs truncate block">
              {artists}
            </Text>
            {record.ytMusicResult.duration && (
              <Text type="secondary" className="text-xs">
                {record.ytMusicResult.duration}
              </Text>
            )}
          </div>
        );
      }
      return (
        <Text type="secondary" className="text-sm">
          No match found
        </Text>
      );
    },
  },
  {
    title: "Status",
    key: "status",
    width: "15%",
    render: (record: ConversionTrack) => (
      <div>
        {record.success ? (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            className="text-xs"
          >
            Converted
          </Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />} className="text-xs">
            Failed
          </Tag>
        )}
        {record.error && (
          <Text type="secondary" className="text-xs block mt-1 text-red-500">
            {record.error}
          </Text>
        )}
      </div>
    ),
  },
  {
    title: "Links",
    key: "links",
    width: "35%",
    render: (record: ConversionTrack) => (
      <Space size="small" className="flex gap-4" wrap>
        {record.spotifyUrl && (
          <Link
            href={record.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-green-600 hover:text-green-700"
          >
            <SpotifyIcon className="w-3 h-3" />
            <span className="text-xs">Spotify</span>
          </Link>
        )}
        {record.ytMusicResult && (
          <Link
            href={`https://music.youtube.com/watch?v=${record.ytMusicResult.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-red-600 hover:text-red-700"
          >
            <YouTubeMusicIcon className="w-3 h-3" />
            <span className="text-xs">YouTube Music</span>
          </Link>
        )}
      </Space>
    ),
  },
];
