// Shared types for the Natural FFmpeg parser and compiler

// File information interface
export interface FileInfo {
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
  videoStreams?: Array<{
    codec?: string;
    resolution?: string;
    bitrate?: string;
  }>;
  audioStreams?: Array<{
    codec?: string;
    sampleRate?: string;
    channels?: string;
  }>;
  metadata?: Record<string, string>;
}

// Command parameter types
export interface TrimParams {
  start: string;
  end: string;
}

export interface ConvertParams {
  outputFormat: string;
}

export interface CompressParams {
  bucket: "video" | "audio";
}

export interface ScaleParams {
  width: string;
  height: string;
  aspectRatio: "preserve" | "ignore";
}

export interface CropParams {
  cropSize: string;
  side: "top" | "bottom" | "left" | "right" | "width" | "height" | "each";
}

export interface OptimizedCropParams {
  leftCrop: number;
  rightCrop: number;
  topCrop: number;
  bottomCrop: number;
  isOptimized: boolean;
}

export interface FadeParams {
  operation: "in" | "out" | "in/out";
  duration: string;
}

export interface ContentOverlayParams {
  content: string;
  contentType: "text" | "image" | "subtitles";
  position: string;
}

export interface TextOverlayParams {
  text: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  alignment?: "left" | "center" | "right";
  margin?: number;
}

export interface CommentParams {
  content: string;
}

// Union type for all command parameters
export type CommandParams = 
  | TrimParams
  | ConvertParams
  | CompressParams
  | ScaleParams
  | CropParams
  | OptimizedCropParams
  | FadeParams
  | ContentOverlayParams
  | TextOverlayParams
  | CommentParams;

// Command types enum
export type CommandType = 
  | "Trim"
  | "Convert"
  | "Compress"
  | "Scale"
  | "Crop"
  | "OptimizedCrop"
  | "Fade"
  | "ContentOverlay"
  | "TextOverlay"
  | "Comment";

// Main Command interface
export interface Command {
  type: CommandType;
  params: CommandParams;
}

// Type guards for command parameters
export function isTrimCommand(command: Command): command is Command & { params: TrimParams } {
  return command.type === "Trim";
}

export function isConvertCommand(command: Command): command is Command & { params: ConvertParams } {
  return command.type === "Convert";
}

export function isCompressCommand(command: Command): command is Command & { params: CompressParams } {
  return command.type === "Compress";
}

export function isScaleCommand(command: Command): command is Command & { params: ScaleParams } {
  return command.type === "Scale";
}

export function isCropCommand(command: Command): command is Command & { params: CropParams } {
  return command.type === "Crop";
}

export function isOptimizedCropCommand(command: Command): command is Command & { params: OptimizedCropParams } {
  return command.type === "OptimizedCrop";
}

export function isFadeCommand(command: Command): command is Command & { params: FadeParams } {
  return command.type === "Fade";
}

export function isContentOverlayCommand(command: Command): command is Command & { params: ContentOverlayParams } {
  return command.type === "ContentOverlay";
}

export function isTextOverlayCommand(command: Command): command is Command & { params: TextOverlayParams } {
  return command.type === "TextOverlay";
}

export function isCommentCommand(command: Command): command is Command & { params: CommentParams } {
  return command.type === "Comment";
}

// Parser result interface
export interface ParserResult {
  errors: string[];
  commands: Command[];
  parsedCommands: string[];
}

// Compiler interfaces
export interface ProcessedCommand {
  type: "input" | "video-filter" | "audio-filter" | "output" | "global";
  value: string;
  order: number;
}

export interface CropAccumulator {
  leftCrop: number;
  rightCrop: number;
  topCrop: number;
  bottomCrop: number;
}

export interface ToFfmpegProps {
  commands: Command[];
  fileInfo: FileInfo;
}

// Parser interfaces
export interface CommandPattern {
  name: string;
  expectedTokens: {
    position: number;
    expected: string | RegExp | null;
    paramName?: string;
    optional: boolean;
  }[];
  validate: (params: Record<string, string>) => boolean | string;
  createNode: (params: Record<string, string>) => Command;
}

export type Result =
  | { success: false; lastIndex: number; error: string }
  | { success: true; lastIndex: number; node: Command; source: string; error: undefined }