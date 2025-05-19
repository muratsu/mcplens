import { ipcRenderer } from 'electron';

// Get OpenAI API key
export async function getOpenAIKey(): Promise<string> {
  return ipcRenderer.invoke('settings:getOpenAIKey');
}

// Set OpenAI API key
export async function setOpenAIKey(apiKey: string): Promise<boolean> {
  return ipcRenderer.invoke('settings:setOpenAIKey', apiKey);
}