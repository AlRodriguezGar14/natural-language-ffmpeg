"use client";

import { useState, useEffect, useRef } from "react";
import parser from "./parser";

export default function ParsCode() {
  const [code, setCode] = useState(`# Example code in natural ffmpeg language
crop 200px from left
trim from 00:10.00 to 00:00:20.00
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
    const parsed = parser(value);
    setErrors(parsed.errors);
    setCommands(parsed.commands);
    setParsedCommands(parsed.parsedCommands);
  };

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

  // const { errors, commands, parsedCommands } = parser(code);
  return (
    <div className="px-64 py-8 text-white">
      <textarea
        ref={textareaRef}
        value={code}
        onChange={handleInput}
        onScroll={handleScroll}
        className="w-full min-h-80 caret-[#FBDF90] p-12 text-white font-mono bg-transparent resize-none outline-none"
        spellCheck="false"
        style={{
          caretColor: "#FBDF90",
          boxSizing: "border-box",
        }}
      />
      <div className="w-full min-h-80 caret-[#FBDF90] p-12 text-white font-mono bg-transparent resize-none outline-none">
        {code}
      </div>
      <h2>Code</h2>
      <p className="py-8">{code}</p>
      {errors && errors.length && <p className="text-red-600">{errors[0]}</p>}
      <h2>Commands</h2>
      {JSON.stringify(commands, null, 2)}
      <div className="my-12" />
      <h2>Parsed Commands</h2>
      {parsedCommands && parsedCommands.map((c, i) => <p key={i}>{c}</p>)}
    </div>
  );
}
