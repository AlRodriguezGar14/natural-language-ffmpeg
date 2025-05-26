"use client";

import { useState } from "react";
import { probeFile } from "./ffprobe";

export default function FileAnalyzer() {
  const [fileInfo, setFileInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setFileInfo(null);

    try {
      console.log("Starting file analysis for:", file.name);
      const info = await probeFile(file);
      console.log("File analysis complete:", info);
      setFileInfo(info);
    } catch (error) {
      console.error("Error analyzing file:", error);
      setError(error.message);
      // Set basic file info even on error
      setFileInfo({
        filename: file.name,
        size: file.size,
        type: file.type,
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-white">
      <input
        type="file"
        onChange={handleFileSelect}
        accept="video/*,audio/*"
        disabled={loading}
      />

      {loading && <p>Analyzing file...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {fileInfo && (
        <div>
          <h3>File Information:</h3>
          <pre className="whitespace-pre-wrap overflow-auto max-h-96">
            {JSON.stringify(fileInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
