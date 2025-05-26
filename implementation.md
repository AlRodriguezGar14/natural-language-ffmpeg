# NaturalFFmpeg: A Guide to Natural Language Video Processing

---

## Preface

This book is written for advanced students, engineers, and language designers who wish to master the theory and practice of building a natural language interface for FFmpeg. It is both a rigorous academic text and a practical implementation guide. Every section is designed to teach not just how, but why, with deep dives into language theory, parsing, ASTs, and the semantics of video processing. The goal is to make you proficient in natural language DSLs, ASTs, lexers, and the translation of human intent into robust, production-grade FFmpeg commands.

---

## Table of Contents
1. Introduction and Motivation
2. FFmpeg: Concepts, Internals, and Filtergraph Theory
3. Natural Language DSL Design: Theory and Practice
4. Lexing and Tokenization: Algorithms and Implementation
5. Parsing and AST Construction: Formal Grammars and Recursive Descent
6. Semantic Analysis and Validation: Ensuring Meaning and Safety
7. Command Translation: DSL to FFmpeg, Filtergraph Construction
8. Supported Commands: In-Depth Implementation and Theory
    - Trimming
    - Audio Operations
    - Text Overlay
    - Image Overlay
    - Scaling
    - Rotation
    - Cropping
    - Fading
    - Speed Adjustment
    - Format Conversion
    - Special Effects
9. Error Handling and User Feedback: Theory and Practice
10. Extensibility and Customization: Language Evolution
11. Frontend and Backend Integration: System Architecture
12. Testing, Debugging, and Best Practices: Academic and Industrial Approaches
13. Security and Resource Management: Threat Models and Mitigations
14. Appendices: Full Grammar, Reference Tables, Further Reading
15. NaturalFFmpeg DSL Dictionary and Expressions Reference

---

## 1. Introduction and Motivation

### 1.1. Why Natural Language for FFmpeg?
FFmpeg is the most powerful open-source multimedia processing tool, but its CLI is daunting for non-experts. A natural language DSL democratizes access, enabling:
- Video editors to automate tasks
- Educators to teach media concepts
- Developers to build batch tools and GUIs
- Accessibility for non-technical users

### 1.2. What This Book Covers
- The theory and practice of language design for video processing
- How to implement lexers, parsers, and translators from first principles
- How to map user intent to FFmpeg filtergraphs and options
- How to handle errors, edge cases, and extensibility
- How to build a full-stack system (frontend, backend, CLI)
- How to reason about language evolution, ambiguity, and user experience

---

## 2. FFmpeg: Concepts, Internals, and Filtergraph Theory

### 2.1. FFmpeg CLI Anatomy
FFmpeg commands are composed of:
- **Global options** (e.g., `-y`, `-hide_banner`)
- **Input files** (`-i input.mp4`)
- **Filtergraphs** (e.g., `-vf "scale=1280:720,drawtext=..."`)
- **Output options** (e.g., `-c:v libx264`, `output.mp4`)

**Example:**
```sh
ffmpeg -i input.mp4 -vf "drawtext=text='Hello':x=10:y=10" -c:v libx264 output.mp4
```

### 2.2. Filtergraph Syntax and Theory
- Chaining: `filter1,filter2` (composition of functions)
- Labeling: `[in]filter[out]` (dataflow graph)
- Complex graphs: overlays, splits, merges (see [FFmpeg filtergraph docs](https://ffmpeg.org/ffmpeg-filters.html#Filtergraph-syntax))

**Diagram:**
```
[input] -> [scale] -> [drawtext] -> [output]
```

**Theoretical Note:**
A filtergraph is a directed acyclic graph (DAG) where nodes are filters and edges are media streams. This is a classic dataflow programming model, and understanding it is key to mapping natural language to FFmpeg.

### 2.3. Common Filters and Options
- `drawtext`, `overlay`, `scale`, `crop`, `volume`, `fade`, `rotate`, `transpose`, `setpts`, `atempo`, etc.
- See [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)

---

## 3. Natural Language DSL Design: Theory and Practice

### 3.1. Principles
- **Clarity**: Each command maps to a single, unambiguous FFmpeg operation.
- **Composability**: Commands can be chained (monoidal structure).
- **Extensibility**: New operations can be added without breaking old ones (open-closed principle).
- **User-Friendliness**: Use idiomatic, forgiving language.

### 3.2. Supported Operations and Keywords

| DSL Keyword         | FFmpeg Concept/Option         | Example Mapping                        |
|---------------------|------------------------------|----------------------------------------|
| trim                | `-ss`, `-to`, `-t`           | `trim from 10s to 20s` → `-ss 10 -to 20` |
| add text            | `drawtext` filter            | `add text "Hi" in top-left` → `-vf drawtext=...` |
| increase volume     | `volume` filter              | `increase volume by 3dB` → `-af volume=3dB` |
| overlay image       | `overlay` filter             | `overlay image logo.png at 10,10`      |
| scale               | `scale` filter               | `scale to 1280x720` → `-vf scale=1280:720` |
| rotate              | `transpose`/`rotate` filter  | `rotate 90 degrees` → `-vf transpose=1` |
| crop                | `crop` filter                | `crop 100 pixels from top`             |
| fade                | `fade` filter                | `add fade in for 3 seconds`            |
| speed up/down       | `setpts`, `atempo`           | `speed up by 2x`                       |
| convert to          | output format                | `convert to mp4`                       |
| ...                 | ...                          | ...                                    |

**Table: Synonyms and Canonical Operations**
| User Phrase | Canonical Operation | Notes |
|-------------|--------------------|-------|
| "raise volume" | increase volume | synonym |
| "add caption" | add text | synonym |
| ... | ... | ... |

### 3.3. Command Chaining and Multi-line Input
Commands can be separated by semicolons or newlines. Each command is parsed independently, then combined. This is a monoidal structure: the set of commands forms a free monoid under concatenation.

### 3.4. Handling Ambiguity and Synonyms
Use a dictionary of synonyms (e.g., "increase volume" == "raise volume"). Prefer explicitness in ambiguous cases. See [Grice's Maxims](https://en.wikipedia.org/wiki/Cooperative_principle) for linguistic theory.

---

## 4. Lexing and Tokenization: Algorithms and Implementation

### 4.1. Theoretical Background
A lexer (or scanner) is a finite automaton that splits input into tokens: keywords, numbers, strings, units, etc. This is the first step in any compiler or interpreter pipeline. See [Aho, Lam, Sethi, Ullman: Compilers, Principles, Techniques, and Tools](https://en.wikipedia.org/wiki/Compilers:_Principles,_Techniques,_and_Tools).

### 4.2. Designing the Tokenizer
- Use regular expressions for each token type.
- Order matters: match longer/more specific tokens first.
- In TypeScript, use RegExp and string manipulation for a custom lexer, or use a library for more complex grammars.

**TypeScript Example:**
```typescript
// Token types for the DSL
export type TokenType =
  | 'KEYWORD'
  | 'STRING'
  | 'NUMBER'
  | 'UNIT'
  | 'POSITION'
  | 'ALIGNMENT'
  | 'SEPARATOR'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
}

// Tokenizer function
export function tokenize(input: string): Token[] {
  const patterns: [TokenType, RegExp][] = [
    ['KEYWORD', /\b(add|text|in|aligned|with|margin|from|to|increase|volume|by|overlay|image|at|scale|rotate|degrees|trim|seconds?|top|bottom|left|right|center|third|quarter)\b/],
    ['STRING', /"[^"]*"/],
    ['NUMBER', /\d+(\.\d+)?/],
    ['UNIT', /px|dB|x|degrees/],
    ['POSITION', /top-left|top-right|bottom-left|bottom-right|center/],
    ['ALIGNMENT', /left|center|right/],
    ['SEPARATOR', /[;\n]/],
  ];
  const tokens: Token[] = [];
  let str = input;
  while (str.length > 0) {
    let matched = false;
    for (const [type, regex] of patterns) {
      const match = regex.exec(str);
      if (match && match.index === 0) {
        tokens.push({ type, value: match[0] });
        str = str.slice(match[0].length).trimStart();
        matched = true;
        break;
      }
    }
    if (!matched) {
      // Skip whitespace or unknown characters
      str = str.slice(1);
    }
  }
  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}
```

**Algorithmic Note:**
This is a greedy, left-to-right, longest-match-first lexer. For more complex grammars, use a DFA/NFA or a lexer generator.

### 4.3. Example: Tokenizing a Command
Input: `add text "Hello World" in top-left aligned left with margin 20px`
Output:
| Token      | Type      |
|------------|-----------|
| add        | KEYWORD   |
| text       | KEYWORD   |
| "Hello World" | STRING |
| in         | KEYWORD   |
| top-left   | POSITION  |
| aligned    | KEYWORD   |
| left       | ALIGNMENT |
| with       | KEYWORD   |
| margin     | KEYWORD   |
| 20         | NUMBER    |
| px         | UNIT      |

### 4.4. Implementation Notes
- In TypeScript, use a loop to match regexes in order.
- For complex grammars, consider a parser generator (e.g., [nearley](https://nearley.js.org/), [PEG.js](https://pegjs.org/)).
- Handle whitespace and comments.
- Document each token type and its role in the grammar.

---

## 5. Parsing and AST Construction: Formal Grammars and Recursive Descent

### 5.1. Theoretical Background
A parser is a pushdown automaton that builds a structured representation (AST) from a sequence of tokens, according to a formal grammar. See [Chomsky hierarchy](https://en.wikipedia.org/wiki/Chomsky_hierarchy) and [recursive descent parsing](https://en.wikipedia.org/wiki/Recursive_descent_parser).

### 5.2. Grammar Design (EBNF)
```
command      ::= operation (separator operation)*
operation    ::= trim_op | text_op | volume_op | overlay_op | ...
trim_op      ::= 'trim' 'from' time 'to' time
text_op      ::= 'add' 'text' string 'in' position ('aligned' alignment)? ('with' 'margin' number unit)?
...
separator    ::= ';' | NEWLINE
time         ::= NUMBER | TIMEFORMAT
position     ::= 'top-left' | 'top-right' | ...
alignment    ::= 'left' | 'center' | 'right'
```

### 5.3. AST Node Structure
Each operation becomes a node with type and parameters.

**TypeScript Example:**
```typescript
// AST node types
export type OperationType =
  | 'Trim'
  | 'TextOverlay'
  | 'Volume'
  | 'ImageOverlay'
  | 'Scale'
  | 'Rotate'
  | 'Crop'
  | 'Fade'
  | 'Speed'
  | 'Format'
  | 'Effect';

export interface ASTNode {
  type: OperationType;
  parameters: Record<string, any>;
}

// Example node
const node: ASTNode = {
  type: 'TextOverlay',
  parameters: {
    text: 'Hello World',
    position: 'top-left',
    alignment: 'left',
    margin: 20,
  },
};
```

### 5.4. Recursive Descent Parsing: Implementation and Commentary
Recursive descent parsing is a top-down parsing technique where each nonterminal in the grammar is implemented as a function. This is the most flexible and readable approach for DSLs.

**TypeScript Example:**
```typescript
function parseTextOverlay(tokens: Token[]): ASTNode {
  // Expect: add text STRING in POSITION [aligned ALIGNMENT] [with margin NUMBER UNIT]
  let i = 0;
  if (tokens[i].value !== 'add') throw new Error('Expected add');
  i++;
  if (tokens[i].value !== 'text') throw new Error('Expected text');
  i++;
  const text = tokens[i].value.replace(/"/g, '');
  i++;
  if (tokens[i].value !== 'in') throw new Error('Expected in');
  i++;
  const position = tokens[i].value;
  i++;
  let alignment = 'center';
  let margin = 0;
  if (tokens[i] && tokens[i].value === 'aligned') {
    i++;
    alignment = tokens[i].value;
    i++;
  }
  if (tokens[i] && tokens[i].value === 'with') {
    i++;
    if (tokens[i].value !== 'margin') throw new Error('Expected margin');
    i++;
    margin = parseInt(tokens[i].value, 10);
    i++;
    if (tokens[i].value !== 'px') throw new Error('Expected px');
    i++;
  }
  return {
    type: 'TextOverlay',
    parameters: { text, position, alignment, margin },
  };
}
```

**Commentary:**
- Each function corresponds to a nonterminal in the grammar.
- The parser is robust to missing or extra tokens, and provides clear error messages.
- For more complex grammars, use a parser generator or combinator library.

---

## 6. Semantic Analysis and Validation: Ensuring Meaning and Safety

### 6.1. Theoretical Background
Semantic analysis checks that the AST is not only syntactically correct, but also meaningful and safe to translate to FFmpeg. This is analogous to type checking in programming languages.

### 6.2. Implementation Notes
- After parsing, walk the AST and validate each node.
- For timecodes, check that start < end and within media duration.
- For overlays, check that positions and alignments are valid.
- For numbers, check ranges (e.g., volume in dB, margin in px).

**TypeScript Example:**
```typescript
function validateTrim(node: ASTNode, mediaDuration: number): void {
  const { start, end } = node.parameters;
  if (start >= end) {
    throw new Error('Trim start must be less than end');
  }
  if (end > mediaDuration) {
    node.parameters.end = mediaDuration;
  }
}
```

**Best Practice:**
Always validate user input at every stage: lexing, parsing, semantic analysis, and translation.

---

## 7. Command Translation: DSL to FFmpeg, Filtergraph Construction

### 7.1. Theoretical Background
Command translation is the process of mapping AST nodes to FFmpeg CLI arguments and filtergraph expressions. This is a form of code generation, and is analogous to the backend of a compiler.

### 7.2. Mapping Table
| AST Type      | FFmpeg Filter/Option | Example Mapping |
|---------------|----------------------|-----------------|
| Trim          | `-ss`, `-to`         | `trim from 10s to 20s` → `-ss 10 -to 20` |
| TextOverlay   | `drawtext`           | `add text ...`  |
| Volume        | `volume`             | `increase volume by 3dB` |
| OverlayImage  | `overlay`            | `overlay image ...` |
| Scale         | `scale`              | `scale to 1280:720` |
| Rotate        | `transpose`/`rotate` | `rotate 90 degrees` |
| Crop          | `crop`               | `crop 100 pixels from top` |
| Fade          | `fade`               | `add fade in for 3 seconds` |
| Speed         | `setpts`, `atempo`   | `speed up by 2x` |
| Format        | output format        | `convert to mp4` |

### 7.3. Translation Logic: Implementation and Commentary
For each AST node, write a function that returns the corresponding FFmpeg CLI arguments.

**TypeScript Example:**
```typescript
function translateTextOverlay(node: ASTNode): string {
  const { text, position, alignment, margin } = node.parameters;
  // Map position to x/y
  let x = '0', y = '0';
  switch (position) {
    case 'top-left':
      x = `${margin}`;
      y = `${margin}`;
      break;
    case 'center':
      x = '(w-tw)/2';
      y = '(h-th)/2';
      break;
    // ... more positions ...
  }
  return `drawtext=text='${text}':x=${x}:y=${y}:align=${alignment}`;
}
```

**Commentary:**
- Use string templates or argument arrays to build commands safely.
- For overlays, calculate x/y based on position, margin, and alignment.
- For time-based operations, convert timecodes to seconds as needed.
- For chained operations, maintain filter order and dependencies.

**Worked Example:**
User input:
```
add text "Hello World" in top-left aligned left with margin 20px
trim from 00:00:10 to 00:00:20
```
AST:
```typescript
[
  { type: 'TextOverlay', parameters: { text: 'Hello World', position: 'top-left', alignment: 'left', margin: 20 } },
  { type: 'Trim', parameters: { start: 10, end: 20 } }
]
```
Translation:
```
ffmpeg -ss 10 -to 20 -i input.mp4 -vf "drawtext=text='Hello World':x=20:y=20:align=left" output.mp4
```

---

## 8. Supported Commands: In-Depth Implementation and Theory

### 8.1. Trimming
**Theory:** Trimming is a form of temporal slicing. FFmpeg supports both input and output seeking. Input seeking is more efficient but less accurate; output seeking is more accurate but slower.

**Natural Language Examples:**
- `trim from 00:00:10 to 00:00:20`
- `trim from 10 seconds to 20 seconds`

**Parsing/AST:**
```typescript
{
  type: 'Trim',
  parameters: { start: 10, end: 20 }
}
```

**Translation:**
- `-ss 10 -to 20`
- Place before `-i` for input seeking, after for output seeking (see [FFmpeg seeking docs](https://trac.ffmpeg.org/wiki/Seeking)).

**TypeScript Implementation:**
```typescript
function translateTrim(node: ASTNode): string[] {
  const { start, end } = node.parameters;
  return [`-ss ${start}`, `-to ${end}`];
}
```

**Edge Cases:**
- If end > duration, clamp to duration.
- If start >= end, error.

**Best Practice:** Always validate time ranges and document the difference between input and output seeking.

---

## 9. Error Handling and User Feedback: Theory and Practice

### 9.1. Error Handling in Language Systems
- **Error Handling in Language Systems:** Robust error handling is essential for usability, safety, and maintainability. In a DSL for FFmpeg, errors can arise at every stage:
  - Lexing/tokenization errors (invalid characters, unterminated strings)
  - Parsing errors (unexpected tokens, grammar violations)
  - Semantic errors (invalid parameters, out-of-range values, unsupported operations)
  - Translation errors (impossible filtergraphs, conflicting options)
  - Runtime errors (FFmpeg/FFprobe failures, file I/O, resource limits)
- **User Feedback:** Clear, actionable feedback helps users correct mistakes, understand system behavior, and learn the DSL. Good feedback is specific, contextual, and, where possible, suggests fixes.
- **Taxonomy of Errors:**
  - **Syntax errors:** Detected during lexing/parsing (e.g., missing quotes, unknown keywords)
  - **Semantic errors:** Detected during AST validation (e.g., negative duration, invalid position)
  - **System errors:** Detected during execution (e.g., file not found, FFmpeg crash)
  - **Warnings:** Non-fatal issues (e.g., deprecated features, best practice suggestions)

---

## 10. Extensibility and Customization: Language Evolution
Add new operations by updating lexer, parser, AST, and translation logic. Support synonyms and localization. Allow user-defined filters and plugins. Document all new features and provide examples. See [Language Workbenches: The Killer-App for Domain Specific Languages?](https://martinfowler.com/articles/languageWorkbench.html).

---

## 11. Frontend and Backend Integration: System Architecture
Use HTTP APIs for communication. Use a code editor with syntax highlighting and validation. Handle file uploads, command previews, and result downloads. Document API endpoints and expected payloads. See [RESTful Web APIs, Richardson & Amundsen].

---

## 12. Testing, Debugging, and Best Practices: Academic and Industrial Approaches
Unit and integration tests for parser and translator. Fuzzing and property-based testing for robustness. Logging and monitoring for production. Use TypeScript's type safety to catch errors early. See [Property-Based Testing with PropEr, Erlang, and Elixir].

---

## 13. Security and Resource Management: Threat Models and Mitigations
Validate and sanitize all inputs. Limit file size, type, and processing time. Run FFmpeg in a sandboxed environment. Document all security measures. See [OWASP Top Ten].

---

## 14. Appendices
Full grammar and token reference. Mapping tables for all supported operations. Further reading and references. Include worked end-to-end examples and diagrams.

---

## NaturalFFmpeg DSL Dictionary

### Core Operation Keywords

| Keyword | Meaning | AST Node Type | Parameters |
|---------|---------|--------------|------------|
| trim | Cut video to specific time range | Trim | start, end (in seconds) |
| add text | Overlay text on video | TextOverlay | text, position, alignment, margin, etc. |
| increase volume | Raise audio volume | Volume | amount, unit (e.g., "dB") |
| decrease volume | Lower audio volume | Volume | amount, unit (e.g., "dB") |
| overlay image | Add image on top of video | ImageOverlay | image, position, opacity, etc. |
| scale | Resize video dimensions | Scale | width, height, preserveAspect |
| rotate | Rotate video | Rotate | degrees |
| crop | Cut out portion of video frame | Crop | amount, unit, side |
| fade | Add fade in/out effect | Fade | direction (in/out), duration, start |
| speed up | Increase playback speed | Speed | factor (e.g., 2 = double speed) |
| slow down | Decrease playback speed | Speed | factor (e.g., 0.5 = half speed) |
| convert to | Change output format | Format | format (e.g., "mp4") |
| add blur | Apply blur effect | Effect | effect: 'blur', radius |

### Modifiers and Parameters

| Keyword | Associated Operations | Usage | AST Parameter |
|---------|----------------------|-------|--------------|
| from | trim | Specifies start time | start |
| to | trim, scale | Specifies end time or dimensions | end or dimensions |
| in | add text | Specifies position | position |
| at | overlay image | Specifies position | position |
| aligned | add text | Specifies text alignment | alignment |
| with margin | add text | Specifies margin size | margin |
| by | increase/decrease volume, speed | Specifies amount | amount |
| for | fade | Specifies duration | duration |
| starting at | fade | Specifies start time | start |
| preserve aspect ratio | scale | Maintains proportions | preserveAspect: true |

### Position Keywords

| Position Keyword | Meaning | AST Position Value |
|-----------------|---------|-------------------|
| top-left | Upper left corner | top-left |
| top-right | Upper right corner | top-right |
| bottom-left | Lower left corner | bottom-left |
| bottom-right | Lower right corner | bottom-right |
| center | Middle of frame | center |
| top | Top edge, horizontally centered | top |
| bottom | Bottom edge, horizontally centered | bottom |
| left | Left edge, vertically centered | left |
| right | Right edge, vertically centered | right |
| top-third | One-third from top | top-third |
| bottom-third | One-third from bottom | bottom-third |
| left-third | One-third from left | left-third |
| right-third | One-third from right | right-third |
| top-quarter | One-quarter from top | top-quarter |
| bottom-quarter | One-quarter from bottom | bottom-quarter |
| left-quarter | One-quarter from left | left-quarter |
| right-quarter | One-quarter from right | right-quarter |

### Alignment Keywords

| Alignment Keyword | Meaning | AST Alignment Value |
|------------------|---------|---------------------|
| left | Left-aligned text | left |
| center | Center-aligned text | center |
| right | Right-aligned text | right |

### Units

| Unit Keyword | Meaning | Associated Operations |
|-------------|---------|----------------------|
| px | Pixels | crop, add text (margin) |
| dB | Decibels | increase/decrease volume |
| s | Seconds | trim, fade |
| x | Separator for dimensions | scale |
| degrees | Angle measurement | rotate |

### Time Format

| Format | Example | Meaning | AST Representation |
|--------|---------|---------|-------------------|
| Seconds | 10 | 10 seconds | 10 (number) |
| MM:SS | 01:30 | 1 minute, 30 seconds | 90 (seconds) |
| HH:MM:SS | 01:30:45 | 1 hour, 30 minutes, 45 seconds | 5445 (seconds) |

### Command Separators

| Separator | Meaning | AST Effect |
|-----------|---------|------------|
| ; | End of command | Separate AST nodes |
| newline | End of command | Separate AST nodes |

### Grammar Structure

The grammar follows a pattern of operation followed by parameters, where:

- Each operation maps to a specific FFmpeg filter or command
- Parameters specify how the operation should be applied
- Multiple operations can be chained with separators

### Expression Reference

#### Trim Expression

```
trim from [time] to [time]
```

Examples:
- `trim from 10s to 20s`
- `trim from 01:30 to 02:45`

FFmpeg translation: `-ss [start] -to [end]`

#### Text Overlay Expression

```
add text [string] in [position] aligned [alignment] with margin [number][unit]
```

Examples:
- `add text "Hello World" in center`
- `add text "Title" in top aligned center with margin 20px`

FFmpeg translation: `-vf drawtext=text='[string]':x=[x]:y=[y]:align=[alignment]`

#### Volume Adjustment Expression

```
[increase|decrease] volume by [number][unit]
```

Examples:
- `increase volume by 3dB`
- `decrease volume by 6dB`

FFmpeg translation: `-af volume=[+/-][amount]dB`

#### Image Overlay Expression

```
overlay image [string] at [position]
```

Examples:
- `overlay image "logo.png" at top-right`
- `overlay image "watermark.png" at bottom-left`

FFmpeg translation: `-i [image_path] -filter_complex "[0:v][1:v]overlay=[x]:[y]"`

#### Scaling Expression

```
scale to [width]x[height] preserve aspect ratio
```

Examples:
- `scale to 1280x720`
- `scale to 1920x1080 preserve aspect ratio`

FFmpeg translation: `-vf scale=[width]:[height][:force_original_aspect_ratio=decrease]`

#### Rotation Expression

```
rotate [number] degrees
```

Examples:
- `rotate 90 degrees`
- `rotate 180 degrees`

FFmpeg translation: `-vf transpose=[value]` or `-vf rotate=[radians]`

#### Cropping Expression

```
crop [number][unit] from [side]
```

Examples:
- `crop 100px from top`
- `crop 200px from left`

FFmpeg translation: `-vf crop=[width]:[height]:[x]:[y]`

#### Fading Expression

```
fade [in|out] for [duration] starting at [time]
```

Examples:
- `fade in for 3s`
- `fade out for 2s starting at 10s`

FFmpeg translation: `-vf fade=t=[in|out]:st=[start_time]:d=[duration]`

#### Speed Adjustment Expression

```
[speed up|slow down] by [factor]
```

Examples:
- `speed up by 2`
- `slow down by 0.5`

FFmpeg translation: `-vf setpts=PTS/[factor] -af atempo=[factor]`

#### Format Conversion Expression

```
convert to [format]
```

Examples:
- `convert to mp4`
- `convert to gif`

FFmpeg translation: `-f [format]`

#### Effect Expression

```
add [effect] with [parameter] [value]
```

Examples:
- `add blur with radius 5`
- `add brightness with value 0.2`

FFmpeg translation: `-vf [filter]=[parameters]`
