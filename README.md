# Natural FFmpeg Language

Natural FFmpeg Language is a human-readable syntax for video processing that automatically translates to complex FFmpeg commands. It makes video editing accessible to everyone by providing a simple, intuitive language that handles the complexity of FFmpeg behind the scenes.

## Overview

This project provides a dictionary and translator for Natural FFmpeg Language, allowing users to write simple commands that are automatically optimized and converted to proper FFmpeg syntax.

Example:

```
# Natural Language
crop 100px from left
scale to 1280x720 preserve aspect ratio
fade in for 2s

# Automatically converts to FFmpeg
ffmpeg -i input.mp4 -vf "crop=1820:1080:100:0,scale=1280:720:force_original_aspect_ratio=decrease,fade=in:0:2" output.mp4
```

## Todo List

- [ ] **Expand the dictionary with the exact options for each command**

  - [ ] Document all valid parameters for each command
  - [ ] Add validation rules for each parameter
  - [ ] Include examples for complex operations

- [ ] **Make arguments optional**

  - [ ] Implement default values for common parameters
  - [ ] Add fallback behavior when arguments are missing
  - [ ] Improve error handling for partial commands

- [ ] **Expand the burn-in text to receive color and transparency as arguments**

  - [ ] Allow color specification (hex, RGB, named colors)
  - [ ] Add transparency/alpha channel support
  - [ ] Support font selection and sizing options

- [ ] **Add new filters**

  - [ ] Remove duplicate frames in x pattern
  - [ ] Add denoising filters
  - [ ] Support advanced color grading
  - [ ] Implement speed adjustment (slow motion, time-lapse)

- [ ] **Improve error handling and validation**

  - [ ] Provide more helpful error messages
  - [ ] Implement syntax checking before processing

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Natural FFmpeg Language documentation and examples.
