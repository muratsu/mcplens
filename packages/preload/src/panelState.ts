import { ipcRenderer } from 'electron';

export interface PanelState {
  isSidebarCollapsed: boolean;
  isHistoryPanelOpen: boolean;
}

export function savePanelState(state: Partial<PanelState>): Promise<void> {
  return ipcRenderer.invoke('panel-state:save', state);
}

export function getPanelState(): Promise<PanelState> {
  return ipcRenderer.invoke('panel-state:get');
}