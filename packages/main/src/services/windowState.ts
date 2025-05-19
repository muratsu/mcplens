import Store from 'electron-store';
import { app, BrowserWindow, Rectangle } from 'electron';

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

export const windowStateStore = new Store<WindowState>({
  name: 'window-state',
  // In development, store in a different location to avoid conflicts
  cwd: app.isPackaged ? undefined : 'dev-app-data',
});

export function saveWindowState(window: BrowserWindow): void {
  if (!window || window.isDestroyed()) return;

  const isMaximized = window.isMaximized();
  // Only update the size if the window isn't maximized
  if (!isMaximized) {
    const bounds = window.getBounds();
    windowStateStore.set({
      width: bounds.width,
      height: bounds.height,
      x: bounds.x,
      y: bounds.y,
      isMaximized: false
    });
  } else {
    windowStateStore.set('isMaximized', true);
  }
}

export function getWindowState(): WindowState {
  // Default window dimensions
  const defaultState: WindowState = {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    isMaximized: false
  };

  return { ...defaultState, ...windowStateStore.store };
}