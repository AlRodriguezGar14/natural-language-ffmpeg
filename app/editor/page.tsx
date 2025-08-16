"use client";

import { useState, useEffect, useRef } from "react";
import parser from "../parser/parser";
import { commandPatterns } from "../parser/parser";
import { ToFfmpeg } from "./ffmpegCompiler";
import { useRouter } from "next/navigation";
import { Command } from "@/lib/types";
import { probeFile } from "./ffmpeg";

interface Token {
  type: string;
  value: string;
  line: number;
  startPosition: number;
}

interface ReplacementConfig {
  pattern: RegExp;
  replacement: (filename: string) => string;
  acceptTypes: string;
}

interface ReplacementResult {
  newCode: string;
  newCursorPosition: number;
  success: boolean;
}

const TokenType = {
  KEYWORD: "keyword",
  STRING: "string",
  OPERATOR: "operator",
  NUMBER: "number",
  TIMECODE: "timecode",
  COMMENT: "comment",
  WHITESPACE: "whitespace",
  UNIT: "unit",
  POSITION: "position",
  ALIGMENT: "aligment",
  SEPARATOR: "separator",
  FILEPATH: "filepath",
  NONE: "no specific value",
  EOF: "eof",
};

const FILE_SELECTOR_CONFIGS: Record<string, ReplacementConfig> = {
  input: {
    pattern: /input\s+\/(?:\s|$)/,
    replacement: (filename) => `input ${filename}`,
    acceptTypes: "video/*,audio/*,image/*",
  },
  subtitle: {
    pattern: /burn\s+subtitles\s+\/(?:\s|$)/,
    replacement: (filename) => `burn subtitles "${filename}"`,
    acceptTypes: ".srt,.ass,.vtt",
  },
};

const KEYWORDS = commandPatterns.map((pattern) => pattern.name);

const OPERATOR = [
  "from",
  "to",
  "preserve",
  "ignore",
  "aspect",
  "ratio",
  "in",
  "out",
  "in/out",
  "for",
  "at",
  "every",
];

const POSITION = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
  "center",
];

const ALIGMENT = ["left", "right", "center", "top", "bottom"];

const UNIT = ["px", "second", "timecode", "dB"];

const SEPARATOR = ";";

const isCommentLine = (line: string): boolean => {
  return line.trim().startsWith("#");
};

const findTargetLine = (lines: string[], pattern: RegExp): number => {
  return lines.findIndex((line) => !isCommentLine(line) && pattern.test(line));
};

/**
 * Performs string replacement with cursor position tracking
 */
const performReplacement = (
  code: string,
  cursorPosition: number,
  config: ReplacementConfig,
  filename: string
): ReplacementResult => {
  const lines = code.split("\n");
  const targetLineIndex = findTargetLine(lines, config.pattern);

  if (targetLineIndex === -1) {
    return { newCode: code, newCursorPosition: cursorPosition, success: false };
  }

  const targetLine = lines[targetLineIndex];
  const match = targetLine.match(config.pattern);

  if (!match) {
    return { newCode: code, newCursorPosition: cursorPosition, success: false };
  }

  // Calculate character position of the replacement within the file
  const charsBefore = lines
    .slice(0, targetLineIndex)
    .reduce((acc, line) => acc + line.length + 1, 0);

  const matchStartInLine = targetLine.search(config.pattern);
  const replacementStart = charsBefore + matchStartInLine;
  const originalMatchLength = match[0].length;

  const replacementText = config.replacement(filename);
  const newLine = targetLine.replace(config.pattern, replacementText);

  const newLines = [...lines];
  newLines[targetLineIndex] = newLine;
  const newCode = newLines.join("\n");

  let newCursorPosition;
  if (cursorPosition <= replacementStart) {
    // Cursor was before the replacement, keep it in the same position
    newCursorPosition = cursorPosition;
  } else if (cursorPosition >= replacementStart + originalMatchLength) {
    // Cursor was after the replacement, adjust for length difference
    const lengthDiff = replacementText.length - originalMatchLength;
    newCursorPosition = cursorPosition + lengthDiff;
  } else {
    // Cursor was inside the replacement area, place it at the end of the replacement
    newCursorPosition = replacementStart + replacementText.length;
  }

  return { newCode, newCursorPosition, success: true };
};

const shouldTriggerFileSelector = (
  value: string,
  cursorPosition: number
): {
  shouldTrigger: boolean;
  type: keyof typeof FILE_SELECTOR_CONFIGS | null;
} => {
  // Get all text from start of document up to cursor position
  const beforeCursor = value.substring(0, cursorPosition);
  // Split the text before cursor into individual lines
  const lines = beforeCursor.split("\n");
  const currentLine = lines[lines.length - 1];
  if (isCommentLine(currentLine)) {
    return { shouldTrigger: false, type: null };
  }
  const words = currentLine.trim().split(/\s+/);
  if (
    words.length >= 2 &&
    words[words.length - 2] === "input" &&
    words[words.length - 1] === "/"
  ) {
    return { shouldTrigger: true, type: "input" };
  }
  if (
    words.length >= 3 &&
    words[words.length - 3] === "burn" &&
    words[words.length - 2] === "subtitles" &&
    words[words.length - 1] === "/"
  ) {
    return { shouldTrigger: true, type: "subtitle" };
  }

  return { shouldTrigger: false, type: null };
};

const handleExistingInputConflict = (
  code: string,
  cursorPosition: number
): { newCode: string; newCursorPosition: number } => {
  const lines = code.split("\n");
  const newLines: string[] = [];
  let addedComment = false;
  let newCursorPosition = cursorPosition;
  let currentLineIndex = 0;
  let charsSoFar = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0);
    if (charsSoFar + lineLength >= cursorPosition && currentLineIndex === 0) {
      currentLineIndex = i;
      break;
    }
    charsSoFar += lineLength;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Add comment after existing input line
    if (
      /^input\s+/.test(line.trim()) &&
      !isCommentLine(line) &&
      !addedComment
    ) {
      newLines.push(line);
      const commentLine =
        '# To select a different file, delete the line above and type "input /"';
      newLines.push(commentLine);
      addedComment = true;

      if (currentLineIndex > i) {
        newCursorPosition += commentLine.length + 1;
      }
    } else if (line.trim() === "input /") {
      const lineLength = line.length + (i < lines.length - 1 ? 1 : 0);

      if (currentLineIndex === i && newLines.length > 0) {
        newCursorPosition = newLines.join("\n").length;
      } else if (currentLineIndex > i) {
        newCursorPosition -= lineLength;
      }
    } else {
      newLines.push(line);
    }
  }

  return {
    newCode: newLines.join("\n"),
    newCursorPosition: Math.max(
      0,
      Math.min(newCursorPosition, newLines.join("\n").length)
    ),
  };
};

const tokenize = (code: string): Token[] => {
  const tokens: Token[] = [];
  let current = 0;
  let line = 1;
  let startPosition = 0;

  while (current < code.length) {
    const char = code[current];

    // Track line numbers
    if (char === "\n") {
      line++;
      startPosition = current + 1;
    }

    // Handle whitespace
    if (/\s/.test(char)) {
      let value = "";
      while (current < code.length && /\s/.test(code[current])) {
        value += code[current];
        current++;
      }
      tokens.push({
        type: TokenType.WHITESPACE,
        value,
        line,
        startPosition,
      });
      continue;
    }

    // Handle comments (assuming # for single line comments)
    if (char === "#") {
      let value = "#";
      current++;
      while (current < code.length && code[current] !== "\n") {
        value += code[current];
        current++;
      }
      tokens.push({ type: TokenType.COMMENT, value, line, startPosition });
      continue;
    }

    // Handle strings
    if (char === '"') {
      let value = '"';
      current++;
      while (current < code.length && code[current] !== '"') {
        value += code[current];
        current++;
      }
      if (current < code.length) {
        value += '"';
        current++;
      }
      tokens.push({ type: TokenType.STRING, value, line, startPosition });
      continue;
    }

    // Handle keywords, operators, positions, alignments, units, and file paths
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";
      while (current < code.length && /[a-zA-Z0-9_\-.]/.test(code[current])) {
        value += code[current];
        current++;
      }

      // Check if this looks like a file path (contains file extension)
      const fileExtensionPattern =
        /\.(mp4|avi|mov|mkv|webm|mp3|wav|flac|aac|jpg|jpeg|png|gif|srt|ass|vtt)$/i;
      if (fileExtensionPattern.test(value)) {
        tokens.push({ type: TokenType.FILEPATH, value, line, startPosition });
      }
      // Check for special types in priority order
      else if (KEYWORDS.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.KEYWORD, value, line, startPosition });
      } else if (OPERATOR.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.OPERATOR, value, line, startPosition });
      } else if (POSITION.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.POSITION, value, line, startPosition });
      } else if (ALIGMENT.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.ALIGMENT, value, line, startPosition });
      } else if (UNIT.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.UNIT, value, line, startPosition });
      } else {
        tokens.push({ type: TokenType.NONE, value, line, startPosition });
      }
      continue;
    }

    // Handle separator
    if (char === SEPARATOR) {
      tokens.push({
        type: TokenType.SEPARATOR,
        value: char,
        line,
        startPosition,
      });
      current++;
      continue;
    }

    // Handle single characters that don't match other rules
    tokens.push({ type: TokenType.NONE, value: char, line, startPosition });
    current++;
  }

  return tokens;
};

function parseErrorMessage(error: string) {
  const commandMatch = error.split(":")[0]; // Gets the command name
  const tokenMatch = error.match(/{([^}]+)}/); // Extracts content between {}
  return {
    command: commandMatch,
    errorToken: tokenMatch ? tokenMatch[1] : null,
  };
}

function isErrorCommand(
  command: string,
  errors: { command: string; errorToken: string | null }[]
) {
  return errors.some((error) => error.command === command);
}

function isErrorToken(
  token: string,
  errors: { command: string; errorToken: string | null }[]
) {
  return errors.some((error) => error.errorToken === token);
}

// Component to render highlighted code
const SyntaxHighlighter = ({
  code,
  errors,
}: {
  code: string;
  errors: string[];
}) => {
  const tokens = tokenize(code);
  const errorsInfo = errors.map(parseErrorMessage);
  let errLine = 0;
  let isError = false;

  return (
    <div className="font-mono">
      {tokens.map((token, index) => {
        let className = "";
        if (token.type === TokenType.KEYWORD) {
          if (isErrorCommand(token.value, errorsInfo)) {
            errLine = token.line;
            isError = true;
          } else {
            isError = false;
          }
        }

        switch (token.type) {
          case TokenType.KEYWORD:
            className = "text-[#C57173] ";
            break;
          case TokenType.STRING:
            className = "text-[#A7C07F]";
            break;
          case TokenType.OPERATOR:
            className = "text-[#7FBCB3]";
            break;
          case TokenType.TIMECODE:
            className = "text-[#78d1c3]";
            break;
          case TokenType.NUMBER:
            className = "text-[#7FBCB3]";
            break;
          case TokenType.COMMENT:
            className = "text-[#859188] italic";
            break;
          case TokenType.FILEPATH:
            className = "text-[#D598B5] font-medium underline";
            break;
          case TokenType.POSITION:
          case TokenType.ALIGMENT:
            className = "text-[#E49775]";
            break;
          case TokenType.UNIT:
            className = "text-[#B8A172]";
            break;
          default:
            className = "text-[#CED4DF]";
        }

        if (
          isError &&
          token.line === errLine &&
          isErrorToken(token.value, errorsInfo)
        ) {
          return (
            <span key={index} className="text-red-600 font-black">
              {token.value}
            </span>
          );
        }

        return (
          <span key={index} className={className}>
            {token.value}
          </span>
        );
      })}
    </div>
  );
};

// Editor component with textarea overlay for editing
export default function Editor() {
  const [code, setCode] = useState(`# Example code in natural ffmpeg language
# Type "input /" to select a file
crop 200px from left; trim from 00:10.00 to 00:00:20.00
burn subtitles "subs.srt" at default
scale to 1920x1080 ignore aspect ratio
compress video
add_text "Hello World" at center
trim from 10 to 20
convert to mp4
trim from 10:30 to 12:30
fade in for 10s
remove_frames every 4
`);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tokenized, setTokenized] = useState<Token[]>([]);
  const [fileInfo, setFileInfo] = useState<object | null>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [debug, setDebug] = useState(false);
  const [commands, setCommands] = useState<Command[]>([]);
  const [parsedCommands, setParsedCommands] = useState<string[]>([]);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [fileSelectorType, setFileSelectorType] = useState<
    keyof typeof FILE_SELECTOR_CONFIGS | null
  >(null);
  const [triggerCursorPosition, setTriggerCursorPosition] = useState<number>(0);
  const [pendingCursorPosition, setPendingCursorPosition] = useState<
    number | null
  >(null);
  const router = useRouter();

  useEffect(() => {
    setTokenized(tokenize(code));
  }, [code]);

  useEffect(() => {
    if (pendingCursorPosition !== null && textareaRef.current) {
      // Ensure the cursor position is within bounds
      const position = Math.min(
        pendingCursorPosition,
        textareaRef.current.value.length
      );

      console.log("Applying cursor position:", {
        requested: pendingCursorPosition,
        actual: position,
        textLength: textareaRef.current.value.length,
      });

      textareaRef.current.setSelectionRange(position, position);
      textareaRef.current.focus();

      setPendingCursorPosition(null);
    }
  }, [code, pendingCursorPosition]);

  const hasExistingInput = (): boolean => {
    return commands.some((command) => command.type === "Input");
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !fileSelectorType) return;

    const config = FILE_SELECTOR_CONFIGS[fileSelectorType];
    if (!config) return;

    setIsLoadingFile(true);

    try {
      if (fileSelectorType === "input") {
        const info = await probeFile(file);
        setFileInfo(info);
      }
      const result = performReplacement(
        code,
        triggerCursorPosition,
        config,
        file.name
      );

      if (result.success) {
        setCode(result.newCode);
        setPendingCursorPosition(result.newCursorPosition);
      }
    } catch (error) {
      console.error("Error analyzing file:", error);
    } finally {
      setIsLoadingFile(false);
      setFileSelectorType(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;

    const fileSelectorResult = shouldTriggerFileSelector(value, cursorPosition);

    console.log("Input debug:", {
      hasExisting: hasExistingInput(),
      triggerResult: fileSelectorResult,
      cursorPosition,
    });

    if (
      hasExistingInput() &&
      fileSelectorResult.shouldTrigger &&
      fileSelectorResult.type === "input"
    ) {
      console.log("Taking existing input conflict path");
      const conflictResult = handleExistingInputConflict(value, cursorPosition);
      setCode(conflictResult.newCode);
      setPendingCursorPosition(conflictResult.newCursorPosition);
      return;
    }

    setCode(value);

    if (fileSelectorResult.shouldTrigger && fileSelectorResult.type) {
      console.log("Triggering file selector for:", fileSelectorResult.type);
      setTriggerCursorPosition(cursorPosition);
      setFileSelectorType(fileSelectorResult.type);

      const config = FILE_SELECTOR_CONFIGS[fileSelectorResult.type];
      if (fileInputRef.current && config) {
        fileInputRef.current.accept = config.acceptTypes;
        fileInputRef.current.click();
      }
    }
  };

  useEffect(() => {
    const parsed = parser(code);
    setErrors(parsed.errors);
    setCommands(parsed.commands);
    setParsedCommands(parsed.parsedCommands);
  }, [code]);

  // Sync scroll between textarea and highlighter
  const handleScroll = () => {
    if (highlighterRef.current && textareaRef.current) {
      highlighterRef.current.scrollTop = textareaRef.current.scrollTop;
      highlighterRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      // Reset height temporarily to get accurate scrollHeight
      textareaRef.current.style.height = "auto";

      // Set height to scrollHeight plus padding to maintain consistent padding
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [code]);

  useEffect(() => {
    adjustTextareaHeight();
  }, []);

  return (
    <div className="w-full max-w-7xl  m-auto pt-64 ">
      {/* Hidden file input for native file selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,audio/*,image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div className="relative rounded bg-[#161F27]">
        {/* Highlighted code display */}
        <div
          ref={highlighterRef}
          className="absolute top-0 left-0 right-0 bottom-0 p-12 overflow-auto pointer-events-none whitespace-pre"
        >
          <SyntaxHighlighter code={code} errors={errors} />
        </div>

        {/* Editable textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleInput}
          onScroll={handleScroll}
          className="w-full min-h-80 caret-[#FBDF90] p-12 text-transparent font-mono bg-transparent resize-none outline-none"
          spellCheck="false"
          style={{
            caretColor: "#FBDF90",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={() => {
            setDebug((debug) => !debug);
          }}
          className="mx-12 mb-8 text-[#C1CDCD] bg-[#31383F] py-2 px-4"
        >
          Debug
        </button>
        <button
          onClick={() => {
            router.push("/docs");
          }}
          className="mx-12 mb-8 text-[#C1CDCD] bg-[#31383F] py-2 px-4"
        >
          Dictionary
        </button>
      </div>
      {fileInfo && <ToFfmpeg commands={commands} fileInfo={fileInfo} />}
      {isLoadingFile && (
        <div className="mb-4 p-4 bg-blue-800 text-blue-200 rounded-lg">
          🔄 Analyzing file... This may take a moment.
        </div>
      )}
      {debug && (
        <div className="mt-4">
          <div className="p-4 bg-[#161F27] text-[#859188] rounded overflow-auto">
            <h2>Code</h2>
            <p className="py-8">{code}</p>
            <h3>Errors</h3>
            {errors && errors.length && (
              <p className="text-red-600">{errors}</p>
            )}
            <h2>Commands</h2>
            {JSON.stringify(commands, null, 2)}
            <div className="my-12" />
            <h2>Parsed Commands</h2>
            {parsedCommands && parsedCommands.map((c, i) => <p key={i}>{c}</p>)}
            <h3>Tokens</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(tokenized, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
