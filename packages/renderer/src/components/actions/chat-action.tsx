"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { MessageSquare, Send, User, Bot, Sparkles } from "lucide-react";
import type { ServerDetails, HistoryEntry } from "@/types/server";
import { useChat } from "@ai-sdk/react";
import { useServerPort } from "@/lib/utils";

interface ChatActionProps {
  server: ServerDetails;
  addToHistory: (entry: HistoryEntry) => void;
}

export function ChatAction({ server, addToHistory }: ChatActionProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const serverPort = useServerPort();
  const [localInput, setLocalInput] = useState("");

  const { messages, handleSubmit, isLoading, setInput } = useChat({
    api: serverPort ? `http://localhost:${serverPort}/api/chat` : undefined,
    experimental_prepareRequestBody: (request) => {
      const lastMessage =
        request.messages.length > 0
          ? request.messages[request.messages.length - 1]
          : null;
      return {
        message: lastMessage,
        threadId: request.id,
        resourceId: server.id,
        serverDetails: {
          name: server.name,
          command: server.command,
          args: server.args,
          env: server.env || {}
        }
      };
    },
    onFinish: (message) => {
      // Add to history on successful response
      addToHistory({
        id: Date.now().toString(),
        type: "chat",
        title: `Chat with ${server.name}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        status: "success",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          timestamp: new Date().toISOString(),
          userMessage: localInput,
          response: message.content || "",
        },
      });
    },
    onError: (error) => {
      // Add error to history
      addToHistory({
        id: Date.now().toString(),
        type: "chat",
        title: `Chat Error with ${server.name}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        status: "error",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          timestamp: new Date().toISOString(),
          userMessage: localInput,
          error: error,
        },
      });
    },
    streamProtocol: "text"
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset chat messages when server changes
  useEffect(() => {
    setLocalInput("");
    setInput("");
  }, [server.id, setLocalInput, setInput]);

  return (
    <Card className="flex flex-col py-0 pt-6 h-[calc(100vh-104px)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-500" />
          <CardTitle>Chat with Server</CardTitle>
        </div>
        <CardDescription>
          Interact with the MCP server using natural language
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Start a conversation</h3>
              <p className="text-muted-foreground max-w-md">
                Ask questions about the server, request information, or give
                commands using natural language.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex gap-3 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar
                      className={`h-8 w-8 flex items-center justify-center ${
                        message.role === "user" ? "bg-primary" : "bg-green-500"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4 text-primary-foreground" />
                      ) : (
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      )}
                    </Avatar>

                    <div>
                      <div
                        className={`rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.content}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 px-1">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (localInput.trim()) {
              handleSubmit(e);
              setLocalInput("");
              setInput("");
            }
          }}
          className="flex w-full gap-2"
        >
          <Input
            placeholder="Type your message..."
            value={localInput}
            onChange={(e) => {
              const newValue = e.target.value;
              setLocalInput(newValue);
              setInput(newValue);
            }}
            disabled={isLoading || !serverPort}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!localInput.trim() || isLoading || !serverPort}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
