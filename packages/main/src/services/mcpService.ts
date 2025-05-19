import { ipcMain, BrowserWindow } from 'electron';
import {
  SSEClientTransport,
  SseError,
} from "@modelcontextprotocol/sdk/client/sse.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { randomUUID } from "crypto";
import { findActualExecutable } from "spawn-rx";
import { parse as shellParseArgs } from "shell-quote";

// Constants
const SSE_HEADERS_PASSTHROUGH = ["authorization"];
const STREAMABLE_HTTP_HEADERS_PASSTHROUGH = [
  "authorization",
  "mcp-session-id",
  "last-event-id",
];

// Default environment variables
const defaultEnvironment = {
  ...getDefaultEnvironment(),
  ...(process.env.MCP_ENV_VARS ? JSON.parse(process.env.MCP_ENV_VARS) : {}),
};

// Transport storage
let backingServerTransport: Transport | undefined;
const transports: Map<string, Transport> = new Map<string, Transport>(); // Transports by sessionId

// Types for communication
interface TransportConfig {
  transportType: 'stdio' | 'sse' | 'streamable-http';
  url?: string;
  command?: string;
  args?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

// Create a transport based on configuration
async function createTransport(config: TransportConfig): Promise<Transport> {
  console.log("Creating transport:", config);

  if (config.transportType === "stdio") {
    if (!config.command) {
      throw new Error("Command is required for stdio transport");
    }

    const origArgs = config.args ? shellParseArgs(config.args) as string[] : [];
    const env = { ...process.env, ...defaultEnvironment, ...(config.env || {}) };

    const { cmd, args } = findActualExecutable(config.command, origArgs);

    console.log(`Stdio transport: command=${cmd}, args=${args}`);

    const transport = new StdioClientTransport({
      command: cmd,
      args,
      env,
      stderr: "pipe",
    });

    await transport.start();
    console.log("Spawned stdio transport");
    return transport;
  } else if (config.transportType === "sse") {
    if (!config.url) {
      throw new Error("URL is required for SSE transport");
    }

    const headers: HeadersInit = {
      Accept: "text/event-stream",
    };

    // Add passed headers
    if (config.headers) {
      for (const key of SSE_HEADERS_PASSTHROUGH) {
        if (config.headers[key]) {
          headers[key] = config.headers[key];
        }
      }
    }

    console.log(`SSE transport: url=${config.url}, headers=${Object.keys(headers)}`);

    const transport = new SSEClientTransport(new URL(config.url), {
      eventSourceInit: {
        fetch: (url, init) => fetch(url, { ...init, headers }),
      },
      requestInit: {
        headers,
      },
    });

    await transport.start();
    console.log("Connected to SSE transport");
    return transport;
  } else if (config.transportType === "streamable-http") {
    if (!config.url) {
      throw new Error("URL is required for Streamable HTTP transport");
    }

    const headers: HeadersInit = {
      Accept: "text/event-stream, application/json",
    };

    // Add passed headers
    if (config.headers) {
      for (const key of STREAMABLE_HTTP_HEADERS_PASSTHROUGH) {
        if (config.headers[key]) {
          headers[key] = config.headers[key];
        }
      }
    }

    const transport = new StreamableHTTPClientTransport(
      new URL(config.url),
      {
        requestInit: {
          headers,
        },
      },
    );

    await transport.start();
    console.log("Connected to Streamable HTTP transport");
    return transport;
  } else {
    console.error(`Invalid transport type: ${config.transportType}`);
    throw new Error("Invalid transport type specified");
  }
}

// Handler for sending messages to the transport
async function sendToTransport(sessionId: string, message: any): Promise<any> {
  const transport = transports.get(sessionId);
  if (!transport) {
    throw new Error(`Transport not found for session ${sessionId}`);
  }

  return await transport.send(message);
}

// Create a new MCP session
async function createSession(config: TransportConfig): Promise<{ sessionId: string }> {
  try {
    // Close any existing transport
    await backingServerTransport?.close();

    // Create the new transport
    backingServerTransport = await createTransport(config);

    // Generate a session ID
    const sessionId = randomUUID();

    // Store the transport
    transports.set(sessionId, backingServerTransport);

    return { sessionId };
  } catch (error) {
    if (error instanceof SseError && error.code === 401) {
      throw new Error(`Unauthorized: ${error.message}`);
    }
    throw error;
  }
}

// Initialize the MCP service
export function initMCPService() {
  // Register IPC handlers
  ipcMain.handle('mcp:createSession', async (_, config: TransportConfig) => {
    return await createSession(config);
  });

  ipcMain.handle('mcp:sendMessage', async (_, { sessionId, message }) => {
    return await sendToTransport(sessionId, message);
  });

  ipcMain.handle('mcp:closeSession', async (_, sessionId: string) => {
    const transport = transports.get(sessionId);
    if (transport) {
      await transport.close();
      transports.delete(sessionId);
      return true;
    }
    return false;
  });

  ipcMain.handle('mcp:getConfig', () => {
    return {
      defaultEnvironment,
    };
  });

  // Setup event listeners for receiving messages from transports
  // We need to listen for messages from the transport and forward them to the renderer
  function setupTransportListeners(sessionId: string, transport: Transport) {
    transport.onmessage = (message) => {
      // Send the message to all renderer processes
      const windows = BrowserWindow.getAllWindows();
      for (const win of windows) {
        if (!win.isDestroyed()) {
          win.webContents.send('mcp:message', { sessionId, message });
        }
      }
    };

    // If it's a stdio transport, handle stderr
    if (transport instanceof StdioClientTransport && transport.stderr) {
      transport.stderr.on('data', (chunk) => {
        const content = chunk.toString();
        const stderr = {
          jsonrpc: "2.0",
          method: "notifications/stderr",
          params: { content }
        };

        // Send stderr notifications to all renderer processes
        const windows = BrowserWindow.getAllWindows();
        for (const win of windows) {
          if (!win.isDestroyed()) {
            win.webContents.send('mcp:message', { sessionId, message: stderr });
          }
        }
      });
    }
  }

  // Watch for new transports and set up listeners
  const originalSet = transports.set;
  transports.set = function(key, value) {
    setupTransportListeners(key, value);
    return originalSet.call(this, key, value);
  };

  return {
    createSession,
    sendToTransport,
    closeSession: async (sessionId: string) => {
      const transport = transports.get(sessionId);
      if (transport) {
        await transport.close();
        transports.delete(sessionId);
        return true;
      }
      return false;
    },
    getConfig: () => ({
      defaultEnvironment,
    }),
  };
}