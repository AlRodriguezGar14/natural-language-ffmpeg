# Native File Selector Integration with Parser

## Overview

The editor includes native file selector integration that works with the parser using specific command patterns. This provides a seamless way to select input files and subtitle files directly within your natural language FFmpeg commands.

## How it Works

### Command Patterns

#### Input File Selection

- Use the command `input /` to trigger the input file selector
- The parser recognizes "input" as a command and "/" as a file selector trigger
- Only ONE input command is allowed per command set

#### Subtitle File Selection

- Use the command `burn subtitles /` to trigger the subtitle file selector
- The parser recognizes "burn subtitles" as a command and "/" as a file selector trigger
- Specifically filters for subtitle files (.srt, .ass, .vtt)

### File Selection Process

1. **Type Command**: Type "input /" in the textarea
2. **Auto-trigger**: File selector opens automatically after typing "/"
3. **File Analysis**: Selected file is analyzed using FFmpeg
4. **Path Replacement**: "input /" becomes "input filename.ext"
5. **Parser Integration**: File becomes available for subsequent commands

### Valid Usage Patterns

#### Input File Example

```text
input /
crop 200px from left
trim from 10 to 20
convert to mp4
```

After file selection becomes:

```text
input myvideo.mp4
crop 200px from left
trim from 10 to 20
convert to mp4
```

#### Subtitle File Example

```text
input /
burn subtitles /
crop 200px from left
convert to mp4
```

After both file selections become:

```text
input myvideo.mp4
burn subtitles mysubtitles.srt
crop 200px from left
convert to mp4
```

### Validation Rules

- Only ONE "input" command is allowed per command set
- Multiple "burn subtitles" commands are allowed for different subtitle tracks
- Attempting to add multiple input commands shows a helpful comment
- To select a different input file, delete the existing input line
- File selector only opens when the complete command pattern is typed
- Each file selector type (input/subtitle) has appropriate file filters

### File Types Supported

#### Input Files

- **Video**: mp4, avi, mov, mkv, webm
- **Audio**: mp3, wav, flac, aac
- **Images**: jpg, jpeg, png, gif

#### Subtitle Files

- **Subtitle Formats**: srt, ass, vtt

### Visual Feedback

- "input" and "burn subtitles" keywords are highlighted as commands
- File paths are highlighted with purple color and underlined
- Helpful comments appear for multiple input attempts
- Loading indicator shows during file analysis
- File selector adapts to command type (input vs subtitle files)

### Error Handling

- **Multiple Inputs**: "Only one input command is allowed per command set"
- **Invalid Position**: "input /" must be typed as a complete command
- **File Analysis Errors**: Reset to "input /" state on analysis failure

## Technical Implementation

- **Parser Integration**: "input" and "burn subtitles" are recognized command patterns
- **Command Validation**: Ensures single input per command set
- **File Analysis**: Automatic FFmpeg probing on input file selection
- **State Management**: Tracks existing input commands and file selector types
- **Error Prevention**: Blocks multiple input attempts with helpful feedback
- **File Type Filtering**: Adapts file selector accept attribute based on command type
- **Dual Pattern Support**: Handles both input and subtitle file selection patterns

## Migration from Previous Version

The file selector now requires specific command prefixes:

- **Old**: Type "/" anywhere → file selector
- **New**: Type "input /" → input file selector with parser integration
- **New**: Type "burn subtitles /" → subtitle file selector with parser integration

This provides better integration with the natural language parser and prevents accidental file selector triggers.
