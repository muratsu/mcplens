import express from "express";
import type { NextFunction, Request, Response } from "express";
import type { AddressInfo } from "net";
import { ipcMain } from "electron";
import type { ModuleContext } from "../ModuleContext.js";
import cors from "cors";
import { handleExec } from "../routes/exec.js";
import { handlePing } from "../routes/ping.js";
import { handleChat } from "../routes/chat.js";
import { handleListTools } from "../routes/tools.js";

export function createHTTPServerModule() {
  const app = express();
  let serverPort: number;

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Parse JSON request bodies
  app.use(express.json());

  // Executable endpoint
  app.post("/api/exec", handleExec);
  app.post("/api/ping", handlePing);
  app.post("/api/chat", handleChat);
  app.post("/api/tools", handleListTools);

  let server: ReturnType<typeof app.listen> | null = null;

  return {
    async enable(context: ModuleContext) {
      // Start the server
      server = app.listen(0, () => {
        const addressInfo = server!.address() as AddressInfo;
        serverPort = addressInfo.port;
        console.log(`HTTP server running at http://localhost:${serverPort}`);
      });

      // Expose the server port to the renderer process
      ipcMain.handle("get-http-server-port", () => {
        return serverPort;
      });

      // Listen for app quit event to clean up
      context.app.on("will-quit", () => {
        if (server) {
          server.close();
          server = null;
        }
        ipcMain.removeHandler("get-http-server-port");
      });
    },
  };
}
