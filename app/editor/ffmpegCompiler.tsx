import {
  Command,
  FileInfo,
  ProcessedCommand,
  CropAccumulator,
  ToFfmpegProps,
  OptimizedCropParams,
  TrimParams,
  CropParams,
  ScaleParams,
  TextOverlayParams,
  FadeParams,
  ContentOverlayParams,
  CompressParams,
  ConvertParams,
} from "../../lib/types";

// Command processing order (lower numbers execute first)
const COMMAND_ORDER = {
  // Input timing commands (before -i)
  "input-trim": 10,

  // Global options (after -i)
  global: 20,

  // Video filters (combined into single -vf)
  "video-filter": 30,

  // Audio filters (combined into single -af)
  "audio-filter": 40,

  // Output format/codec
  "output-format": 50,
  "output-codec": 60,
};

function optimizeCrops(commands: Command[], fileInfo?: FileInfo): Command[] {
  const cropCommands = commands.filter((cmd) => cmd.type === "Crop");
  const otherCommands = commands.filter((cmd) => cmd.type !== "Crop");

  if (cropCommands.length <= 1) return commands;

  console.log(`Optimizing ${cropCommands.length} crop commands...`);

  // Initialize crop accumulator
  const accumulator: CropAccumulator = {
    leftCrop: 0,
    rightCrop: 0,
    topCrop: 0,
    bottomCrop: 0,
  };

  // Process each crop command and accumulate the values
  cropCommands.forEach((cmd, index) => {
    const cropParams = cmd.params as CropParams;
    const size = parseInt(cropParams.cropSize.replace("px", ""));
    const side = cropParams.side;

    console.log(`Processing crop ${index + 1}: ${size}px from ${side}`);

    switch (side) {
      case "left":
        accumulator.leftCrop += size;
        break;
      case "right":
        accumulator.rightCrop += size;
        break;
      case "top":
        accumulator.topCrop += size;
        break;
      case "bottom":
        accumulator.bottomCrop += size;
        break;
      case "width":
        // Crop equally from both sides
        accumulator.leftCrop += size;
        accumulator.rightCrop += size;
        break;
      case "height":
        // Crop equally from top and bottom
        accumulator.topCrop += size;
        accumulator.bottomCrop += size;
        break;
      case "each":
        // Crop from all four sides
        accumulator.leftCrop += size;
        accumulator.rightCrop += size;
        accumulator.topCrop += size;
        accumulator.bottomCrop += size;
        break;
      default:
        console.warn(`Unknown crop side: ${side}`);
    }
  });

  console.log("Final crop accumulator:", accumulator);

  // Create single optimized crop command
  const optimizedCrop = createOptimizedCropCommand(accumulator, fileInfo);

  // Return commands with optimized crop
  return [optimizedCrop, ...otherCommands];
}

function createOptimizedCropCommand(
  accumulator: CropAccumulator,
  fileInfo?: FileInfo
): Command {
  // Validate that we don't crop more than the video dimensions
  if (fileInfo?.video?.resolution?.raw) {
    const [width, height] = fileInfo.video.resolution.raw
      .split("x")
      .map(Number);

    const totalWidthCrop = accumulator.leftCrop + accumulator.rightCrop;
    const totalHeightCrop = accumulator.topCrop + accumulator.bottomCrop;

    if (totalWidthCrop >= width) {
      throw new Error(
        `Total width crop (${totalWidthCrop}px) exceeds video width (${width}px)`
      );
    }

    if (totalHeightCrop >= height) {
      throw new Error(
        `Total height crop (${totalHeightCrop}px) exceeds video height (${height}px)`
      );
    }
  }

  return {
    type: "OptimizedCrop",
    params: {
      leftCrop: accumulator.leftCrop,
      rightCrop: accumulator.rightCrop,
      topCrop: accumulator.topCrop,
      bottomCrop: accumulator.bottomCrop,
      isOptimized: true,
    } as OptimizedCropParams,
  };
}
// Build individual filter functions
function buildCropFilter(
  cropSize: string,
  side: string,
  fileInfo?: FileInfo
): string {
  const size = parseInt(cropSize.replace("px", ""));

  if (fileInfo?.video?.resolution?.raw) {
    const [w, h] = fileInfo.video.resolution.raw.split("x").map(Number);

    if (size === 0) return "cropdetect=24:16:0";

    let outputWidth, outputHeight, xOffset, yOffset;

    switch (side) {
      case "left":
        outputWidth = w - size;
        outputHeight = h;
        xOffset = size;
        yOffset = 0;
        break;
      case "right":
        outputWidth = w - size;
        outputHeight = h;
        xOffset = 0;
        yOffset = 0;
        break;
      case "top":
        outputWidth = w;
        outputHeight = h - size;
        xOffset = 0;
        yOffset = size;
        break;
      case "bottom":
        outputWidth = w;
        outputHeight = h - size;
        xOffset = 0;
        yOffset = 0;
        break;
      case "width":
        outputWidth = w - size * 2;
        outputHeight = h;
        xOffset = size;
        yOffset = 0;
        break;
      case "height":
        outputWidth = w;
        outputHeight = h - size * 2;
        xOffset = 0;
        yOffset = size;
        break;
      case "each":
        outputWidth = w - size * 2;
        outputHeight = h - size * 2;
        xOffset = size;
        yOffset = size;
        break;
      default:
        outputWidth = w - size;
        outputHeight = h;
        xOffset = 0;
        yOffset = 0;
    }

    if (outputWidth <= 0 || outputHeight <= 0) {
      throw new Error(
        `Invalid crop dimensions: ${outputWidth}x${outputHeight}`
      );
    }

    return `crop=${outputWidth}:${outputHeight}:${xOffset}:${yOffset}`;
  } else {
    // Fallback to variables
    if (size === 0) return "cropdetect=24:16:0";

    switch (side) {
      case "left":
        return `crop=iw-${size}:ih:${size}:0`;
      case "right":
        return `crop=iw-${size}:ih:0:0`;
      case "top":
        return `crop=iw:ih-${size}:0:${size}`;
      case "bottom":
        return `crop=iw:ih-${size}:0:0`;
      case "width":
        return `crop=iw-${size * 2}:ih:${size}:0`;
      case "height":
        return `crop=iw:ih-${size * 2}:0:${size}`;
      case "each":
        return `crop=iw-${size * 2}:ih-${size * 2}:${size}:${size}`;
      default:
        return `crop=iw-${size}:ih:0:0`;
    }
  }
}

function buildScaleFilter(
  width: string,
  height: string,
  aspectRatio: string
): string {
  if (aspectRatio === "preserve") {
    return `scale=${width}:${height}:force_original_aspect_ratio=decrease`;
  }
  return `scale=${width}:${height}`;
}

function buildTextOverlayFilter(
  text: string,
  position: string
  //alignment?: string,
): string {
  const cleanText = text.replace(/"/g, "");

  // Position mapping
  const positions = {
    center: "x=(w-text_w)/2:y=(h-text_h)/2",
    "top-left": "x=10:y=10",
    "top-right": "x=w-text_w-10:y=10",
    "bottom-left": "x=10:y=h-text_h-10",
    "bottom-right": "x=w-text_w-10:y=h-text_h-10",
  };

  const pos =
    positions[position as keyof typeof positions] || positions["center"];

  return `drawtext=text='${cleanText}':fontsize=24:fontcolor=white:${pos}`;
}

function buildFadeFilter(operation: string, duration: string): string {
  const durationSecs = duration.replace("s", "");

  if (operation === "in") {
    return `fade=in:0:${durationSecs}`;
  } else if (operation === "out") {
    return `fade=out:st=0:d=${durationSecs}`;
  }

  return `fade=${operation}:0:${durationSecs}`;
}

function buildContentOverlayFilter(
  content: string,
  contentType: string
  //position: string,
): string {
  const cleanContent = content.replace(/"/g, "");

  if (contentType === "subtitles") {
    return `subtitles=${cleanContent}`;
  }

  // For other content types, could add image overlay, etc.
  return `overlay=${cleanContent}`;
}

function buildOptimizedCropFilter(
  params: OptimizedCropParams,
  fileInfo?: FileInfo
): string {
  const { leftCrop, rightCrop, topCrop, bottomCrop } = params;

  // If no cropping needed, return empty
  if (leftCrop === 0 && rightCrop === 0 && topCrop === 0 && bottomCrop === 0) {
    return "";
  }

  if (fileInfo?.video?.resolution?.raw) {
    const [originalWidth, originalHeight] = fileInfo.video.resolution.raw
      .split("x")
      .map(Number);

    // Calculate final dimensions and position
    const outputWidth = originalWidth - leftCrop - rightCrop;
    const outputHeight = originalHeight - topCrop - bottomCrop;
    const xOffset = leftCrop; // Start after left crop
    const yOffset = topCrop; // Start after top crop

    console.log(
      `Optimized crop: ${originalWidth}x${originalHeight} -> ${outputWidth}x${outputHeight} at ${xOffset},${yOffset}`
    );

    return `crop=${outputWidth}:${outputHeight}:${xOffset}:${yOffset}`;
  } else {
    // Use FFmpeg variables when dimensions unknown
    let widthExpr = "iw";
    let heightExpr = "ih";

    if (leftCrop + rightCrop > 0) {
      widthExpr = `iw-${leftCrop + rightCrop}`;
    }

    if (topCrop + bottomCrop > 0) {
      heightExpr = `ih-${topCrop + bottomCrop}`;
    }

    return `crop=${widthExpr}:${heightExpr}:${leftCrop}:${topCrop}`;
  }
}

// Main function to process and reorder commands
// Updated main processing function
function processAndReorderCommands(
  commands: Command[],
  fileInfo: FileInfo
): string {
  // First, optimize crops
  const optimizedCommands = optimizeCrops(commands, fileInfo);

  console.log(
    `Original commands: ${commands.length}, Optimized: ${optimizedCommands.length}`
  );

  const processedCommands: ProcessedCommand[] = [];
  const videoFilters: string[] = [];
  const audioFilters: string[] = [];

  // Process optimized commands
  optimizedCommands.forEach((command) => {
    try {
      switch (command.type) {
        case "Trim": {
          const params = command.params as TrimParams;
          processedCommands.push({
            type: "input",
            value: `-ss ${params.start} -to ${params.end}`,
            order: COMMAND_ORDER["input-trim"],
          });
          break;
        }
        case "Crop": {
          // Regular single crop (shouldn't happen after optimization, but kept for safety)
          const params = command.params as CropParams;
          const cropFilter = buildCropFilter(
            params.cropSize,
            params.side,
            fileInfo
          );
          if (cropFilter) videoFilters.push(cropFilter);
          break;
        }
        case "OptimizedCrop": {
          // Handle optimized crop
          const params = command.params as OptimizedCropParams;
          const optimizedFilter = buildOptimizedCropFilter(params, fileInfo);
          if (optimizedFilter) videoFilters.push(optimizedFilter);
          break;
        }
        case "Scale": {
          const params = command.params as ScaleParams;
          const scaleFilter = buildScaleFilter(
            params.width,
            params.height,
            params.aspectRatio
          );
          videoFilters.push(scaleFilter);
          break;
        }
        case "TextOverlay": {
          const params = command.params as TextOverlayParams;
          const textFilter = buildTextOverlayFilter(
            params.text,
            params.position
            //params.alignment,
          );
          videoFilters.push(textFilter);
          break;
        }
        case "Fade": {
          const params = command.params as FadeParams;
          const fadeFilter = buildFadeFilter(params.operation, params.duration);
          videoFilters.push(fadeFilter);
          break;
        }
        case "ContentOverlay": {
          const params = command.params as ContentOverlayParams;
          const overlayFilter = buildContentOverlayFilter(
            params.content,
            params.contentType
            //params.position,
          );
          videoFilters.push(overlayFilter);
          break;
        }
        case "Compress": {
          const params = command.params as CompressParams;
          if (params.bucket === "video") {
            processedCommands.push({
              type: "output",
              value: "-crf 23",
              order: COMMAND_ORDER["output-codec"],
            });
          }
          break;
        }
        case "Convert": {
          const params = command.params as ConvertParams;
          processedCommands.push({
            type: "output",
            value: `-f ${params.outputFormat}`,
            order: COMMAND_ORDER["output-format"],
          });
          break;
        }
        default:
          console.warn(`Unknown command type: ${command.type}`);
      }
    } catch (error) {
      console.error(`Error processing command ${command.type}:`, error);
      processedCommands.push({
        type: "global",
        value: `# Error in ${command.type}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        order: 999,
      });
    }
  });

  // Add video filters as single -vf if any exist
  if (videoFilters.length > 0) {
    processedCommands.push({
      type: "video-filter",
      value: `-vf "${videoFilters.join(",")}"`,
      order: COMMAND_ORDER["video-filter"],
    });
  }

  // Add audio filters as single -af if any exist
  if (audioFilters.length > 0) {
    processedCommands.push({
      type: "audio-filter",
      value: `-af "${audioFilters.join(",")}"`,
      order: COMMAND_ORDER["audio-filter"],
    });
  }

  // Sort commands by order
  processedCommands.sort((a, b) => a.order - b.order);

  // Build final command
  const inputCommands = processedCommands.filter((cmd) => cmd.type === "input");
  const otherCommands = processedCommands.filter((cmd) => cmd.type !== "input");

  const inputArgs = inputCommands.map((cmd) => cmd.value).join(" ");
  const outputArgs = otherCommands.map((cmd) => cmd.value).join(" ");

  return `${inputArgs} -i ${
    fileInfo.input?.filename || "input.mp4"
  } ${outputArgs}`.trim();
}

export function ToFfmpeg({ commands, fileInfo }: ToFfmpegProps) {
  const translateToFfmpeg = (commands: Command[], fileInfo: FileInfo) => {
    try {
      return processAndReorderCommands(commands, fileInfo);
    } catch (error) {
      return `# Error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`;
    }
  };

  return (
    <div className="mb-4 p-4 rounded">
      <div className="bg-black text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
        <code>ffmpeg {translateToFfmpeg(commands, fileInfo)} output.mp4</code>
      </div>

      {/* Debug info */}
      <details className="mt-4">
        <summary className="text-white cursor-pointer">Debug Info</summary>
        <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
          <div className="text-gray-300">Commands: {commands.length}</div>
          <div className="text-gray-300">
            File: {fileInfo.input?.filename || "None"}
          </div>
          <div className="text-gray-300">
            Resolution: {fileInfo.video?.resolution?.raw || "Unknown"}
          </div>
        </div>
      </details>
    </div>
  );
}
