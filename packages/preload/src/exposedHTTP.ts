import { contextBridge, ipcRenderer } from 'electron';

/**
 * The "api" Object will be exposed in the renderer under "window.api".
 */
contextBridge.exposeInMainWorld('httpServer', {
  /**
   * Gets the port of the HTTP server running in the main process
   */
  getServerPort: () => ipcRenderer.invoke('get-http-server-port'),
});