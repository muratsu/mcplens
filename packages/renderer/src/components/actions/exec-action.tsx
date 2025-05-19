"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bot } from "lucide-react";
import type { ServerDetails, HistoryEntry } from "@/types/server";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useServerPort } from "@/lib/utils";

interface ExecActionProps {
  server: ServerDetails;
  addToHistory: (entry: HistoryEntry) => void;
}

interface TextSegment {
  type: 'text' | 'badge' | 'important';
  content: string;
}

export function ExecAction({ server, addToHistory }: ExecActionProps) {
  const serverPort = useServerPort();
  // Using underscore to indicate unused state variable
  const [, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [showStreamingCard, setShowStreamingCard] = useState(false);
  const [instructions, setInstructions] = useState("");

  // Reset state when server changes
  useEffect(() => {
    setResponse(null);
    setStreamingText("");
    setShowStreamingCard(false);
    setInstructions("");
  }, [server.id]);

  const fetchExecEndpoint = async () => {
    if (!serverPort) return;

    setLoading(true);
    setResponse(null);
    setStreamingText("");
    setShowStreamingCard(true);

    try {
      const startTime = Date.now();
      const response = await fetch(`http://localhost:${serverPort}/api/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serverDetails: {
            name: server.id,
            command: server.command,
            args: server.args || '',
            env: server.env || {},
            transportType: 'stdio'
          },
          userInstructions: instructions
        })
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      let receivedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        receivedText += chunk;
        setStreamingText(receivedText);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      setResponse(receivedText);

      // Add to history
      addToHistory({
        id: `http-api-${Date.now()}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "http-api",
        title: "HTTP API Request",
        duration,
        status: "success",
        details: {
          url: `/api/exec`,
          method: "POST",
          response: receivedText,
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";

      // Add to history
      addToHistory({
        id: `http-api-${Date.now()}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "http-api",
        title: "HTTP API Request",
        duration: 0,
        status: "error",
        details: {
          url: `/api/exec`,
          method: "POST",
          error: errorMessage,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const parseStreamingText = (text: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let currentIndex = 0;

    while (currentIndex < text.length) {
      // Check for badge pattern $$text$$
      const badgeMatch = text.slice(currentIndex).match(/^\$\$(.*?)\$\$/s);
      if (badgeMatch) {
        segments.push({
          type: 'badge',
          content: badgeMatch[1].charAt(0).toUpperCase() + badgeMatch[1].slice(1)
        });
        currentIndex += badgeMatch[0].length;
        continue;
      }

      // Check for important text pattern %%text%%
      const importantMatch = text.slice(currentIndex).match(/^%%(.*?)%%/s);
      if (importantMatch) {
        segments.push({
          type: 'important',
          content: importantMatch[1]
        });
        currentIndex += importantMatch[0].length;
        continue;
      }

      // Regular text
      let nextSpecialIndex = text.length;
      const nextBadgeIndex = text.indexOf('$$', currentIndex);
      const nextImportantIndex = text.indexOf('%%', currentIndex);

      if (nextBadgeIndex !== -1) {
        nextSpecialIndex = Math.min(nextSpecialIndex, nextBadgeIndex);
      }
      if (nextImportantIndex !== -1) {
        nextSpecialIndex = Math.min(nextSpecialIndex, nextImportantIndex);
      }

      if (nextSpecialIndex > currentIndex) {
        const textContent = text.slice(currentIndex, nextSpecialIndex);
        if (textContent.trim()) {  // Only add non-empty text segments
          segments.push({
            type: 'text',
            content: textContent
          });
        }
        currentIndex = nextSpecialIndex;
      } else {
        // Handle any remaining text
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {  // Only add non-empty text segments
          segments.push({
            type: 'text',
            content: remainingText
          });
        }
        break;
      }
    }

    return segments;
  };

  const formatStreamingText = (text: string) => {
    if (!text) return null;

    const segments = parseStreamingText(text);

    return (
      <div className="space-y-3">
        {segments.map((segment, index) => {
          switch (segment.type) {
            case 'badge':
              return (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm border-2"
                >
                  {segment.content}
                </Badge>
              );
            case 'important':
              return (
                <div
                  key={index}
                  className="border-l-2 border-gray-200 pl-4 ml-2"
                >
                  <pre className="whitespace-pre-wrap break-all font-mono text-sm pl-8">
                    {segment.content}
                  </pre>
                </div>
              );
            default:
              return <span key={index} className="whitespace-pre-wrap">{segment.content}</span>;
          }
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center">
              <Bot className="mr-2 h-5 w-5 text-red-500" />
              Exec Tasks
            </div>
          </CardTitle>
          <CardDescription>
          Apply reasoning to instructions and execute tasks against the tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm mb-2">Instructions:</p>
              <Textarea
                placeholder="Enter your instructions here..."
                className="min-h-[200px]"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={fetchExecEndpoint} disabled={!serverPort || loading}>
            {loading ? "Loading..." : "Submit"}
          </Button>
        </CardFooter>
      </Card>

      {showStreamingCard && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center">
                <Bot className="mr-2 h-5 w-5 text-red-500" />
                Streaming Response
              </div>
            </CardTitle>
            <CardDescription>
              Live streaming response from the server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <div className="min-h-[100px] overflow-auto">
                {streamingText ? formatStreamingText(streamingText) : "Waiting for data..."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
