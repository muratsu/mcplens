import Store from 'electron-store';
import { app } from 'electron';

// Define the schema for our store
export interface MCPLensStore {
  servers: ServerConfig[];
}

// Define server configuration type
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

// Set default values
const defaults: MCPLensStore = {
  servers: [],
};

// Create and export the store instance
export const store = new Store<MCPLensStore>({
  name: 'mcplens-data',
  defaults,
  // In development, store in a different location to avoid conflicts
  cwd: app.isPackaged ? undefined : 'dev-app-data',
});

// Helper functions to access and modify the store
export function getAllServers(): ServerConfig[] {
  return store.get('servers');
}

export function getServerById(id: string): ServerConfig | undefined {
  const servers = getAllServers();
  return servers.find(server => server.id === id);
}

export function addServer(server: Omit<ServerConfig, 'id'>): ServerConfig {
  const servers = getAllServers();
  const newServer = {
    id: Date.now().toString(), // Simple ID generation
    ...server,
    // Set default timeout if not provided
    timeout: server.timeout || 30000,
  };

  store.set('servers', [...servers, newServer]);
  return newServer;
}

export function updateServer(server: ServerConfig): ServerConfig {
  const servers = getAllServers();
  const updatedServers = servers.map(s =>
    s.id === server.id ? server : s
  );

  store.set('servers', updatedServers);
  return server;
}

export function deleteServer(id: string): void {
  const servers = getAllServers();
  const filteredServers = servers.filter(s => s.id !== id);

  store.set('servers', filteredServers);
}