import React, { useState } from "react";
import {
  Button,
  Card,
  Typography,
  Alert,
  Statistic,
  Input,
  Pagination,
  Empty,
  Table,
  Radio,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
} from "@ant-design/icons";
import TrackCard from "./TrackCard";
import { getTrackTableColumns } from "./TrackTableColumns";
import type { ConversionResult } from "../types";

const { Title, Text, Link } = Typography;
const { Search } = Input;

interface ConversionResultsProps {
  result: ConversionResult;
  onReset: () => Promise<void>;
}

const ConversionResults: React.FC<ConversionResultsProps> = ({
  result,
  onReset,
}) => {
  const defaultView = result.totalTracks <= 20 ? "cards" : "table";

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultView === "cards" ? 12 : 20);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">(defaultView);

  const filteredTracks = result.tracks.filter(
    track =>
      track.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      track.originalArtist.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (track.ytMusicResult?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTracks = filteredTracks.slice(startIndex, endIndex);

  const successRate = Math.round(
    (result.successfulTracks / result.totalTracks) * 100
  );

  const handleViewModeChange = (mode: "cards" | "table") => {
    setViewMode(mode);

    setPageSize(mode === "cards" ? 12 : 20);
    setCurrentPage(1);
  };

  const tableColumns = getTrackTableColumns();

  return (
    <div className="space-y-6">
      {/* Success Alert */}
      <Alert
        message="Conversion Completed!"
        description={
          <div>
            <p>
              Your playlist has been successfully converted to YouTube Music.
              {result.ytMusicPlaylistUrl && (
                <>
                  {" "}
                  <Link
                    href={result.ytMusicPlaylistUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold"
                  >
                    Click here to open your new YouTube Music playlist{" "}
                    <LinkOutlined />
                  </Link>
                </>
              )}
            </p>
          </div>
        }
        type="success"
        showIcon
        className="slide-in"
      />

      {/* Statistics */}
      <Card className="card">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <Statistic
            title="Total Tracks"
            value={result.totalTracks}
            valueStyle={{ color: "#1890ff" }}
          />
          <Statistic
            title="Successful"
            value={result.successfulTracks}
            valueStyle={{ color: "#52c41a" }}
            suffix={<CheckCircleOutlined />}
          />
          <Statistic
            title="Failed"
            value={result.failedTracks}
            valueStyle={{ color: "#ff4d4f" }}
            suffix={<CloseCircleOutlined />}
          />
          <Statistic
            title="Success Rate"
            value={successRate}
            precision={0}
            valueStyle={{
              color:
                successRate >= 80
                  ? "#52c41a"
                  : successRate >= 60
                  ? "#faad14"
                  : "#ff4d4f",
            }}
            suffix="%"
          />
        </div>
      </Card>

      {/* Playlist Information */}
      {result.ytMusicPlaylist && (
        <Card className="card">
          <Title level={4}>YouTube Music Playlist</Title>
          <div className="space-y-2">
            <div>
              <Text strong>Title: </Text>
              <Text>{result.ytMusicPlaylist.title}</Text>
            </div>
            {result.ytMusicPlaylist.description && (
              <div>
                <Text strong>Description: </Text>
                <Text type="secondary">
                  {result.ytMusicPlaylist.description}
                </Text>
              </div>
            )}
            <div>
              <Text strong>Playlist URL: </Text>
              <Link
                href={result.ytMusicPlaylistUrl}
                target="_blank"
                rel="noopener noreferrer"
                copyable
              >
                {result.ytMusicPlaylistUrl}
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Track Details */}
      <Card className="card">
        <div className="flex flex-col space-y-4 mb-6">
          {/* Header with title and controls */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <Title level={4} className="!mb-0">
              Track Conversion Details ({result.totalTracks} tracks)
            </Title>
            <Button
              icon={<ReloadOutlined />}
              onClick={onReset}
              className="btn-secondary lg:order-last"
            >
              Convert Another Playlist
            </Button>
          </div>

          {/* Controls row */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <Search
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="md:w-1/3"
              prefix={<SearchOutlined />}
              allowClear
            />

            {/* View Toggle */}
            <div className="md:flex items-center space-x-2 hidden">
              <Text className="text-sm text-gray-600 whitespace-nowrap">
                View:
              </Text>
              <Radio.Group
                value={viewMode}
                onChange={e => handleViewModeChange(e.target.value)}
                buttonStyle="solid"
                size="small"
              >
                <Radio.Button value="cards">
                  <AppstoreOutlined /> Cards
                </Radio.Button>
                <Radio.Button value="table">
                  <BarsOutlined /> Table
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {paginatedTracks.length > 0 ? (
          <>
            {viewMode === "cards" ? (
              /* Card Grid View */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 max-h-96 overflow-y-auto md:max-h-none">
                {[...paginatedTracks].map((track, index) => (
                  <TrackCard
                    key={`${track.originalTitle}-${track.originalArtist}-${
                      startIndex + index
                    }`}
                    track={track}
                    index={startIndex + index}
                  />
                ))}
              </div>
            ) : (
              /* Compact Table View */
              <div className="mb-6">
                <Table
                  columns={tableColumns}
                  dataSource={paginatedTracks}
                  rowKey={(record, index) =>
                    `${record.originalTitle}-${record.originalArtist}-${
                      startIndex + (index || 0)
                    }`
                  }
                  pagination={false}
                  size="small"
                  scroll={{ x: true }}
                  rowClassName={record =>
                    record.success
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-red-50 hover:bg-red-100"
                  }
                />
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredTracks.length}
                showSizeChanger
                pageSizeOptions={
                  viewMode === "cards"
                    ? ["6", "12", "24"]
                    : ["10", "20", "50", "100"]
                }
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} of ${total} tracks`
                }
                onChange={(page, size) => {
                  setCurrentPage(page);
                  if (size !== pageSize) {
                    setPageSize(size);
                    setCurrentPage(1);
                  }
                }}
                onShowSizeChange={(_current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
              />
            </div>
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm
                ? `No tracks found matching "${searchTerm}"`
                : "No tracks to display"
            }
          />
        )}
      </Card>

      {/* Conversion Info */}
      <Card className="card">
        <Title level={5}>Conversion Information</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <Text strong>Conversion ID: </Text>
            <Text code>{result.conversionId}</Text>
          </div>
          <div>
            <Text strong>Completed: </Text>
            <Text>{new Date(result.timestamp).toLocaleString()}</Text>
          </div>
          <div>
            <Text strong>Original Playlist: </Text>
            <Link
              href={result.spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600"
            >
              Open in Spotify <LinkOutlined />
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConversionResults;
