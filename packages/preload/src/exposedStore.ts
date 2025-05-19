import {contextBridge} from 'electron';
import {
  getAllServers,
  getServerById,
  addServer,
  updateServer,
  deleteServer,
} from './store.js';

// Expose the store functions to the renderer without base64 encoding
contextBridge.exposeInMainWorld('getAllServers', getAllServers);
contextBridge.exposeInMainWorld('getServerById', getServerById);
contextBridge.exposeInMainWorld('addServer', addServer);
contextBridge.exposeInMainWorld('updateServer', updateServer);
contextBridge.exposeInMainWorld('deleteServer', deleteServer);