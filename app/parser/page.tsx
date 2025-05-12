export default function Parser() {
  const code = `# Example code in natural ffmpeg language

convert x from jpg to png
        
move "Hello World" to output
        
cut data if x > 1add text "Welcome!" in top-left aligned left with margin 20px;
        
overlay_image "logo.png" at bottom-right;
        
trim from 00:00:10 to 00:00:20;
        
scale to 1280x720 preserve aspect ratio;
        
convert to mp40
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
  const words = code.match(pattern);
  return (
    <div className="px-64 py-8">
      {words?.map((w, idx) => (
        <p key={idx} className="text-white">
          {w}
        </p>
      ))}
      <p>Parser</p>
    </div>
  );
}
