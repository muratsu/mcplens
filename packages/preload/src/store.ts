import { ipcRenderer } from 'electron';

// Types matching the ones in the main process
export interface ServerConfig {
  id: string;
  name: string;
  transportType: 'stdio' | 'sse' | 'streamable-http';
  // For stdio transport
  command?: string;
  args?: string;
  env?: Record<string, string>;
  // For HTTP-based transports (sse, streamable-http)
  url?: string;
  headers?: Record<string, string>;
  // Common options
  timeout?: number;
}

// Get all servers
export async function getAllServers(): Promise<ServerConfig[]> {
  return ipcRenderer.invoke('store:getAllServers');
}

// Get server by id
export async function getServerById(id: string): Promise<ServerConfig | undefined> {
  return ipcRenderer.invoke('store:getServerById', id);
}

// Add new server
export async function addServer(server: Omit<ServerConfig, 'id'>): Promise<ServerConfig> {
  return ipcRenderer.invoke('store:addServer', server);
}

// Update existing server
export async function updateServer(server: ServerConfig): Promise<ServerConfig> {
  return ipcRenderer.invoke('store:updateServer', server);
}

// Delete server
export async function deleteServer(id: string): Promise<boolean> {
  return ipcRenderer.invoke('store:deleteServer', id);
}