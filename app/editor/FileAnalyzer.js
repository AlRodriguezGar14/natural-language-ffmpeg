"use client";

import { useState } from "react";
import { probeFile } from "./ffmpeg";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FileAnalyzer({ fileInfo, setFileInfo }) {
  // const [fileInfo, setFileInfo] = useState(null);
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
      console.log("File info received:", info); // Debug log
      setFileInfo(info);
    } catch (error) {
      console.error("Error analyzing file:", error);
      setError(error.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to safely get nested values
  const safeGet = (obj, path, defaultValue = "Unknown") => {
    try {
      return (
        path.split(".").reduce((current, key) => current?.[key], obj) ||
        defaultValue
      );
    } catch {
      return defaultValue;
    }
  };

  // Helper function to format metadata
  const formatMetadata = (metadata) => {
    if (!metadata) return {};

    // Combine all metadata types for display
    const combined = {};

    if (metadata.global) Object.assign(combined, metadata.global);
    if (metadata.video) {
      Object.entries(metadata.video).forEach(([key, value]) => {
        combined[`video_${key}`] = value;
      });
    }
    if (metadata.audio) {
      Object.entries(metadata.audio).forEach(([key, value]) => {
        combined[`audio_${key}`] = value;
      });
    }

    // If metadata is a flat object (old format), use it directly
    if (
      typeof metadata === "object" &&
      !metadata.global &&
      !metadata.video &&
      !metadata.audio
    ) {
      return metadata;
    }

    return combined;
  };

  return (
    <div className="p-6">
      <div >
        <h1 className="text-3xl font-bold text-white mb-6">
          Media File Analyzer
        </h1>

        <div className="mb-6">
          <label className="block text-white mb-2">Select a media file:</label>
          <input
            type="file"
            onChange={handleFileSelect}
            accept="video/*,audio/*,image/*"
            disabled={loading}
            className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#7FBCB3] file:text-black hover:file:bg-[#A7C07F] disabled:opacity-50"
          />
        </div>

        {loading && (
          <div className="bg-blue-800 p-4 rounded-lg mb-4">
            <p className="text-blue-200">
              🔄 Analyzing file... This may take a moment.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-800 p-4 rounded-lg mb-4">
            <p className="text-red-200">❌ Error: {error}</p>
          </div>
        )}

        {fileInfo && (
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue=""
          >
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-1xl text-white">
                Expand/Collapse metadata
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4 text-balance">
                <div className="space-y-6">
                  {/* General Information Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-white">
                        📄 General Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Filename:</span>
                          <span className="text-white font-mono">
                            {safeGet(fileInfo, "input.filename")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Size:</span>
                          <span className="text-white">
                            {safeGet(fileInfo, "input.size.formatted")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Container:</span>
                          <span className="text-white">
                            {safeGet(fileInfo, "input.container.raw")}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Duration:</span>
                          <span className="text-white font-mono">
                            {safeGet(fileInfo, "input.duration.formatted")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Total Bitrate:</span>
                          <span className="text-white">
                            {safeGet(fileInfo, "input.bitrate.formatted")}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Video Stream Section */}
                  {fileInfo.video && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-white">
                          🎥 Video Stream
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <div className="text-gray-300">Codec:</div>
                            <div className="text-white">
                              {safeGet(fileInfo, "video.codec.full")}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Raw: {safeGet(fileInfo, "video.codec.raw")}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-300">Pixel Format:</div>
                            <div className="text-white">
                              {safeGet(fileInfo, "video.pixelFormat.full")}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Raw: {safeGet(fileInfo, "video.pixelFormat.raw")}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Resolution:</span>
                            <span className="text-white">
                              {safeGet(fileInfo, "video.resolution.raw")}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Bitrate:</span>
                            <span className="text-white">
                              {safeGet(
                                fileInfo,
                                "video.bitrate.formatted",
                                "N/A",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Frame Rate:</span>
                            <span className="text-white">
                              {safeGet(fileInfo, "video.fps.formatted", "N/A")}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Audio Stream Section */}
                  {fileInfo.audio && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-white">
                          🎵 Audio Stream
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <div className="text-gray-300">Codec:</div>
                            <div className="text-white">
                              {safeGet(fileInfo, "audio.codec.full")}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Raw: {safeGet(fileInfo, "audio.codec.raw")}
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Sample Rate:</span>
                            <span className="text-white">
                              {safeGet(
                                fileInfo,
                                "audio.sampleRate.formatted",
                                "N/A",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Channels:</span>
                            <span className="text-white">
                              {safeGet(fileInfo, "audio.channels.raw")}
                              {fileInfo.audio?.channels?.count &&
                                ` (${fileInfo.audio.channels.count})`}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Format:</span>
                            <span className="text-white">
                              {safeGet(fileInfo, "audio.format")}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Bitrate:</span>
                            <span className="text-white">
                              {safeGet(
                                fileInfo,
                                "audio.bitrate.formatted",
                                "N/A",
                              )}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Multiple Streams Info */}
                  {(fileInfo.videoStreams?.length > 1 ||
                    fileInfo.audioStreams?.length > 1) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-white">
                          📊 Multiple Streams Detected
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        This file contains {fileInfo.videoStreams?.length || 0}{" "}
                        video stream(s) and {fileInfo.audioStreams?.length || 0}{" "}
                        audio stream(s). Showing information for the first
                        stream of each type above.
                      </CardContent>
                    </Card>
                  )}

                  {/* Metadata Section */}
                  {(() => {
                    const metadata = formatMetadata(fileInfo.metadata);
                    return (
                      Object.keys(metadata).length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-white">
                              🏷️ Metadata
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {Object.entries(metadata).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between py-1 border-b border-gray-700 last:border-b-0"
                              >
                                <span className="text-gray-300 font-medium">
                                  {key.replace(/_/g, " ")}:
                                </span>
                                <span className="text-white font-mono text-sm ml-4 break-all">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      )
                    );
                  })()}

                  {/* Debug Section - Remove in production */}
                  <details className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <summary className="text-white font-bold cursor-pointer">
                      🐛 Debug Info (Click to expand)
                    </summary>
                    <pre className="text-xs text-gray-300 mt-2 overflow-auto max-h-64 bg-gray-900 p-2 rounded">
                      {JSON.stringify(fileInfo, null, 2)}
                    </pre>
                  </details>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </div>
    </div>
  );
}
