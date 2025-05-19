import type {AppInitConfig} from './AppInitConfig.js';
import {createModuleRunner} from './ModuleRunner.js';
import {disallowMultipleAppInstance} from './modules/SingleInstanceApp.js';
import {createWindowManagerModule} from './modules/WindowManager.js';
import {terminateAppOnLastWindowClose} from './modules/ApplicationTerminatorOnLastWindowClose.js';
import {hardwareAccelerationMode} from './modules/HardwareAccelerationModule.js';
import {autoUpdater} from './modules/AutoUpdater.js';
import {allowInternalOrigins} from './modules/BlockNotAllowdOrigins.js';
import {allowExternalUrls} from './modules/ExternalUrls.js';
import {registerStoreHandlers} from './modules/StoreManager.js';
import {registerMCPService} from './modules/MCPServiceManager.js';
import { chromeDevToolsExtension } from "./modules/ChromeDevToolsExtension.js";
import { createHTTPServerModule } from "./modules/HTTPServerModule.js";
import { createPanelStateModule } from "./modules/PanelStateModule.js";
import { registerSettingsHandlers } from "./modules/SettingsModule.js";


export async function initApp(initConfig: AppInitConfig) {
  const moduleRunner = createModuleRunner()
    .init(createWindowManagerModule({initConfig, openDevTools: import.meta.env.DEV}))
    .init(disallowMultipleAppInstance())
    .init(terminateAppOnLastWindowClose())
    .init(hardwareAccelerationMode({enable: false}))
    .init(autoUpdater())
    .init(registerStoreHandlers())
    .init(registerMCPService()) // Register store IPC handlers
    .init(registerSettingsHandlers()) // Register settings IPC handlers
    .init(createHTTPServerModule()) // Start HTTP server
    .init(createPanelStateModule()) // Register panel state handlers

    // Install DevTools extension if needed
    .init(chromeDevToolsExtension({extension: "REACT_DEVELOPER_TOOLS"}))

    // Security
    .init(allowInternalOrigins(
      new Set(initConfig.renderer instanceof URL ? [initConfig.renderer.origin] : []),
    ))
    .init(allowExternalUrls(
      new Set(
        initConfig.renderer instanceof URL
          ? [
            'https://vite.dev',
            'https://developer.mozilla.org',
            'https://solidjs.com',
            'https://qwik.dev',
            'https://lit.dev',
            'https://react.dev',
            'https://preactjs.com',
            'https://www.typescriptlang.org',
            'https://vuejs.org',
          ]
          : [],
      )),
    );

  await moduleRunner;
}
