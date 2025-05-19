import type { NextFunction, Request, Response } from "express";
import { Agent } from "@mastra/core/agent";
import { MCPClient } from "@mastra/mcp";
import { AgentNetwork } from "@mastra/core/network";
import {
  toolUserAgentInstructions,
  thinkingAgentInstructions,
  instructorNetworkInstructions,
} from "../instructions/exec.js";
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

export async function handleExec(req: Request, res: Response, next: NextFunction) {
  // Set headers for streaming
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const { serverDetails, userInstructions } = req.body;

  // TODO: add support for SSE and Streamable HTTP
  if (serverDetails.transportType !== "stdio") {
    res.status(400).json({ error: 'Invalid server type' });
    return;
  }

  try {
    const userMcp = new MCPClient({
      servers: {
        [serverDetails.name]: {
          command: serverDetails.command,
          args: serverDetails.args.split(" "),
          env: { ...getDefaultEnvironment(), ...serverDetails.env },
        },
      },
    });

    // Create specialized agents
    const mcpAgent = new Agent({
      name: "Tool User Agent",
      instructions: toolUserAgentInstructions,
      model: openai("gpt-4o"),
      tools: await userMcp.getTools(),
    });

    const thinkingAgent = new Agent({
      name: "Thinking Agent",
      instructions: thinkingAgentInstructions,
      model: openai("gpt-4o"),
    });

    // Create the network
    const instructorNetwork = new AgentNetwork({
      name: "Instructor Network",
      instructions: instructorNetworkInstructions,
      model: openai("gpt-4o"),
      agents: [mcpAgent, thinkingAgent],
    });

    // Use the network
    const result = await instructorNetwork.stream(
      userInstructions,
      {
        maxSteps: 20
      }
    );

    // TODO: This is a mess, rewrite this later
    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'error':
          console.error(part.error);
          break;
        // case 'text-delta':
        //   res.write(`$$text$$%%${JSON.stringify(part.textDelta, null, 2)}%%`);
        //   console.log(`$$text$$%%${JSON.stringify(part.textDelta, null, 2)}%%`);
        //   break;
        case 'tool-call':
          res.write(`$$calling_tool$$%%${JSON.stringify(part.args, null, 2)}%%`);
          console.log(`$$calling_tool$$%%${JSON.stringify(part.args, null, 2)}%%`);
          break;
        case 'tool-result':
          res.write(`$$tool_result$$%%${JSON.stringify(part.result, null, 2)}%%`);
          console.log(`$$tool_result$$%%${JSON.stringify(part.result, null, 2)}%%`);
          break;
        default:
          console.log(`unknown part: ${JSON.stringify(part, null, 2)}`);
          break;
      }
    }

    // End the response after all chunks are sent
    res.end();
    await userMcp.disconnect();
  } catch (error) {
    next(error);
  }
}