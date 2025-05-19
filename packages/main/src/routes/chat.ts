import { NextFunction, Request, Response } from "express";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { CoreMessage } from "@mastra/core"; // Import CoreMessage
import { MCPClient } from "@mastra/mcp";
import { getDefaultEnvironment } from "../utils/environment.js";
import { createOpenAI } from '@ai-sdk/openai';
import Store from 'electron-store';

// Settings store for app-wide settings
const settingsStore = new Store<{ openaiApiKey?: string }>({
  name: 'mcplens-settings',
  defaults: {
    openaiApiKey: ''
  }
});

const openai = createOpenAI({
  apiKey: settingsStore.get('openaiApiKey') || process.env.OPENAI_API_KEY
});

const agent = new Agent({
  name: "ChatAgent",
  instructions: "You are a helpful assistant.",
  model: openai("gpt-4o"),
  memory: new Memory(), // enable memory
});

export async function handleChat(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Set headers for streaming response
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  // Get data structured by experimental_prepareRequestBody
  const {
    message,
    threadId,
    resourceId,
    serverDetails
  }: { message: CoreMessage | null; threadId: string; resourceId: string; serverDetails: any } =
    await req.body;

  // Handle cases where message might be null (e.g., initial load or error)
  if (!message || !message.content) {
    // Return an appropriate response or error
    res.status(400).json({ error: "Missing message content" });
    return;
  }

  try {
    // Convert message content to string if it's not already
    const messageContent =
      typeof message.content === "string"
        ? message.content
        : JSON.stringify(message.content);

    const userMcp = new MCPClient({
      servers: {
        [serverDetails.name]: {
          command: serverDetails.command,
          args: serverDetails.args.split(" "),
          env: { ...getDefaultEnvironment(), ...serverDetails.env },
        },
      },
    });

    const { textStream } = await agent.stream(messageContent, {
      threadId,
      resourceId,
      toolsets: await userMcp.getToolsets()
    });

    // Stream the response
    for await (const chunk of textStream) {
      res.write(chunk);
    }
    res.end();
    await userMcp.disconnect();
  } catch (error) {
    console.error("Streaming error:", error);
    res.status(500).json({ error: "Error during streaming" });
  }
}
