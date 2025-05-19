import { ipcRenderer } from 'electron';

// Types for transport configuration
export interface TransportConfig {
  transportType: 'stdio' | 'sse' | 'streamable-http';
  url?: string;
  command?: string;
  args?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

// Create a new MCP session
export async function createMCPSession(config: TransportConfig): Promise<{ sessionId: string }> {
  return await ipcRenderer.invoke('mcp:createSession', config);
}

// Send a message to an MCP transport
export async function sendMCPMessage(sessionId: string, message: any): Promise<any> {
  return await ipcRenderer.invoke('mcp:sendMessage', { sessionId, message });
}

// Close an MCP session
export async function closeMCPSession(sessionId: string): Promise<boolean> {
  return await ipcRenderer.invoke('mcp:closeSession', sessionId);
}

// Get MCP configuration
export async function getMCPConfig(): Promise<any> {
  return await ipcRenderer.invoke('mcp:getConfig');
}

// Register a callback for receiving messages from the MCP transport
export function onMCPMessage(callback: (data: { sessionId: string; message: any }) => void): () => void {
  const handler = (_: any, data: { sessionId: string; message: any }) => {
    callback(data);
  };
  
  ipcRenderer.on('mcp:message', handler);
  
  // Return a function to remove the listener
  return () => {
    ipcRenderer.removeListener('mcp:message', handler);
  };
}