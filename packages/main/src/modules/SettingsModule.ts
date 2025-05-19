import { ipcMain } from 'electron';
import Store from 'electron-store';
import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';

interface AppSettings {
  openaiApiKey?: string;
}

// Settings store for app-wide settings
const settingsStore = new Store<AppSettings>({
  name: 'mcplens-settings',
  defaults: {
    openaiApiKey: ''
  }
});

// Settings module that registers IPC handlers for app settings
export function registerSettingsHandlers(): AppModule {
  return {
    enable(context: ModuleContext) {
      // Get OpenAI API key
      ipcMain.handle('settings:getOpenAIKey', () => {
        return settingsStore.get('openaiApiKey');
      });

      // Set OpenAI API key
      ipcMain.handle('settings:setOpenAIKey', (_, apiKey: string) => {
        settingsStore.set('openaiApiKey', apiKey);
        return true;
      });

      // Add shutdown handler for cleanup
      process.on('exit', () => {
        ipcMain.removeHandler('settings:getOpenAIKey');
        ipcMain.removeHandler('settings:setOpenAIKey');
      });
    }
  };
}