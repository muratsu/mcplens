import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import { initMCPService } from '../services/mcpService.js';
import { ipcMain } from 'electron';

// Initialize the MCP Service as an app module
export function registerMCPService(): AppModule {
  return {
    async enable(context: ModuleContext) {
      // Initialize the MCP service
      const mcpService = initMCPService();
      
      // Add cleanup function to context
      context.app.on('before-quit', async () => {
        // Clean up IPC handlers
        ipcMain.removeHandler('mcp:createSession');
        ipcMain.removeHandler('mcp:sendMessage');
        ipcMain.removeHandler('mcp:closeSession');
        ipcMain.removeHandler('mcp:getConfig');
      });
    }
  };
}