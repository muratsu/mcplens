/// <reference types="vite/client" />

/**
 * Describes all existing environment variables and their types.
 * Required for Code completion/intellisense and type checking.
 *
 * Note: To prevent accidentally leaking env variables to the client, only variables prefixed with `VITE_` are exposed to your Vite-processed code.
 *
 * @see https://github.com/vitejs/vite/blob/0a699856b248116632c1ac18515c0a5c7cf3d1db/packages/vite/types/importMeta.d.ts#L7-L14 Base Interface.
 * @see https://vitejs.dev/guide/env-and-mode.html#env-files Vite Env Variables Doc.
 */
interface ImportMetaEnv {
  /**
   * URL where `renderer` web page is running.
   * This variable is initialized in scripts/watch.ts
   */
  readonly VITE_DEV_SERVER_URL: undefined | string;

  /** Current app version */
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

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
