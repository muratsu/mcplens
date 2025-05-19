import {contextBridge} from 'electron';
import {
  createMCPSession,
  sendMCPMessage,
  closeMCPSession,
  getMCPConfig,
  onMCPMessage,
} from './mcpService.js';

// Expose the MCP functions to the renderer without base64 encoding
contextBridge.exposeInMainWorld('createMCPSession', createMCPSession);
contextBridge.exposeInMainWorld('sendMCPMessage', sendMCPMessage);
contextBridge.exposeInMainWorld('closeMCPSession', closeMCPSession);
contextBridge.exposeInMainWorld('getMCPConfig', getMCPConfig);
contextBridge.exposeInMainWorld('onMCPMessage', onMCPMessage);