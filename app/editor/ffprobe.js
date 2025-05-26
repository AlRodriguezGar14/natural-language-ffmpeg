"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

let ffmpeg = null;

export async function loadFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  try {
    console.log("Loading FFmpeg...");
    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });
    console.log("FFmpeg loaded successfully");
    return ffmpeg;
  } catch (error) {
    console.error("FFmpeg load error:", error);
    throw new Error("Failed to load FFmpeg");
  }
}

export async function probeFile(file) {
  console.log("Starting probe for file:", file.name);
  const ffmpeg = await loadFFmpeg();

  try {
    console.log("Writing file to FFmpeg filesystem...");
    const fileData = await fetchFile(file);
    await ffmpeg.writeFile(file.name, fileData);
    console.log("File written successfully");

    let outputData = "";

    // Set up logging
    const logHandler = ({ message }) => {
      console.log("FFmpeg log:", message);
      outputData += message + "\n";
    };

    ffmpeg.on("log", logHandler);

    console.log("Running ffprobe command...");
    await ffmpeg.exec([
      "-i",
      file.name,
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,codec_name,duration",
      "-of",
      "json",
    ]);

    console.log("Raw output:", outputData);

    // Clean up
    console.log("Cleaning up...");
    await ffmpeg.deleteFile(file.name);
    ffmpeg.off("log", logHandler);

    try {
      // Look for JSON in the output
      const jsonMatch = outputData.match(/{\s*".*}$/m);
      if (jsonMatch) {
        console.log("Found JSON data:", jsonMatch[0]);
        return JSON.parse(jsonMatch[0]);
      } else {
        console.log("No JSON found in output");
        // Return basic file info if we can't get detailed probe
        return {
          filename: file.name,
          size: file.size,
          type: file.type,
        };
      }
    } catch (parseError) {
      console.error("Parse error:", parseError);
      // Return basic file info on parse error
      return {
        filename: file.name,
        size: file.size,
        type: file.type,
      };
    }
  } catch (error) {
    console.error("FFmpeg error:", error);
    throw error;
  }
}
