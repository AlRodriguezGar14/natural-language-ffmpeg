const code = `# Example code in natural ffmpeg language
trim from 10 to 20
trim from 10:30 to 12:30
trim from 00:10.00 to 00:00:20.00
`;

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

interface CommandPattern {
  name: string;
  expectedTokens: {
    position: number;
    expected: string | RegExp | null;
    paramName?: string;
  }[];
  validate: (params: Record<string, string>) => boolean | string;
  createNode: (params: Record<string, string>) => unknown;
}

const commandPatterns: CommandPattern[] = [
  {
    name: "trim",
    expectedTokens: [
      { position: 0, expected: "from" },
      { position: 1, expected: /.+/, paramName: "start" },
      { position: 2, expected: "to" },
      { position: 3, expected: /.+/, paramName: "end" },
    ],
    validate: (params) => {
      return validateTrimParams(params.start, params.end);
    },
    createNode: (params) => ({
      type: "Trim",
      params: {
        start: params.start,
        end: params.end,
      },
    }),
  },
];

function validateTrimParams(start: string, end: string): boolean {
  console.log(`validating: ${start} - ${end}`);
  // HH:MM:SS.ms, MM:SS or SS format
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

interface TrimNode {
  type: "Trim";
  params: {
    from: string;
    to: string;
  };
}

interface Result {
  success: boolean;
  lastIndex: number;
  node?: unknown; // TODO: create an enum when I have the nodes
  error?: string;
  source?: string;
}

function validateCommandPatterns(command: string, args: string[]): Result {
  let validated = false;
  const validator = commandPatterns.find((p) => p.name === command);
  if (!validator) {
    return {
      success: false,
      lastIndex: 0,
      error: "Could not find a validator",
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
        lastIndex: 0,
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

const commands: unknown[] = [];
const errors: string[] = [];
const parsedCommands: string[] = [];

export default function Parser() {
  const words = code.match(pattern);
  if (!words) {
    return <div className="px-64 py-8">No words found</div>;
  }

  for (let i = 0; i < words.length; i++) {
    if (words[i] === "trim" && words.length > 5) {
      const result = validateCommandPatterns(words[i], [
        words[i + 1],
        words[i + 2],
        words[i + 3],
        words[i + 4],
      ]);
      i += result.lastIndex;

      if (!result.success) {
        errors.push(result.error ?? "");
      } else {
        commands.push(result.node);
        parsedCommands.push(result.source ?? "");
      }
    }
  }
  return (
    <div className="px-64 py-8 text-white">
      {errors.length && <p className="text-red-600">{errors[0]}</p>}
      {words.map((w, idx) => (
        <p key={idx}>
          {w} - {validateComment(w) ? "comment" : ""}
        </p>
      ))}
      <p>Parser</p>
      {JSON.stringify(commands, null, 2)}
    </div>
  );
}
