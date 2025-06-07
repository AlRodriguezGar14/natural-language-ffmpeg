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
    } catch (e) {
      // Expected error
    }
    // Parse format information
    const formatRegex = /Input #0, ([^,]+)/;
    const formatMatch = outputData.match(formatRegex);
    const format = formatMatch ? formatMatch[1] : "unknown";

    // Parse duration and bitrate
    const durationRegex = /Duration: ([\d:.]+).*?bitrate: (\d+)/;
    const durationMatch = outputData.match(durationRegex);

    // Parse video stream with improved regex
    // const videoRegex =
    //   /Stream #0:0.*?Video: (.*?)(?:\((.*?)\))?\s*(?:\((.*?)\))?,\s*([\w]+)(?:\(([^)]+)\))?,\s*(\d+x\d+)[^,]*,\s*(\d+)\s*kb\/s,\s*(\d+)\s*fps/;
    const videoRegex =
      /Stream #0:(\d+)(?:.*)?: Video: ([\w\d]+)(?:\((.*?)\))?.*?, ([\w]+)(?:\(([^)]+)\))?, (\d+x\d+)[^,]*, (?:(?:(\d+) kb\/s)|(?:.+?)), (\d+(?:\.\d+)?) fps/;
    const videoMatch = outputData.match(videoRegex);

    // Parse audio stream with improved regex
    const audioRegex =
      /Stream #0:1.*?Audio: (.*?)(?:\((.*?)\))?\s*(?:\((.*?)\))?,\s*(\d+)\s*Hz,\s*([\w]+),\s*([\w]+),\s*(\d+)\s*kb\/s/;
    const audioMatch = outputData.match(audioRegex);

    // Improved metadata parsing
    const globalMetadata = {};
    const videoMetadata = {};
    const audioMetadata = {};

    // Parse all metadata sections
    const sections = outputData.split("Metadata:");
    sections.forEach((section, index) => {
      if (index === 0) return; // Skip the first split which is pre-metadata

      const lines = section.split("\n");
      const metadata = {};

      lines.forEach((line) => {
        const match = line.match(/^\s*([\w_]+)\s*:\s*(.+)/);
        if (match) {
          metadata[match[1]] = match[2].trim();
        }
      });

      // Determine which metadata section we're in based on the content
      if (section.includes("Stream #0:0")) {
        Object.assign(videoMetadata, metadata);
      } else if (section.includes("Stream #0:1")) {
        Object.assign(audioMetadata, metadata);
      } else {
        Object.assign(globalMetadata, metadata);
      }
    });

    const result = {
      input: {
        filename: file.name,
        size: {
          raw: file.size,
          formatted: formatSize(file.size),
        },
        container: {
          raw: format.split(",")[0],
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
      video: videoMatch
        ? {
            codec: {
              raw: videoMatch[1].split(" ")[0],
              profile: videoMatch[2] || null,
              encoder: videoMatch[3] || null,
              full:
                videoMatch[1] +
                (videoMatch[2] ? ` (${videoMatch[2]})` : "") +
                (videoMatch[3] ? ` (${videoMatch[3]})` : ""),
            },
            pixelFormat: {
              raw: videoMatch[4],
              properties: videoMatch[5] || null,
              full: videoMatch[4] + (videoMatch[5] ? `(${videoMatch[5]})` : ""),
            },
            resolution: {
              raw: videoMatch[6],
              width: parseInt(videoMatch[6].split("x")[0]),
              height: parseInt(videoMatch[6].split("x")[1]),
            },
            bitrate: {
              raw: parseInt(videoMatch[7]),
              formatted: `${videoMatch[7]} kb/s`,
            },
            fps: {
              raw: parseInt(videoMatch[8]),
              formatted: `${videoMatch[8]} fps`,
            },
          }
        : null,
      audio: audioMatch
        ? {
            codec: {
              raw: audioMatch[1].split(" ")[0],
              profile: audioMatch[2] || null,
              encoder: audioMatch[3] || null,
              full:
                audioMatch[1] +
                (audioMatch[2] ? ` (${audioMatch[2]})` : "") +
                (audioMatch[3] ? ` (${audioMatch[3]})` : ""),
            },
            sampleRate: {
              raw: parseInt(audioMatch[4]),
              formatted: `${audioMatch[4]} Hz`,
            },
            channels: {
              raw: audioMatch[5],
              count:
                audioMatch[5] === "stereo"
                  ? 2
                  : audioMatch[5] === "mono"
                    ? 1
                    : parseInt(audioMatch[5]) || null,
            },
            format: audioMatch[6],
            bitrate: {
              raw: parseInt(audioMatch[7]),
              formatted: `${audioMatch[7]} kb/s`,
            },
          }
        : null,
      metadata: globalMetadata,
    };

    console.log("Parsed result:", result); // Debug log
    return result;
  } catch (error) {
    console.error("FFmpeg error:", error);
    throw error;
  }
}

function timeToSeconds(timeString) {
  const [hours, minutes, seconds] = timeString.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
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
