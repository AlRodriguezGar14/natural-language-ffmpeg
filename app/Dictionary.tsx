"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Copy,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Scissors,
  Type,
  Crop,
  Clock,
  Volume2,
  LucideProps,
} from "lucide-react";

export default function Dictionary() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({
    code,
    language = "bash",
    title,
    description,
    id,
  }: {
    code: string;
    language?: string;
    title?: string;
    description?: string;
    id: string;
  }) => (
    <div className="space-y-2">
      {title && <h4 className="text-sm font-medium text-gray-300">{title}</h4>}
      {description && <p className="text-xs text-gray-400">{description}</p>}
      <div className="relative group">
        <pre className="text-gray-100 p-4 rounded-lg overflow-x-auto text-sm border">
          <code lang={language}>{code}</code>
        </pre>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => copyToClipboard(code, id)}
        >
          {copiedCode === id ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );

  const ExampleCard = ({
    title,
    description,
    naturalCode,
    ffmpegCode,
    explanation,
    icon: Icon,
  }: {
    title: string;
    description: string;
    naturalCode: string;
    ffmpegCode: string;
    explanation: string;
    icon: react.ForwardRefExoticComponent<Omit<LucideProps, "ref">>;
  }) => (
    <Card className="bg-[#161F27] border-transparent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-blue-400" />
          <CardTitle className="text-white">{title}</CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-green-400 mb-2">
            Natural Language:
          </h4>
          <CodeBlock
            code={naturalCode}
            language="text"
            id={`natural-${title}`}
          />
        </div>

        <div>
          <h4 className="text-sm font-medium text-blue-400 mb-2">
            Generated FFmpeg:
          </h4>
          <CodeBlock code={ffmpegCode} language="bash" id={`ffmpeg-${title}`} />
        </div>

        <div className="bg-[#31383F] p-3 rounded-lg">
          <p className="text-sm text-gray-300">{explanation}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen  text-white">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text text-transparent">
            The Natural FFmpeg Language
          </h1>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-[#161F27] text-gray-300">
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="overview"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="video"
            >
              Video
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="audio"
            >
              Audio
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="timing"
            >
              Timing
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="examples"
            >
              Examples
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-[#31383F]"
              value="advanced"
            >
              Advanced
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white">Basic Syntax</CardTitle>
                <CardDescription className="text-gray-400">
                  Learn the fundamental rules of Natural FFmpeg Language
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-400">✅ Rules</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• One command per line</li>
                      <li>• Commands are case-insensitive</li>
                      <li>• Use explicit units (px, s)</li>
                      <li>• Quote text with spaces</li>
                      <li>• Comments start with #</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-red-400">❌ Avoid</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Don&apos;t worry about FFmpeg syntax</li>
                      <li>• Don&apos;t manually optimize</li>
                      <li>• Don&apos;t mix time formats</li>
                      <li>• System handles complexity</li>
                    </ul>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <h4 className="font-medium text-blue-400 mb-2">
                    Comments Example
                  </h4>
                  <CodeBlock
                    code={`# This is a comment
# Comments are ignored during processing
crop 100px from left  # Inline comments work too`}
                    language="text"
                    id="comments-example"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExampleCard
                title="Basic Cropping"
                description="Remove pixels from video edges"
                naturalCode={`crop 100px from left
crop 50px from right
crop 25px from top`}
                ffmpegCode={`ffmpeg -i input.mp4 -vf "crop=1770:1055:100:25" output.mp4`}
                explanation="Multiple crop commands are automatically optimized into a single efficient operation. The system calculates the final dimensions and position."
                icon={Crop}
              />

              <ExampleCard
                title="Advanced Cropping"
                description="Symmetric cropping"
                naturalCode={`crop 50px from width
crop 30px from height`}
                ffmpegCode={`ffmpeg -i input.mp4 -vf "crop=1820:1020:50:30" output.mp4`}
                explanation="Width/height crops both sides equally."
                icon={Scissors}
              />

              <ExampleCard
                title="Automatic Cropping"
                description="Automatic cropping"
                naturalCode={`crop 0px from each`}
                ffmpegCode={`ffmpeg -i input.mp4 -vf "cropdetect=24:16:0" output.mp4`}
                explanation="Zero-pixel crop enables automatic black border detection."
                icon={Scissors}
              />

              <ExampleCard
                title="Video Scaling"
                description="Resize video dimensions"
                naturalCode={`scale to 1920x1080 preserve aspect ratio
scale to 1280x720 ignore aspect ratio`}
                ffmpegCode={`ffmpeg -i input.mp4 -vf "scale=1920:1080:force_original_aspect_ratio=decrease,scale=1280:720" output.mp4`}
                explanation="'Ignore aspect ratio' forces exact dimensions."
                icon={FileVideo}
              />

              <ExampleCard
                title="Text Overlay"
                description="Add text to your video"
                naturalCode={`add_text "Hello World" at center
add_text "Top Left" at top-left`}
                ffmpegCode={`ffmpeg -i input.mp4 -vf "drawtext=text='Hello World':fontsize=24:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=text='Top Left':fontsize=24:fontcolor=white:x=10:y=10" output.mp4`}
                explanation="Text positioning is automatically calculated. Supports center, corners, and custom positions."
                icon={Type}
              />
            </div>

            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white">Fade Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="fade-in" className="border-gray-700">
                    <AccordionTrigger className="text-white">
                      Fade In
                    </AccordionTrigger>
                    <AccordionContent>
                      <CodeBlock
                        code="fade in for 3s"
                        title="Natural Language"
                        id="fade-in"
                      />
                      <CodeBlock
                        code='ffmpeg -i input.mp4 -vf "fade=in:0:3" output.mp4'
                        title="Generated FFmpeg"
                        id="fade-in-ffmpeg"
                      />
                      <p className="text-sm text-gray-400 mt-2">
                        Creates a 3-second fade from black to the video content.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fade-out" className="border-gray-700">
                    <AccordionTrigger className="text-white">
                      Fade Out
                    </AccordionTrigger>
                    <AccordionContent>
                      <CodeBlock
                        code="fade out for 2s"
                        title="Natural Language"
                        id="fade-out"
                      />
                      <CodeBlock
                        code='ffmpeg -i input.mp4 -vf "fade=out:st=0:d=2" output.mp4'
                        title="Generated FFmpeg"
                        id="fade-out-ffmpeg"
                      />
                      <p className="text-sm text-gray-400 mt-2">
                        Creates a 2-second fade from video content to black.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="space-y-6">
            <ExampleCard
              title="Audio Compression"
              description="Optimize audio quality and file size"
              naturalCode={`compress audio
compress video`}
              ffmpegCode={`ffmpeg -i input.mp4 -crf 23 output.mp4`}
              explanation="Video compression uses CRF 23 for good quality/size balance. Audio compression applies optimal settings."
              icon={Volume2}
            />

            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white">
                  Subtitle Integration
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Burn subtitles directly into the video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <CodeBlock
                  code={`burn subtitles "movie.srt" at default`}
                  title="Natural Language"
                  id="subtitles"
                />
                <CodeBlock
                  code={`ffmpeg -i input.mp4 -vf "subtitles=movie.srt" output.mp4`}
                  title="Generated FFmpeg"
                  id="subtitles-ffmpeg"
                />
                <p className="text-sm text-gray-400">
                  Supports SRT, ASS, and other subtitle formats (pending to
                  implement). Subtitles are permanently burned into the video.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timing Tab */}
          <TabsContent value="timing" className="space-y-6">
            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  Time Formats Supported
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-green-400">
                      Format Examples
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <code className="text-blue-300">10</code>
                        <span className="text-gray-400">10 seconds</span>
                      </div>
                      <div className="flex justify-between">
                        <code className="text-blue-300">1:30</code>
                        <span className="text-gray-400">
                          1 minute 30 seconds
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <code className="text-blue-300">1:23:45</code>
                        <span className="text-gray-400">
                          1 hour 23 minutes 45 seconds
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <code className="text-blue-300">00:10.50</code>
                        <span className="text-gray-400">
                          10.5 seconds (precise)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-blue-400">Optimization</h4>
                    <p className="text-sm text-gray-400">
                      Timing commands are automatically placed before the input
                      file for faster processing. FFmpeg seeks directly to the
                      start time instead of decoding the entire file.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ExampleCard
              title="Video Trimming"
              description="Extract specific time segments"
              naturalCode={`trim from 1:30 to 3:45
trim from 00:10.50 to 00:25.75`}
              ffmpegCode={`ffmpeg -ss 1:30 -to 3:45 -ss 00:10.50 -to 00:25.75 -i input.mp4 output.mp4`}
              explanation="Multiple trim commands extract different segments. Timing is optimized for faster processing."
              icon={Scissors}
            />
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-[#161F27] border-transparent">
                <CardHeader>
                  <CardTitle className="text-white">
                    Complete Workflow Examples
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-green-400 mb-3">
                      📱 Social Media Clip
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Natural Language
                        </h5>
                        <CodeBlock
                          code={`# Extract 30-second highlight
trim from 2:15 to 2:45
crop 100px from width
scale to 1080x1080 ignore aspect ratio
add_text "Follow @myaccount" at bottom-right
fade in for 1s
convert to mp4`}
                          id="social-natural"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Generated FFmpeg
                        </h5>
                        <CodeBlock
                          code={`ffmpeg -ss 2:15 -to 2:45 -i input.mp4 -vf "crop=1720:1080:100:0,scale=1080:1080,drawtext=text='Follow @myaccount':fontsize=24:fontcolor=white:x=w-text_w-10:y=h-text_h-10,fade=in:0:1" -f mp4 output.mp4`}
                          id="social-ffmpeg"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h4 className="font-medium text-green-400 mb-3">
                      🎬 Professional Edit
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Natural Language
                        </h5>
                        <CodeBlock
                          code={`# Professional video processing
trim from 0:30 to 5:00
crop 50px from each
scale to 1920x1080 preserve aspect ratio
burn subtitles "final.srt" at default
add_text "© 2024 Company" at bottom-left
fade in for 2s
fade out for 2s
compress video
convert to mp4`}
                          id="professional-natural"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Generated FFmpeg
                        </h5>
                        <CodeBlock
                          code={`ffmpeg -ss 0:30 -to 5:00 -i input.mp4 -vf "crop=1820:980:50:50,scale=1920:1080:force_original_aspect_ratio=decrease,subtitles=final.srt,drawtext=text='© 2024 Company':fontsize=24:fontcolor=white:x=10:y=h-text_h-10,fade=in:0:2,fade=out:st=0:d=2" -f mp4 -crf 23 output.mp4`}
                          id="professional-ffmpeg"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <h4 className="font-medium text-green-400 mb-3">
                      🔧 Complex Processing
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Natural Language
                        </h5>
                        <CodeBlock
                          code={`# Multiple operations with optimization
crop 200px from left
crop 100px from right
crop 50px from top
crop 25px from bottom
scale to 1280x720 ignore aspect ratio
add_text "Version 2.1" at top-right
burn subtitles "lang_en.srt" at default
fade in for 3s
compress video
convert to webm`}
                          id="complex-natural"
                        />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-300 mb-2">
                          Generated FFmpeg (Optimized)
                        </h5>
                        <CodeBlock
                          code={`ffmpeg -i input.mp4 -vf "crop=1220:645:200:50,scale=1280:720,drawtext=text='Version 2.1':fontsize=24:fontcolor=white:x=w-text_w-10:y=10,subtitles=lang_en.srt,fade=in:0:3" -f webm  -crf 23output.webm`}
                          id="complex-ffmpeg"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#161F27] border-transparent">
                <CardHeader>
                  <CardTitle className="text-white">
                    🎯 Filter Ordering
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        1
                      </Badge>
                      <span className="text-sm text-gray-300">
                        Input timing (before -i)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        2
                      </Badge>
                      <span className="text-sm text-gray-300">
                        Video filters (combined in -vf)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        3
                      </Badge>
                      <span className="text-sm text-gray-300">
                        Audio filters (combined in -af)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        4
                      </Badge>
                      <span className="text-sm text-gray-300">
                        Output options (format, codecs)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#161F27] border-transparent">
                <CardHeader>
                  <CardTitle className="text-white">
                    ⚡ Performance Optimizations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>
                      • <strong>Crop Combination:</strong> Multiple crops →
                      Single operation
                    </div>
                    <div>
                      • <strong>Timing Optimization:</strong> Seeks directly to
                      start time
                    </div>
                    <div>
                      • <strong>Filter Grouping:</strong> All video filters in
                      one -vf flag
                    </div>
                    <div>
                      • <strong>Memory Efficiency:</strong> Optimal processing
                      order
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white">
                  🔍 Error Handling & Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">
                      Validation Checks
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Crop dimensions vs video size</li>
                      <li>• Time range validity</li>
                      <li>• File existence (subtitles)</li>
                      <li>• Syntax correctness</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-400 mb-2">
                      Error Recovery
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Continues processing valid commands</li>
                      <li>• Provides helpful error messages</li>
                      <li>• Suggests corrections</li>
                      <li>• Preserves working operations</li>
                    </ul>
                  </div>
                </div>

                <Alert className="bg-yellow-900 border-yellow-700">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle className="text-yellow-200">
                    Example Error Handling
                  </AlertTitle>
                  <AlertDescription className="text-yellow-300">
                    If you try to crop 2000px from a 1920px wide video, the
                    system will warn you and suggest a maximum crop value, while
                    still processing other valid commands.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card className="bg-[#161F27] border-transparent">
              <CardHeader>
                <CardTitle className="text-white">🚀 Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-400 mb-3">
                      ✅ Recommended
                    </h4>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li>• Use explicit units (px, s) for clarity</li>
                      <li>• Quote text strings containing spaces</li>
                      <li>• Use precise timecodes for exact timing</li>
                      <li>• Group related operations together</li>
                      <li>• Let the system handle optimization</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-400 mb-3">❌ Avoid</h4>
                    <ul className="text-sm text-gray-300 space-y-2">
                      <li>• Don&apos;t manually write FFmpeg syntax</li>
                      <li>• Don&apos;t worry about command ordering</li>
                      <li>• Don&apos;t optimize crops manually</li>
                      <li>• Don&apos;t mix different time formats</li>
                      <li>• Don&apos;t skip validation messages</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="bg-gray-700 mb-6" />
          <p className="text-gray-400 text-sm">
            Natural FFmpeg Language - Making video processing accessible to
            everyone
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Documentation covers current implementation. The language is
            designed to be extensible.
          </p>
        </div>
      </div>
    </div>
  );
}
