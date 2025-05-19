declare global {
  interface Window {
    // Exposed by Electron
    versions: {
      chrome: string;
      node: string;
      electron: string;
    };
    // Panel state methods
    savePanelState: (state: { isSidebarCollapsed?: boolean; isHistoryPanelOpen?: boolean }) => Promise<void>;
    getPanelState: () => Promise<{ isSidebarCollapsed: boolean; isHistoryPanelOpen: boolean }>;
    // ... other window properties
  }
}

export {};