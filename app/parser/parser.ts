import {
  CommandPattern,
  Command,
  TrimParams,
  CompressParams,
  ScaleParams,
  CropParams,
  FadeParams,
  ContentOverlayParams,
  TextOverlayParams,
  Result,
  DeduplicateParams,
} from "../../lib/types";

/**
 *  BRAINSTORM:
 * For optional values, use a prenthesis to set them (like in the natural language when you want to add additional information)
 * Then processs separatedly the parenthesis
 */

// const code = `# Example code in natural ffmpeg language
// crop 200px from left
// trim from 00:10.00 to 00:00:20.00
// burn subtitles "subs.srt" at default
// scale to 1920x1080 ignore aspect ratio
// compress video
// add_text "Hello World" at center
// trim from 10 to 20
// convert to mp4
// trim from 10:30 to 12:30
// fade in for 10s
// `;

// Tokenization Regex Pattern Breakdown:
// (?:         ) - Non-capturing group to match multiple alternatives
//   #           - Literal hash symbol (starts a comment)
//   [^\n]*     - Match zero or more characters that are NOT a newline
//               (captures everything after # until end of line)
//   \n         - Matches the newline character (ensures entire comment is captured)
//   |          - OR operator (alternative matching)
//   "          - Literal opening quote
//   [^"]*      - Match zero or more characters that are NOT a quote
//               (prevents matching nested quotes, captures string content)
//   "          - Literal closing quote
//   |          - OR operator (another alternative)
//   [^\s"#]+   - Match one or more characters that are:
//               - NOT whitespace (\s)
//               - NOT a quote (")
//               - NOT a hash symbol (#)
//   /g         - Global flag (find all matches, not just first)
const pattern = /(?:#[^\n]*\n|"[^"]*"|[^\s"#]+)/g;

export const commandPatterns: CommandPattern[] = [
  {
    name: "remove_frames",
    expectedTokens: [
      { position: 1, expected: "every", optional: false },
      { position: 2, expected: /^\d+$/, paramName: "cycle", optional: false },
    ],
    validate: (params) => {
      const cycle = parseInt(params.cycle);
      if (cycle < 2 || cycle > 30) return "Invalid cycle";
      return true;
    },
    createNode: (params) => ({
      type: "Deduplicate",
      params: {
        cycle: parseInt(params.cycle),
      } as DeduplicateParams,
    }),
  },
  {
    name: "input",
    expectedTokens: [
      {
        position: 1,
        expected:
          /\/|.*\.(mp4|avi|mov|mkv|webm|mp3|wav|flac|aac|jpg|jpeg|png|gif|srt|ass|vtt)$/i,
        paramName: "fileSelector",
        optional: false,
      },
    ],
    validate: () => {
      return true;
    },
    createNode: (params): Command => ({
      type: "Input",
      params: {
        fileSelector: params.fileSelector,
        filename: params.fileSelector !== "/" ? params.fileSelector : undefined,
      },
    }),
  },
  {
    name: "trim",
    expectedTokens: [
      { position: 1, expected: "from", optional: false },
      { position: 2, expected: /.+/, paramName: "start", optional: false },
      { position: 3, expected: "to", optional: false },
      { position: 4, expected: /.+/, paramName: "end", optional: false },
    ],
    validate: (params) => {
      return validateTrimParams(params.start, params.end);
    },
    createNode: (params): Command => ({
      type: "Trim",
      params: {
        start: params.start,
        end: params.end,
      } as TrimParams,
    }),
  },
  {
    // TODO: Validate once parsed that the conversion is from valid to valid format
    name: "convert",
    expectedTokens: [
      { position: 1, expected: "to", optional: false },
      {
        position: 2,
        expected:
          /mp4|mov|mkv|webm|gif|mp3|wav|flac|aac|ogg|png|jpg|webp|avi|mp4a/,
        paramName: "outputFormat",
        optional: false,
      },
    ],
    validate: () => {
      return true;
    },
    createNode: (params) => ({
      type: "Convert",
      params: {
        outputFormat: params.outputFormat,
      },
    }),
  },
  {
    // TODO: Select which is the optional conversion format
    name: "compress",
    expectedTokens: [
      {
        position: 1,
        expected: /video|audio/,
        paramName: "bucket",
        optional: false,
      },
    ],
    validate: () => {
      return true;
    },
    createNode: (params): Command => ({
      type: "Compress",
      params: {
        bucket: params.bucket as "video" | "audio",
      } as CompressParams,
    }),
  },
  {
    name: "scale",
    expectedTokens: [
      { position: 1, expected: "to", optional: false },
      {
        position: 2,
        expected: /[0-9]+x[0-9]+/,
        paramName: "resolution",
        optional: false,
      },
      {
        position: 3,
        expected: /preserve|ignore/,
        paramName: "aspectRatio",
        optional: false,
      },
      { position: 4, expected: "aspect", optional: false },
      { position: 5, expected: "ratio", optional: false },
    ],
    validate: () => {
      return true;
    },
    createNode: (params): Command => {
      const [width, height] = params.resolution.split("x");

      return {
        type: "Scale",
        params: {
          width: width,
          height: height,
          aspectRatio: params.aspectRatio as "preserve" | "ignore",
        } as ScaleParams,
      };
    },
  },
  {
    name: "crop",
    expectedTokens: [
      {
        position: 1,
        expected: /[0-9]+px/,
        paramName: "cropSize",
        optional: false,
      },
      { position: 2, expected: "from", optional: false },
      {
        position: 3,
        expected: /top|bottom|left|right|width|height|each/,
        paramName: "side",
        optional: false,
      },
    ],
    validate: () => {
      return true;
    },
    createNode: (params): Command => ({
      type: "Crop",
      params: {
        cropSize: params.cropSize,
        side: params.side as
          | "top"
          | "bottom"
          | "left"
          | "right"
          | "width"
          | "height"
          | "each",
      } as CropParams,
    }),
  },
  {
    name: "fade",
    expectedTokens: [
      {
        position: 1,
        expected: /in|out|in\/out/,
        paramName: "operation",
        optional: false,
      },
      { position: 2, expected: "for", optional: false },
      {
        position: 3,
        expected: /[0-9]+s/,
        paramName: "duration",
        optional: false,
      },
    ],
    validate: () => {
      return true;
    }, // TODO: The duration must be validated with the source video
    createNode: (params): Command => ({
      type: "Fade",
      params: {
        operation: params.operation as "in" | "out" | "in/out",
        duration: params.duration,
      } as FadeParams,
    }),
  },
  {
    name: "burn",
    expectedTokens: [
      {
        position: 1,
        expected: /text|image|subtitles/,
        paramName: "contentType",
        optional: false,
      },
      {
        position: 2,
        expected: /^".*"$/,
        paramName: "content",
        optional: false,
      },

      // TODO: Make these optional params
      { position: 3, expected: "at", optional: false },
      {
        position: 4,
        expected:
          /top-left|top-right|bottom-left|bottom-right|center|left|right|top|bottom|default/,
        paramName: "position",
        optional: false,
      },

      // { position: 4, expected: "aligned", optional: true },
      // {
      //   position: 5,
      //   expected: /left|center|right/,
      //   paramName: "alignment",
      //   optional: true,
      // },
      // { position: 6, expected: "with", optional: true },
      // { position: 7, expected: "margin", optional: true },
      // { position: 8, expected: /\d+px/, paramName: "margin", optional: true },
    ],
    validate: (params) => {
      if (params.contentType === "subtitles") {
        return /\.ass"$|\.srt"$/.test(params.content);
      }
      if (params.contentType === "image") {
        return /\.png"$|\.jpeg"$|\.jpg"$/.test(params.content);
      }
      return true;
    },
    createNode: (params): Command => ({
      type: "ContentOverlay",
      params: {
        content: params.content,
        contentType: params.contentType as "text" | "image" | "subtitles",
        position: params.position,
      } as ContentOverlayParams,
    }),
  },
  {
    name: "add_text",
    expectedTokens: [
      { position: 1, expected: /^".*"$/, paramName: "text", optional: false },
      { position: 2, expected: "at", optional: false },
      {
        position: 3,
        expected: /top-left|top-right|bottom-left|bottom-right|center/,
        paramName: "position",
        optional: false,
      },

      // TODO: HAndle in the future optional params
      // { position: 4, expected: "aligned", optional: true },
      // {
      //   position: 5,
      //   expected: /left|center|right/,
      //   paramName: "alignment",
      //   optional: true,
      // },
      // { position: 6, expected: "with", optional: true },
      // { position: 7, expected: "margin", optional: true },
      // { position: 8, expected: /\d+px/, paramName: "margin", optional: true },
    ],
    validate: () => {
      return true;
    },
    createNode: (params): Command => ({
      type: "TextOverlay",
      params: {
        text: params.text,
        position: params.position as
          | "top-left"
          | "top-right"
          | "bottom-left"
          | "bottom-right"
          | "center",
        alignment: params.alignment ?? "left",
        margin: params.margin ? parseInt(params.margin) : 0,
      } as TextOverlayParams,
    }),
  },
];

function validateTrimParams(start: string, end: string): boolean {
  /**
   * HH:MM:SS.ms, MM:SS or SS format
   *
   * ^                                    // Start of string
   * (?:                                 // Non-capturing group for hours/minutes (optional)
   *   (?:(\d+):)?                      // HOURS: One or more digits + colon (optional)
   *   (\d{1,2}):                       // MINUTES: 1-2 digits + colon
   * )?                                 // End of hours/minutes group
   * (\d{1,2})                          // SECONDS: 1-2 digits (required)
   * (?:\.(\d+))?                       // MILLISECONDS: Decimal point + one or more digits (optional)
   * $                                  // End of string
   *
   * Valid formats:
   * - "12"            (seconds)
   * - "12.5"          (seconds.ms)
   * - "1:23"          (minutes:seconds)
   * - "1:23.456"      (minutes:seconds.ms)
   * - "1:02:03"       (hours:minutes:seconds)
   * - "1:02:03.456"   (hours:minutes:seconds.ms)
   */
  const timePattern = /^(?:(?:(\d+):)?(\d{1,2}):)?(\d{1,2})(?:\.(\d+))?$/;

  const validateFormat = (value: string): boolean => {
    if (!timePattern.test(value)) {
      return false;
    }
    const parts = value.split(":");
    const seconds = parseFloat(parts[parts.length - 1]);
    const minutes = parts.length > 1 ? parseInt(parts[parts.length - 2]) : 0;
    const hours = parts.length > 2 ? parseInt(parts[parts.length - 3]) : 0;

    return seconds < 60 && minutes < 60 && hours < 24;
  };

  const convertToSeconds = (value: string): number => {
    if (timePattern.test(value)) {
      const parts = value.split(":");
      const seconds = parseFloat(parts[parts.length - 1]);
      const minutes = parts.length > 1 ? parseInt(parts[parts.length - 2]) : 0;
      const hours = parts.length > 2 ? parseInt(parts[parts.length - 3]) : 0;

      return hours * 3600 + minutes * 60 + seconds;
    }
    return parseFloat(value);
  };

  // First check if both formats are valid
  if (!validateFormat(start) || !validateFormat(end)) {
    return false;
  }
  // Then check if end time is greater than start time
  return convertToSeconds(end) > convertToSeconds(start);
}

function validateComment(str: string): boolean {
  return str[0] === "#" && str[str.length - 1] === "\n";
}

function validateCommandPatterns(args: string[]): Result {
  const command = args[0];
  let validated = false;
  const validator = commandPatterns.find((p) => p.name === command);
  console.log(command);
  if (!validator) {
    console.log(`Could not find a validator for ${command}`);
    return {
      success: false,
      lastIndex: 0,
      error: `Could not find a validator for ${command}`,
    };
  }

  const params: Record<string, string> = {};
  for (const tokenCheck of validator.expectedTokens) {
    const token = args[tokenCheck.position];
    if (tokenCheck.expected instanceof RegExp) {
      validated = tokenCheck.expected.test(token);
    } else {
      validated = token === tokenCheck.expected;
    }

    if (!validated) {
      return {
        success: false,
        lastIndex: tokenCheck.position,
        error: `${command}: Invalid command arguments {${token}}`,
      };
    }
    if (tokenCheck.paramName) {
      params[tokenCheck.paramName] = token;
    }
  }

  if (!validator.validate(params)) {
    return {
      success: false,
      lastIndex: args.length - 1,
      error: `Params didn't validate: {${args.join(" ")}}`,
    };
  }
  return {
    success: true,
    lastIndex: args.length - 1,
    node: validator.createNode(params),
    error: undefined,
    source: args.join(" "),
  };
}

function processCommand(words: string[], startIndex: number): Result {
  const command = words[startIndex];
  const pattern = commandPatterns.find((p) => p.name === command);
  if (!pattern) {
    return {
      success: false,
      lastIndex: startIndex,
      error: `Unknown command: ${command}`,
    };
  }

  const requiredTokens = pattern.expectedTokens
    .filter((t) => !t.optional)
    .map((t) => t.position);

  if (requiredTokens.length > 0) {
    const maxRequired = Math.max(...requiredTokens);
    if (startIndex + maxRequired >= words.length) {
      return {
        success: false,
        lastIndex: startIndex,
        error: `Incomplete command: ${command}`,
      };
    }
  }
  // Calculate how many tokens we should examine (all possible positions)
  const maxPosition = Math.max(
    ...pattern.expectedTokens.map((t) => t.position),
  );
  const endIndex = Math.min(startIndex + maxPosition + 1, words.length);

  // Extract tokens for this command
  const commandTokens = words.slice(startIndex, endIndex);
  return validateCommandPatterns(commandTokens);
}

export default function parser(input: string) {
  const code = input.replace(";", " ");
  console.log(code);
  const commands: Command[] = [];
  const errors: string[] = [];
  const parsedCommands: string[] = [];
  const words = code.match(pattern);
  if (!words) {
    return {
      errors: [],
      commands: [],
      parsedCommands: [],
    };
  }

  for (let i = 0; i < words.length; i++) {
    if (validateComment(words[i])) {
      parsedCommands.push(words[i]);
      commands.push({
        type: "Comment",
        params: {
          content: words[i],
        },
      });
    }
    if (words[i] === "remove_frames") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }

    if (words[i] === "input") {
      const result = processCommand(words, i);
      i += result.lastIndex;

      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }

    if (words[i] === "trim") {
      const result = processCommand(words, i);
      i += result.lastIndex;

      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] === "add_text") {
      const result = processCommand(words, i);
      i += result.lastIndex;

      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] === "burn") {
      const result = processCommand(words, i);
      i += result.lastIndex;

      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] == "compress") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] == "convert") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] == "scale") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] == "fade") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
    if (words[i] == "crop") {
      const result = processCommand(words, i);
      i += result.lastIndex;
      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
  }
  return {
    errors: errors,
    commands: commands,
    parsedCommands: parsedCommands,
  };
}
