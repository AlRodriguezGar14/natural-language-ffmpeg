# Natural FFmpeg

Natural FFmpeg is a human-readable syntax for video processing that automatically translates to complex FFmpeg commands. It makes video editing accessible to everyone by providing a simple, intuitive language that handles the complexity of FFmpeg behind the scenes.

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

## Features

*   **Human-Readable Syntax:** Write video editing commands in a simple, intuitive language.
*   **Automatic Translation:** Automatically translate natural language commands to FFmpeg syntax.
*   **Command Optimization:** Automatically optimize commands for faster processing.
*   **Web-Based UI:** A simple, web-based UI for writing and testing commands.
*   **File Analysis:** Analyze media files to get information about their properties.
*   **Extensible:** The language is designed to be extensible, with support for new commands and features.

## Project Structure

The project is a monorepo with the following structure:

*   `app/`: The main Next.js application, including the editor, dictionary, and parser.
*   `components/`: Shared UI components used throughout the application.
*   `lib/`: Shared libraries and types used by the application.
*   `public/`: Static assets, including the FFmpeg WASM build.

## Natural FFmpeg Language

The Natural FFmpeg Language is a simple, line-based language for describing video editing operations. Each line represents a single command, and commands are executed in the order they are written.

For a complete list of commands and their syntax, please see the [Dictionary](/app/docs/page.tsx).

## UI Components

The project uses a custom component library built with [shadcn/ui](https://ui.shadcn.com/). The components are designed to be simple, reusable, and easy to customize.

For a complete list of components and their usage, please see the [components](/components) directory.

## Todo List


- [x] **Expand the dictionary with the exact options for each command**

  - [x] Document all valid parameters for each command
  - [x] Add validation rules for each parameter
  - [x] Include examples for complex operations

- [ ] **Make arguments optional**

  - [ ] Update parser logic to correctly handle omitted optional tokens.
  - [ ] Implement default values for commands when optional arguments are not provided.
  - [ ] The current parser structure defines tokens as `optional: false`, requiring all arguments to be present.

- [ ] **Implement the `burn` command**
    - [ ] The command is designed to support `text`, `image` and `subtitles` as `contentTypes`, but is not implemented yet

- [ ] **Expand the `convert` command**
    - [ ] The command should be expanded to support more output formats
    - [ ] It should also validate that the conversion is from a valid format to another valid format

- [ ] **Expand the `compress` command**
    - [ ] The command should be expanded to allow for more granular control over the compression settings

- [ ] **Expand the burn-in text to receive color and transparency as arguments**

  - [ ] Allow color specification (hex, RGB, named colors)
  - [ ] Add transparency/alpha channel support
  - [ ] Support font selection and sizing options
  - [ ] Implement `alignment` and `margin` for the `add_text` command

- [ ] **Add new filters**

  - [ ] Remove duplicate frames in x pattern
  - [ ] Add denoising filters
  - [ ] Support advanced color grading
  - [ ] Implement speed adjustment (slow motion, time-lapse)

- [ ] **Improve error handling and validation**

  - [ ] Provide more helpful error messages from the compiler
  - [ ] Implement syntax checking before processing

- [ ] **Implement a User-Defined Command System**

  - [ ] **Refactor the Parser and Compiler for Extensibility:**
    - [ ] Modify the parser to load commands from a dynamic source instead of the hardcoded `commandPatterns` array.

  - [ ] **Implement a Persistence Layer for Custom Commands:**
    - [ ] Create a service to manage custom commands, with functions like `addCommand`, `getCommands`, and `deleteCommand`.

  - [ ] **Create a UI for Command Management:**
    - [ ] Design and build a new page or modal for users to add, edit, and delete their custom commands.
    - [ ] The UI should include a form with fields for the command name, its arguments (tokens), and the corresponding FFmpeg command template.

  - [ ] **Develop a "Command Template" System:**
    - [ ] Create a system that allows users to define FFmpeg templates with placeholders for arguments (e.g., `dejudder=cycle=<sensitivity>`).
    - [ ] The compiler will need to be able to take the user's input and correctly substitute the arguments into the template.

  - [ ] **Update Documentation:**
    - [ ] Add a new section to the documentation that explains how to create, manage, and use custom commands.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the Natural FFmpeg Language documentation and examples.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
