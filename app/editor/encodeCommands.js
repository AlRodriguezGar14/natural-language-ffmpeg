// Example utility functions for command building
function buildTrimCommand(fileInfo, startTime, duration) {
  return [
    "-i",
    fileInfo.input.filename,
    "-ss",
    startTime,
    "-t",
    duration,
    "-c:v",
    fileInfo.video.codec.raw,
    "-c:a",
    fileInfo.audio.codec.raw,
    "output.mp4",
  ];
}

function buildCropCommand(fileInfo, width, height, x, y) {
  return [
    "-i",
    fileInfo.input.filename,
    "-vf",
    `crop=${width}:${height}:${x}:${y}`,
    "-c:a",
    "copy",
    "output.mp4",
  ];
}

function buildReencodeCommand(fileInfo, quality = "medium") {
  const videoBitrate = Math.round(fileInfo.video.bitrate.raw * 0.8); // 80% of original
  return [
    "-i",
    fileInfo.input.filename,
    "-c:v",
    "libx264",
    "-preset",
    quality,
    "-b:v",
    `${videoBitrate}k`,
    "-c:a",
    "aac",
    "-b:a",
    `${fileInfo.audio.bitrate.raw}k`,
    "output.mp4",
  ];
}

// Usage examples:
const trim = buildTrimCommand(fileInfo, "00:00:10", "00:00:30");
const crop = buildCropCommand(
  fileInfo,
  fileInfo.video.resolution.width - 100, // width
  fileInfo.video.resolution.height - 100, // height
  50, // x offset
  50, // y offset
);
const reencode = buildReencodeCommand(fileInfo, "medium");
