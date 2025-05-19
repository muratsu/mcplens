import { Request, Response, NextFunction } from "express";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { getDefaultEnvironment } from "../utils/environment.js";

export async function handleListTools(req: Request, res: Response, next: NextFunction) {
  try {
    const serverDetails = req.body;
    let transport;

    // TODO: error handling here is terrible, need to fix this and return better messages

    // Determine the server type and create the appropriate transport
    if (serverDetails.transportType !== 'stdio') {
      res.status(400).json({ error: 'Invalid server type' });
      return;
    }

    transport = new StdioClientTransport({
      command: serverDetails.command,
      args: serverDetails.args.split(" "),
      env: { ...getDefaultEnvironment(), ...serverDetails.env },
      stderr: "pipe"
      });

    const client = new Client({
      name: "mcp-lens",
      version: "0.0.1"
    });

    await client.connect(transport);
    const tools = await client.listTools()

    res.json(tools);
  } catch (error: unknown) {
    console.error('List tools error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to list tools'
    });
  }
}
