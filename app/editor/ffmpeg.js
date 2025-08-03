"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg = null;

function formatSize(bytes) {
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export async function probeFile(file) {
  const ffmpeg = await loadFFmpeg();
  try {
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(file.name, fileData);

    let outputData = "";

    const logHandler = ({ message }) => {
      outputData += message + "\n";
    };

    ffmpeg.on("log", logHandler);

    try {
      await ffmpeg.exec(["-i", file.name]);
    } catch {
      // Expected error when probing. Ignore it
    }

    console.log("FFmpeg output:", outputData); // Debug log

    // Parse format information
    const format = file.name.split(".")[1];
    // const formatRegex = /Input #0, ([^,]+)/;
    // const formatMatch = outputData.match(formatRegex);
    // const format = formatMatch ? formatMatch[1].trim() : "unknown";

    // Parse duration and bitrate
    const durationRegex = /Duration: ([\d:.]+).*?bitrate: (\d+)/;
    const durationMatch = outputData.match(durationRegex);

    // Parse video streams - specific to the actual format we see
    // Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709, progressive), 640x320 [SAR 1:1 DAR 2:1], 783 kb/s, 25 fps, 25 tbr, 12800 tbn (default)
    const videoStreams = [];
    const videoLines = outputData.match(/Stream #0:\d+.*?: Video: .+/g);

    if (videoLines) {
      videoLines.forEach((line) => {
        const streamMatch = line.match(
          /Stream #0:(\d+).*?: Video: ([^\s(]+)(?:\s*\([^)]*\))?(?:\s*\([^)]*\))?,\s*([^,]+?)(?:\([^)]*\))?,\s*(\d+x\d+).*?,\s*(\d+)\s*kb\/s,\s*(\d+(?:\.\d+)?)\s*fps/,
        );

        if (streamMatch) {
          const streamIndex = parseInt(streamMatch[1]);
          const codec = streamMatch[2];
          const pixelFormat = streamMatch[3].trim();
          const resolution = streamMatch[4];
          const bitrate = parseInt(streamMatch[5]);
          const fps = parseFloat(streamMatch[6]);

          videoStreams.push({
            index: streamIndex,
            codec: {
              raw: codec,
              full: codec,
            },
            pixelFormat: {
              raw: pixelFormat,
              full: pixelFormat,
            },
            resolution: {
              raw: resolution,
              width: parseInt(resolution.split("x")[0]),
              height: parseInt(resolution.split("x")[1]),
            },
            bitrate: {
              raw: bitrate,
              formatted: `${bitrate} kb/s`,
            },
            fps: {
              raw: fps,
              formatted: `${fps} fps`,
            },
          });
        }
      });
    }

    // Parse audio streams - specific to the actual format we see
    // Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 96 kb/s (default)
    const audioStreams = [];
    const audioLines = outputData.match(/Stream #0:\d+.*?: Audio: .+/g);

    if (audioLines) {
      audioLines.forEach((line) => {
        const streamMatch = line.match(
          /Stream #0:(\d+).*?: Audio: ([^\s(]+)(?:\s*\([^)]*\))?(?:\s*\([^)]*\))?,\s*(\d+)\s*Hz,\s*([^,]+),\s*([^,]+),\s*(\d+)\s*kb\/s/,
        );

        if (streamMatch) {
          const streamIndex = parseInt(streamMatch[1]);
          const codec = streamMatch[2];
          const sampleRate = parseInt(streamMatch[3]);
          const channels = streamMatch[4].trim();
          const format = streamMatch[5].trim();
          const bitrate = parseInt(streamMatch[6]);

          audioStreams.push({
            index: streamIndex,
            codec: {
              raw: codec,
              full: codec,
            },
            sampleRate: {
              raw: sampleRate,
              formatted: `${sampleRate} Hz`,
            },
            channels: {
              raw: channels,
              count: getChannelCount(channels),
            },
            format: format,
            bitrate: {
              raw: bitrate,
              formatted: `${bitrate} kb/s`,
            },
          });
        }
      });
    }

    // Parse metadata
    const metadata = parseMetadata(outputData);

    const result = {
      input: {
        filename: file.name,
        size: {
          raw: file.size,
          formatted: formatSize(file.size),
        },
        container: {
          raw: format,
          full: format,
        },
        duration: {
          raw: durationMatch ? durationMatch[1] : "00:00:00",
          seconds: durationMatch ? timeToSeconds(durationMatch[1]) : 0,
          formatted: durationMatch ? durationMatch[1] : "unknown",
        },
        bitrate: {
          raw: durationMatch ? parseInt(durationMatch[2]) : 0,
          formatted: durationMatch ? `${durationMatch[2]} kb/s` : "unknown",
        },
      },
      video: videoStreams.length > 0 ? videoStreams[0] : null,
      audio: audioStreams.length > 0 ? audioStreams[0] : null,
      videoStreams,
      audioStreams,
      metadata,
    };

    console.log("Parsed result:", result);
    return result;
  } catch (error) {
    console.error("FFmpeg error:", error);
    throw error;
  } finally {
    // Clean up
    ffmpeg.off("log");
    try {
      await ffmpeg.deleteFile(file.name);
    } catch {
      // Ignore cleanup errors
    }
  }
}

function parseMetadata(outputData) {
  const metadata = {
    global: {},
    video: {},
    audio: {},
  };

  // Parse global metadata (under Input #0)
  const globalMetadataMatch = outputData.match(
    /Input #0.*?\n\s*Metadata:\s*\n((?:\s*[^:\n]+\s*:\s*[^\n]*\n)*)/,
  );
  if (globalMetadataMatch) {
    const lines = globalMetadataMatch[1].split("\n");
    lines.forEach((line) => {
      const match = line.match(/^\s*([^:]+):\s*(.+)$/);
      if (match) {
        metadata.global[match[1].trim()] = match[2].trim();
      }
    });
  }

  // Parse stream-specific metadata
  const streamMatches = outputData.matchAll(
    /Stream #0:(\d+).*?\n(?:\s*Metadata:\s*\n((?:\s*[^:\n]+\s*:\s*[^\n]*\n)*))?/g,
  );

  for (const streamMatch of streamMatches) {
    const streamIndex = parseInt(streamMatch[1]);
    const streamMetadata = streamMatch[2];

    if (streamMetadata) {
      const lines = streamMetadata.split("\n");
      const streamMeta = {};

      lines.forEach((line) => {
        const match = line.match(/^\s*([^:]+):\s*(.+)$/);
        if (match) {
          streamMeta[match[1].trim()] = match[2].trim();
        }
      });

      // Determine if this is video or audio stream by checking the stream line
      const streamLine =
        outputData.match(new RegExp(`Stream #0:${streamIndex}.*`))?.[0] || "";
      if (streamLine.includes("Video:")) {
        Object.assign(metadata.video, streamMeta);
      } else if (streamLine.includes("Audio:")) {
        Object.assign(metadata.audio, streamMeta);
      }
    }
  }

  return metadata;
}

function getChannelCount(channelsStr) {
  if (!channelsStr) return null;

  const str = channelsStr.toLowerCase();
  if (str.includes("mono")) return 1;
  if (str.includes("stereo")) return 2;
  if (str.includes("5.1")) return 6;
  if (str.includes("7.1")) return 8;

  // Try to extract number
  const match = str.match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function timeToSeconds(timeString) {
  const parts = timeString.split(":");
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts.map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const [minutes, seconds] = parts.map(Number);
    return minutes * 60 + seconds;
  }
  return 0;
}

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  try {
    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });
    return ffmpeg;
  } catch (error) {
    console.error("FFmpeg load error:", error);
    throw new Error("Failed to load FFmpeg");
  }
}
