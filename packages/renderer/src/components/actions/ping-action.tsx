"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock } from "lucide-react";
import type { ServerDetails, HistoryEntry } from "@/types/server";
import { useServerPort } from "@/lib/utils";

interface PingActionProps {
  server: ServerDetails;
  addToHistory: (entry: HistoryEntry) => void;
}

export function PingAction({ server, addToHistory }: PingActionProps) {
  const serverPort = useServerPort();
  const [isPinging, setIsPinging] = useState(false);
  const [pingResult, setPingResult] = useState<null | {
    success: boolean;
    time: number;
    errorMessage?: string;
  }>(null);

  // Reset ping result when server changes
  useEffect(() => {
    setPingResult(null);
  }, [server.id]);

  const handlePing = async () => {
    if (!serverPort) return;

    setIsPinging(true);
    setPingResult(null);

    const startTime = Date.now();

    try {
      const response = await fetch(`http://localhost:${serverPort}/api/ping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transportType: server.transportType,
          url: server.url,
          command: server.command,
          args: server.args,
          env: server.env,
          headers: server.headers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to ping server');
      }

      await response.json(); // Just consume the response
      const endTime = Date.now();
      const pingTime = endTime - startTime;

      const result = { success: true, time: pingTime };
      setPingResult(result);

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "ping",
        title: `Ping to ${server.name}`,
        status: "success",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          result: "pong",
          responseTime: `${pingTime}ms`,
        },
      });
    } catch (error) {
      setPingResult({
        success: false,
        time: 0,
        errorMessage: error instanceof Error ? error.message : "Connection failed"
      });

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        serverId: server.id,
        type: "ping",
        title: `Ping to ${server.name} (Failed)`,
        status: "error",
        details: {
          server: server.url || `${server.command} ${server.args}`,
          error: error instanceof Error ? error.message : "Connection failed",
        },
      });
    } finally {
      setIsPinging(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            <CardTitle>Ping Server</CardTitle>
          </div>
          <CardDescription>
            Send a ping request to check if the server is responding
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <p className="font-mono text-sm">
              <span className="text-muted-foreground">Server: </span>
              {server.transportType === 'stdio'
                ? `${server.command} ${server.args}`
                : server.url}
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button onClick={handlePing} disabled={isPinging} className="w-full">
            {isPinging ? "Pinging..." : "Test Connection"}
          </Button>
        </CardFooter>
      </Card>

      {pingResult && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Response</h4>
              <Badge variant={pingResult.success ? "default" : "destructive"}>
                {pingResult.success ? "Success" : "Failed"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {pingResult.success && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  Response time: <strong>{pingResult.time}ms</strong>
                </span>
              </div>
            )}

            {pingResult.success && (
              <div className="mt-2 p-2 bg-muted rounded font-mono text-sm">
                pong
              </div>
            )}

            {!pingResult.success && (
              <div className="mt-2 p-2 bg-destructive/10 text-destructive rounded font-mono text-sm">
                {pingResult.errorMessage}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
