export interface ServerDetails {
  id: string;
  name: string;
  transportType: "stdio" | "sse" | "streamable-http";
  isConnected?: boolean;
  url?: string;
  sessionId?: string;
  command?: string;
  args?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  timeout?: number;
  lastConnectionError?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  serverId: string;
  type: 'ping' | 'tools' | 'chat' | 'mcp' | 'http-api' | 'configuration' | string;
  title: string;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  details: Record<string, unknown>;
}
