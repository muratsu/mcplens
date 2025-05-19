import { ipcMain } from 'electron';
import type { AppModule } from '../AppModule.js';
import type { ModuleContext } from '../ModuleContext.js';
import {
  getAllServers,
  getServerById,
  addServer,
  updateServer,
  deleteServer,
  ServerConfig
} from '../services/store.js';

// Store manager module that registers IPC handlers for persistent storage
export function registerStoreHandlers(): AppModule {
  return {
    enable(context: ModuleContext) {
      // Get all servers
      ipcMain.handle('store:getAllServers', () => {
        return getAllServers();
      });

      // Get server by id
      ipcMain.handle('store:getServerById', (_, id: string) => {
        return getServerById(id);
      });

      // Add new server
      ipcMain.handle('store:addServer', (_, serverData: Omit<ServerConfig, 'id'>) => {
        return addServer(serverData);
      });

      // Update existing server
      ipcMain.handle('store:updateServer', (_, server: ServerConfig) => {
        return updateServer(server);
      });

      // Delete server
      ipcMain.handle('store:deleteServer', (_, id: string) => {
        deleteServer(id);
        return true;
      });
      
      // Add shutdown handler for cleanup
      process.on('exit', () => {
        ipcMain.removeHandler('store:getAllServers');
        ipcMain.removeHandler('store:getServerById');
        ipcMain.removeHandler('store:addServer');
        ipcMain.removeHandler('store:updateServer');
        ipcMain.removeHandler('store:deleteServer');
      });
    }
  };
}