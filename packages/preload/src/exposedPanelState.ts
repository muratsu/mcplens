import { contextBridge } from 'electron';
import { savePanelState, getPanelState } from './panelState.js';

// Expose panel state functions to the renderer
contextBridge.exposeInMainWorld('savePanelState', savePanelState);
contextBridge.exposeInMainWorld('getPanelState', getPanelState);