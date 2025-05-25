"use client";

import { useState, useEffect, useRef } from "react";
import parser from "../parser/parser";
import { commandPatterns } from "../parser/parser";

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
  NONE: "no specific value",
  EOF: "eof",
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
  "in\/out",
  "for",
  "at",
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

const tokenize = (code: string) => {
  const tokens = [];
  let current = 0;

  while (current < code.length) {
    const char = code[current];

    // Handle whitespace
    if (/\s/.test(char)) {
      let value = "";
      while (current < code.length && /\s/.test(code[current])) {
        value += code[current];
        current++;
      }
      tokens.push({ type: TokenType.WHITESPACE, value });
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
      tokens.push({ type: TokenType.COMMENT, value });
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
      tokens.push({ type: TokenType.STRING, value });
      continue;
    }

    // Handle timecodes in format HH:MM:SS;FF (hours:minutes:seconds;frames)
    // Look ahead to see if this could be the start of a timecode (starts with a digit)
    // if (/[0-9]/.test(char)) {
    // Check if we have enough characters to potentially form a timecode
    // if (current + 10 < code.length) {
    //   // Check if the next characters match the timecode pattern: 12:12:12;00
    //   const timeCodePattern = /^(\d{2}:\d{2}:\d{2};\d{2})/;
    //   const possibleTimecode = code.substring(current);
    //   const match = possibleTimecode.match(timeCodePattern);
    //
    //   if (match) {
    //     const timecodeValue = match[1]; // This gives us the full timecode
    //     tokens.push({ type: TokenType.TIMECODE, value: timecodeValue });
    //     current += timecodeValue.length;
    //     continue;
    //   }
    // }

    // If it's not a timecode, continue with number parsing
    //   let value = "";
    //   while (current < code.length && /[0-9.]/.test(code[current])) {
    //     value += code[current];
    //     current++;
    //   }
    //   tokens.push({ type: TokenType.NUMBER, value });
    //   continue;
    // }

    // Handle keywords, operators, positions, alignments, and units
    if (/[a-zA-Z_]/.test(char)) {
      let value = "";
      while (current < code.length && /[a-zA-Z0-9_\-]/.test(code[current])) {
        value += code[current];
        current++;
      }

      // Check for special types in priority order
      if (KEYWORDS.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.KEYWORD, value });
      } else if (OPERATOR.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.OPERATOR, value });
      } else if (POSITION.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.POSITION, value });
      } else if (ALIGMENT.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.ALIGMENT, value });
      } else if (UNIT.includes(value.toLowerCase())) {
        tokens.push({ type: TokenType.UNIT, value });
      } else {
        tokens.push({ type: TokenType.NONE, value });
      }
      continue;
    }

    // Handle separator
    if (char === SEPARATOR) {
      tokens.push({ type: TokenType.SEPARATOR, value: char });
      current++;
      continue;
    }

    // Handle single characters that don't match other rules
    tokens.push({ type: TokenType.NONE, value: char });
    current++;
  }

  return tokens;
};

// Component to render highlighted code
const SyntaxHighlighter = ({ code }: { code: string }) => {
  const tokens = tokenize(code);

  return (
    <div className="font-mono">
      {tokens.map((token, index) => {
        let className = "";

        switch (token.type) {
          case TokenType.KEYWORD:
            className = "text-[#C57173] ";
            break;
          case TokenType.STRING:
            className = "text-[#A7C07F]";
            break;
          case TokenType.OPERATOR:
            {
              /* className = "text-[#D598B5] italic"; */
            }
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
          case TokenType.POSITION:
          case TokenType.ALIGMENT:
            className = "text-[#E49775]";
          case TokenType.UNIT:
            className = "text-[#B8A172]";
            break;
          default:
            className = "text-[#CED4DF]";
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
crop 200px from left; trim from 00:10.00 to 00:00:20.00
burn subtitles "subs.srt" at default
scale to 1920x1080 ignore aspect ratio
compress video
add_text "Hello World" at center
trim from 10 to 20
convert to mp4
trim from 10:30 to 12:30
fade in for 10s
`);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [commands, setCommands] = useState<unknown[]>([]);
  const [parsedCommands, setParsedCommands] = useState<string[]>([]);

  // Handle textarea input
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setCode(value);
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
      <div className="relative rounded bg-[#161F27]">
        {/* Highlighted code display */}
        <div
          ref={highlighterRef}
          className="absolute top-0 left-0 right-0 bottom-0 p-12 overflow-auto pointer-events-none whitespace-pre"
        >
          <SyntaxHighlighter code={code} />
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
        <button className="mx-12 mb-8 text-[#C1CDCD] bg-[#31383F] py-2 px-4">
          FFMPEG
        </button>
      </div>

      <div className="mt-4">
        <div className="p-4 bg-[#161F27] text-[#859188] rounded overflow-auto">
          <h2>Code</h2>
          <p className="py-8">{code}</p>
          <h3>Errors</h3>
          {errors && errors.length && <p className="text-red-600">{errors}</p>}
          <h2>Commands</h2>
          {JSON.stringify(commands, null, 2)}
          <div className="my-12" />
          <h2>Parsed Commands</h2>
          {parsedCommands && parsedCommands.map((c, i) => <p key={i}>{c}</p>)}
          <h3>Tokens</h3>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(tokenize(code), null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
