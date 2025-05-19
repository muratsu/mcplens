import { contextBridge } from 'electron';
import { getOpenAIKey, setOpenAIKey } from './settings.js';

// Expose settings functions to renderer
contextBridge.exposeInMainWorld('getOpenAIKey', getOpenAIKey);
contextBridge.exposeInMainWorld('setOpenAIKey', setOpenAIKey);