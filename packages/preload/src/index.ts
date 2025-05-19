import {sha256sum} from './nodeCrypto.js';
import {versions} from './versions.js';
import {ipcRenderer} from 'electron';
import {
  getAllServers,
  getServerById,
  addServer,
  updateServer,
  deleteServer,
  ServerConfig
} from './store.js';
import {
  savePanelState,
  getPanelState,
  PanelState
} from './panelState.js';
import {
  createMCPSession,
  sendMCPMessage,
  closeMCPSession,
  getMCPConfig,
  onMCPMessage,
} from './mcpService.js';
import {
  getOpenAIKey,
  setOpenAIKey
} from './settings.js';

function send(channel: string, message: string) {
  return ipcRenderer.invoke(channel, message);
}

// Import the exposed files to ensure they run
import './exposedStore.js';
import './exposedMCP.js';
import './exposedHTTP.js';
import './exposedPanelState.js';
import './exposedSettings.js';

export {
  sha256sum,
  versions,
  send,
  // Export for internal use
  getAllServers,
  getServerById,
  addServer,
  updateServer,
  deleteServer,
  // Panel state exports
  savePanelState,
  getPanelState,
  // MCP Service exports
  createMCPSession,
  sendMCPMessage,
  closeMCPSession,
  getMCPConfig,
  onMCPMessage,
  // Settings exports
  getOpenAIKey,
  setOpenAIKey,
};
