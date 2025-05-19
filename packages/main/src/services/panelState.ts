import Store from 'electron-store';
import { app } from 'electron';

interface PanelState {
  isSidebarCollapsed: boolean;
  isHistoryPanelOpen: boolean;
}

export const panelStateStore = new Store<PanelState>({
  name: 'panel-state',
  // In development, store in a different location to avoid conflicts
  cwd: app.isPackaged ? undefined : 'dev-app-data',
  defaults: {
    isSidebarCollapsed: false,
    isHistoryPanelOpen: true
  }
});

export function savePanelState(state: Partial<PanelState>): void {
  if (state.isSidebarCollapsed !== undefined) {
    panelStateStore.set('isSidebarCollapsed', state.isSidebarCollapsed);
  }
  if (state.isHistoryPanelOpen !== undefined) {
    panelStateStore.set('isHistoryPanelOpen', state.isHistoryPanelOpen);
  }
}

export function getPanelState(): PanelState {
  return panelStateStore.store;
}