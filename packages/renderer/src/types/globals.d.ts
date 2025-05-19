interface Window {
  // Electron Store Methods
  getAllServers: () => Promise<any[]>;
  getServerById: (id: string) => Promise<any>;
  addServer: (server: any) => Promise<any>;
  updateServer: (server: any) => Promise<any>;
  deleteServer: (id: string) => Promise<boolean>;
  
  // Panel State Methods
  savePanelState: (state: {isSidebarCollapsed?: boolean; isHistoryPanelOpen?: boolean}) => Promise<void>;
  getPanelState: () => Promise<{isSidebarCollapsed: boolean; isHistoryPanelOpen: boolean}>;
  
  // HTTP Server Methods
  getHttpServerPort: () => Promise<number>;
  
  // MCP Service Methods
  createMCPSession: (serverId: string) => Promise<boolean>;
  sendMCPMessage: (serverId: string, message: any) => Promise<any>;
  closeMCPSession: (serverId: string) => Promise<boolean>;
  getMCPConfig: (serverId: string) => Promise<any>;
  onMCPMessage: (callback: (event: any) => void) => void;
  
  // Settings Methods
  getOpenAIKey: () => Promise<string>;
  setOpenAIKey: (apiKey: string) => Promise<boolean>;
}