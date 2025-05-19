import type { AppModule } from '../AppModule.js';
import { ModuleContext } from '../ModuleContext.js';
import { ipcMain } from 'electron';
import { savePanelState, getPanelState } from '../services/panelState.js';

class PanelStateModule implements AppModule {
  async enable({}: ModuleContext): Promise<void> {
    // Set up IPC handlers for panel state
    ipcMain.handle('panel-state:save', (_, state) => {
      savePanelState(state);
    });

    ipcMain.handle('panel-state:get', () => {
      return getPanelState();
    });
  }
}

export function createPanelStateModule() {
  return new PanelStateModule();
}