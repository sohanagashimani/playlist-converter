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
      <div className="min-w-0 max-w-full">
        <Text
          strong
          className="block text-sm leading-tight truncate"
          title={record.originalTitle}
        >
          {record.originalTitle.length > 30
            ? `${record.originalTitle.substring(0, 30)}...`
            : record.originalTitle}
        </Text>
        <div className="h-1"></div>
        <Text
          type="secondary"
          className="text-xs leading-tight block truncate"
          title={record.originalArtist}
        >
          {record.originalArtist.length > 35
            ? `${record.originalArtist.substring(0, 35)}...`
            : record.originalArtist}
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
          <div className="min-w-0 max-w-full">
            <Text
              className="block text-sm leading-tight truncate"
              title={record.ytMusicResult.title}
            >
              {record.ytMusicResult.title.length > 30
                ? `${record.ytMusicResult.title.substring(0, 30)}...`
                : record.ytMusicResult.title}
            </Text>
            <div className="h-1"></div>
            <Text
              type="secondary"
              className="text-xs leading-tight block truncate"
              title={artists}
            >
              {artists.length > 35 ? `${artists.substring(0, 35)}...` : artists}
            </Text>
            {record.ytMusicResult.duration && (
              <>
                <div className="h-1"></div>
                <Text type="secondary" className="text-xs block">
                  {record.ytMusicResult.duration}
                </Text>
              </>
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
      <div className="min-w-0">
        {record.success ? (
          <Tag
            color="success"
            icon={<CheckCircleOutlined />}
            className="text-xs mb-1"
          >
            Converted
          </Tag>
        ) : (
          <Tag
            color="error"
            icon={<CloseCircleOutlined />}
            className="text-xs mb-1"
          >
            Failed
          </Tag>
        )}
        {record.error && (
          <Text
            type="secondary"
            className="text-xs block text-red-500 leading-tight truncate"
            title={record.error}
          >
            {record.error.length > 40
              ? `${record.error.substring(0, 40)}...`
              : record.error}
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
      <Space size="small" className="flex flex-wrap gap-2" wrap>
        {record.spotifyUrl && (
          <Link
            href={record.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-green-600 hover:text-green-700 whitespace-nowrap"
          >
            <SpotifyIcon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm">Spotify</span>
          </Link>
        )}
        {record.ytMusicResult && (
          <Link
            href={`https://music.youtube.com/watch?v=${record.ytMusicResult.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-red-600 hover:text-red-700 whitespace-nowrap"
          >
            <YouTubeMusicIcon className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm">YouTube Music</span>
          </Link>
        )}
      </Space>
    ),
  },
];
