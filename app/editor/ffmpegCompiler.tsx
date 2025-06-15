interface FileInfo {
  input?: {
    filename?: string;
    size?: { formatted?: string };
    container?: { raw?: string };
    duration?: { formatted?: string };
    bitrate?: { formatted?: string };
  };
  video?: {
    codec?: { full?: string; raw?: string };
    pixelFormat?: { full?: string; raw?: string };
    resolution?: { raw?: string };
    bitrate?: { formatted?: string };
    fps?: { formatted?: string };
  };
  audio?: {
    codec?: { full?: string; raw?: string };
    sampleRate?: { formatted?: string };
    channels?: { raw?: string; count?: number };
    format?: string;
    bitrate?: { formatted?: string };
  };
  videoStreams?: any[];
  audioStreams?: any[];
  metadata?: any;
}

interface Command {
  type: string;
  params: Record<string, any>;
}
interface ToFfmpegProps {
  commands: Command[];
  fileInfo: FileInfo;
}

function buildCropFilter(
  cropSize: string,
  side: string,
  fileInfo?: FileInfo,
): string {
  const size = parseInt(cropSize.replace("px", ""));

  let videoWidth, videoHeight;
  let outputWidth, outputHeight, xOffset, yOffset;

  if (fileInfo?.video?.resolution?.raw) {
    const [w, h] = fileInfo.video.resolution.raw.split("x").map(Number);
    videoWidth = w;
    videoHeight = h;
  } else {
    // When we don't know dimensions, we MUST use FFmpeg variables
    // because we can't do the math
    return buildCropFilterWithVariables(cropSize, side);
  }

  // Special case: automatic black border detection
  if (size === 0) {
    return "cropdetect=24:16:0";
  }

  // Calculate actual numeric values
  switch (side) {
    case "left":
      // Remove pixels from the LEFT side
      outputWidth = videoWidth - size;
      outputHeight = videoHeight;
      xOffset = size; // Skip the left pixels
      yOffset = 0;
      break;

    case "right":
      // Remove pixels from the RIGHT side
      outputWidth = videoWidth - size;
      outputHeight = videoHeight;
      xOffset = 0; // Start from left edge
      yOffset = 0;
      break;

    case "top":
      // Remove pixels from the TOP
      outputWidth = videoWidth;
      outputHeight = videoHeight - size;
      xOffset = 0;
      yOffset = size; // Skip the top pixels
      break;

    case "bottom":
      // Remove pixels from the BOTTOM
      outputWidth = videoWidth;
      outputHeight = videoHeight - size;
      xOffset = 0;
      yOffset = 0; // Start from top edge
      break;

    case "width":
      // Remove pixels equally from BOTH left and right
      outputWidth = videoWidth - size * 2;
      outputHeight = videoHeight;
      xOffset = size; // Center horizontally
      yOffset = 0;
      break;

    case "height":
      // Remove pixels equally from BOTH top and bottom
      outputWidth = videoWidth;
      outputHeight = videoHeight - size * 2;
      xOffset = 0;
      yOffset = size; // Center vertically
      break;

    case "each":
      // Remove pixels from ALL four sides equally
      outputWidth = videoWidth - size * 2;
      outputHeight = videoHeight - size * 2;
      xOffset = size; // Center horizontally
      yOffset = size; // Center vertically
      break;

    default:
      outputWidth = videoWidth - size;
      outputHeight = videoHeight;
      xOffset = 0;
      yOffset = 0;
  }

  // Validation: ensure positive dimensions
  if (outputWidth <= 0 || outputHeight <= 0) {
    const errMessage = `crop={Crop operation would result in invalid dimensions: ${outputWidth}x${outputHeight}}`;
    return errMessage;
  }

  // Return with calculated numeric values
  return `crop=${outputWidth}:${outputHeight}:${xOffset}:${yOffset}`;
}

// Fallback function when we don't know video dimensions
function buildCropFilterWithVariables(cropSize: string, side: string): string {
  const size = parseInt(cropSize.replace("px", ""));

  // When using variables, FFmpeg can handle the math
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

export function ToFfmpeg({ commands, fileInfo }: ToFfmpegProps) {
  const translateToFfmpeg = (commands: Command[], fileInfo: FileInfo) => {
    const ffmpegArgs: string[] = [];

    commands.forEach((command) => {
      switch (command.type) {
        case "Trim":
          // ffmpegArgs.push(`-ss ${command.params.start}`);
          // ffmpegArgs.push(`-to ${command.params.end}`);
          break;
        case "TextOverlay":
          // const text = command.params.text.replace(/"/g, "");
          // ffmpegArgs.push(
          //   `-vf drawtext=text='${text}':fontsize=24:fontcolor=white:x=10:y=10`
          // );
          break;
        case "Scale":
          // ffmpegArgs.push(
          //   `-vf scale=${command.params.width}:${command.params.height}`
          // );
          break;
        case "Crop":
          ffmpegArgs.push(`-vf 
            ${buildCropFilter(
              command.params.cropSize,
              command.params.side,
              fileInfo,
            )}
              `);
          // ffmpegArgs.push(`w: ${width} h ${height}`);
          // Add crop logic based on your params
          break;
        case "Convert":
          // ffmpegArgs.push(`-f ${command.params.outputFormat}`);
          break;
        case "Fade":
          // if (command.params.operation === "in") {
          //   ffmpegArgs.push(`-vf fade=in:0:${command.params.duration}`);
          // }
          break;
        default:
          // console.warn(`Unknown command type: ${command.type}`);
          break;
      }
    });

    {
      /** TODO: Cleanup the ffmpeg commands and reorder them so that there are no multiple filters overwriting each other */
    }
    return ffmpegArgs.join(" ");
  };

  return (
    <div className="mb-4 p-4  rounded">
      <div className="bg-black text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
        <code>
          ffmpeg -i {fileInfo.input?.filename}{" "}
          {translateToFfmpeg(commands, fileInfo)} output.mp4
        </code>
      </div>
      {/* <pre className="text-white">{JSON.stringify(fileInfo, null, 2)}</pre> */}
    </div>
  );
}
