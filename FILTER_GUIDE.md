# Adding New Filters to Natural FFmpeg

This guide explains how to add new filters/commands to the Natural FFmpeg system using the `remove_frames` (deduplicate) filter as a reference.

## Overview

Adding a new filter requires changes to 4 main files:

1. **Types definition** (`types.ts`)
2. **Parser patterns** (`parser.ts`)
3. **Parser logic** (`parser.ts`)
4. **Compiler implementation** (`ffmpegCompiler.tsx`)

## Step-by-Step Guide

### 1. Define Types (`types.ts`)

First, create the parameter interface for your filter:

- Parameter interface defining all configurable options
- Type guard function for type safety (optional)

### 2. Add Parser Pattern (`parser.ts`)

Add your command pattern to the `commandPatterns` array:

**Pattern Structure:**

- `name`: Command identifier (used for parser lookup)
- `expectedTokens`: Array defining command syntax
  - `position`: Token position (0 = command word, 1 = first arg, etc.)
  - `expected`: String literal or regex pattern
  - `paramName`: Variable name for captured values
  - `optional`: Whether token is required
- `validate`: Function to validate parameters
- `createNode`: Function to create the Command object

### 3. Add Filter Builder (`ffmpegCompiler.tsx`)

Create the filter building function:

**Function guidelines:**

- Take typed parameters (not raw Command object)
- Return FFmpeg filter string
- Handle edge cases and validation
- Use consistent naming: `build[CommandType]Filter`

### 4. Add Compiler Case (`ffmpegCompiler.tsx`)

Add your command processing in `processAndReorderCommands`:

**Case structure:**

- Cast `command.params` to your parameter type
- Call your filter builder function
- Add result to appropriate filter array:
  - `videoFilters` for video filters
  - `audioFilters` for audio filters
  - `processedCommands` for direct arguments/codecs

## Filter Types & Destinations

### Video Filters (`videoFilters` array)

Filters that modify video content, combined into single `-vf` argument:

- Crop, Scale, Fade, TextOverlay, ContentOverlay, Deduplicate

### Audio Filters (`audioFilters` array)

Filters that modify audio content, combined into single `-af` argument:

- Volume, Audio fade, etc.

### Direct Arguments (`processedCommands` array)

Non-filter arguments like codecs, formats, timing:

- Input timing (`-ss`, `-to`)
- Output codecs (`-crf`, `-c:v`)
- Output formats (`-f mp4`)

## Command Processing Order

Commands are processed in this order (defined in `COMMAND_ORDER`):

1. **Input timing** (10) - `-ss`, `-to` (before `-i`)
2. **Global options** (20) - General settings
3. **Video filters** (30) - Combined into `-vf`
4. **Audio filters** (40) - Combined into `-af`
5. **Output format** (50) - `-f mp4`
6. **Output codec** (60) - `-crf 23`

## Example Usage

After implementing the above steps, users can write:

``` natural_language_ffmpeg
remove_frames every 4
```

Which generates:

```bash
ffmpeg -i input.mp4 -vf "decimate=cycle=4" output.mp4
```

## Common Patterns

### Simple Video Filter (you can try implementing this one)

```typescript
// Parser pattern for "blur 5px"
{ position: 1, expected: /^\d+px$/, paramName: "amount" }

// Filter builder
function buildBlurFilter(amount: string): string {
  const pixels = parseInt(amount.replace("px", ""));
  return `boxblur=${pixels}:${pixels}`;
}

// Compiler case
case "Blur": {
  const params = command.params as BlurParams;
  const blurFilter = buildBlurFilter(params.amount);
  videoFilters.push(blurFilter);
  break;
}
```

### Complex Filter with FileInfo (full implementation in ffmpegCompiler.tsx)

```typescript
function buildCropFilter(size: string, side: string, fileInfo?: FileInfo): string {
  const pixels = parseInt(size.replace("px", ""));
  if (fileInfo?.video?.resolution?.raw) {
    const [w, h] = fileInfo.video.resolution.raw.split("x").map(Number);
    // Use actual dimensions for precise calculation
    return `crop=${w-pixels}:${h}:${pixels}:0`;
  } else {
    // Fallback to FFmpeg variables
    return `crop=iw-${pixels}:ih:${pixels}:0`;
  }
}
```

## Best Practices

- **Validation**: Always validate parameters in parser patterns
- **Type Safety**: Use TypeScript interfaces and type guards
- **Error Handling**: Handle edge cases gracefully
- **FileInfo Usage**: Use file metadata when available for precise calculations
- **Fallbacks**: Provide reasonable defaults when file info unavailable
- **Consistent Naming**: Follow naming conventions for functions and types
- **Documentation**: Add comments explaining complex filter logic

This systematic approach ensures new filters integrate seamlessly with the existing architecture while maintaining type safety and error handling.
