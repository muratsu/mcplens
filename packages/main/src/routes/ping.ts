import { Request, Response, NextFunction } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { getDefaultEnvironment } from "../utils/environment.js";

export async function handlePing(req: Request, res: Response, next: NextFunction) {
  try {
    const serverDetails = req.body;
    let transport;

    // TODO: error handling here is terrible, need to fix this and return better messages

    // Determine the server type and create the appropriate transport
    if (serverDetails.transportType === 'stdio') {
      transport = new StdioClientTransport({
        command: serverDetails.command,
        args: serverDetails.args.split(" "),
        env: { ...getDefaultEnvironment(), ...serverDetails.env },
        stderr: "pipe"
      });
    } else if (serverDetails.transportType === 'streamable-http') {
      if (!serverDetails.url) {
        res.status(400).json({ error: 'URL is required for HTTP transport' });
        return;
      }
      transport = new StreamableHTTPClientTransport(
        new URL(serverDetails.url),
        {
          requestInit: {
            headers: serverDetails.headers || {}
          }
        }
      );
    } else if (serverDetails.transportType === 'sse') {
      if (!serverDetails.url) {
        res.status(400).json({ error: 'URL is required for SSE transport' });
        return;
      }
      transport = new SSEClientTransport(
        new URL(serverDetails.url),
        {
          requestInit: {
            headers: serverDetails.headers || {}
          }
        }
      );
    } else {
      res.status(400).json({ error: 'Invalid server type' });
      return;
    }

    const client = new Client({
      name: "mcp-lens",
      version: "0.0.1"
    });

    await client.connect(transport);

    console.log("Connected to server");

    const serverVersion = await client.getServerVersion();

    // If server version exists return pong, otherwise throw an error
    if (serverVersion) {
      res.json({
        message: "pong"
      });
    } else {
      res.status(500).json({ error: 'Failed to ping server' });
    }
  } catch (error: unknown) {
    console.error('Ping error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to ping server'
    });
  }
}
