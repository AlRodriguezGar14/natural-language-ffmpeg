"use client";

import { useState, Fragment } from "react";
import { probeFile } from "./ffmpeg";

export default function FileAnalyzer() {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileInfo(null);

    try {
      const info = await probeFile(file);
      setFileInfo(info);
    } catch (error) {
      console.error("Error analyzing file:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white">
      <input
        type="file"
        onChange={handleFileSelect}
        accept="video/*,audio/*"
        disabled={loading}
        className="mb-4"
      />

      {loading && <p className="text-blue-400">Analyzing file...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {fileInfo && (
        <div className="space-y-4">
          {/* General Information Section */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">General Information</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>Filename:</div>
              <div>{fileInfo.input.filename}</div>
              <div>Size:</div>
              <div>{fileInfo.input.size.formatted}</div>
              <div>Container:</div>
              <div>{fileInfo.input.container.raw}</div>
              <div>Duration:</div>
              <div>{fileInfo.input.duration.formatted}</div>
              <div>Total Bitrate:</div>
              <div>{fileInfo.input.bitrate.formatted}</div>
            </div>
          </div>

          {/* Video Stream Section */}
          {fileInfo.video && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Video Stream</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>Codec:</div>
                <div>
                  <div>{fileInfo.video.codec.full}</div>
                  <div className="text-gray-400 text-sm">
                    Raw: {fileInfo.video.codec.raw}
                  </div>
                </div>
                <div>PixelFormat:</div>
                <div>
                  <div>{fileInfo.video.pixelFormat.full}</div>
                  <div className="text-gray-400 text-sm">
                    Raw: {fileInfo.video.pixelFormat.raw}
                  </div>
                </div>
                <div>Resolution:</div>
                <div>{fileInfo.video.resolution.raw}</div>
                <div>Bitrate:</div>
                <div>{fileInfo.video.bitrate.formatted}</div>
                <div>Frame Rate:</div>
                <div>{fileInfo.video.fps.formatted}</div>
              </div>
            </div>
          )}

          {/* Audio Stream Section */}
          {fileInfo.audio && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Audio Stream</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>Codec:</div>
                <div>
                  <div>{fileInfo.audio.codec.full}</div>
                  <div className="text-gray-400 text-sm">
                    Raw: {fileInfo.audio.codec.raw}
                  </div>
                </div>
                <div>Sample Rate:</div>
                <div>{fileInfo.audio.sampleRate.formatted}</div>
                <div>Channels:</div>
                <div>{fileInfo.audio.channels.raw}</div>
                <div>Format:</div>
                <div>{fileInfo.audio.format}</div>
                <div>Bitrate:</div>
                <div>{fileInfo.audio.bitrate.formatted}</div>
              </div>
            </div>
          )}

          {/* Metadata Section */}
          {fileInfo.metadata && Object.keys(fileInfo.metadata).length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Metadata</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(fileInfo.metadata).map(([key, value]) => (
                  <Fragment key={key}>
                    <div className="font-medium">{key}:</div>
                    <div>{value}</div>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
