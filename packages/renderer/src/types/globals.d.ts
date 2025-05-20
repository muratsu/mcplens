interface Window {
  // Electron Store Methods
  getAllServers: () => Promise<ServerConfig[]>;
  getServerById: (id: string) => Promise<ServerConfig>;
  addServer: (server: Omit<ServerConfig, "id">) => Promise<ServerConfig>;
  updateServer: (server: ServerConfig) => Promise<ServerConfig>;
  deleteServer: (id: string) => Promise<boolean>;

  // Panel State Methods
  savePanelState: (state: {
    isSidebarCollapsed?: boolean;
    isHistoryPanelOpen?: boolean;
  }) => Promise<void>;
  getPanelState: () => Promise<{
    isSidebarCollapsed: boolean;
    isHistoryPanelOpen: boolean;
  }>;

  // HTTP Server Methods
  getHttpServerPort: () => Promise<number>;

  // MCP Service Methods
  createMCPSession: (config: TransportConfig) => Promise<{ sessionId: string }>;
  sendMCPMessage: (sessionId: string, message: MCPMessage) => Promise<any>;
  closeMCPSession: (sessionId: string) => Promise<boolean>;
  getMCPConfig: () => Promise<any>;
  onMCPMessage: (
    callback: (data: { sessionId: string; message: MCPMessage }) => void
  ) => () => void;

  // Settings Methods
  getOpenAIKey: () => Promise<string>;
  setOpenAIKey: (apiKey: string) => Promise<boolean>;
}
