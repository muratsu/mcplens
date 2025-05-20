"use client";

import { useState } from "react";
import { useServerContext } from "@/context/ServerContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Database, Settings, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { ServerDetails, HistoryEntry } from "@/types/server";

interface ConfigurationActionProps {
  server: ServerDetails;
  addToHistory: (entry: HistoryEntry) => void;
  onServerRemoved?: () => void;
}

export function ConfigurationAction({
  server,
  addToHistory,
  onServerRemoved,
}: ConfigurationActionProps) {
  const { removeServer } = useServerContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRemoveServer = async () => {
    try {
      setIsDeleting(true);
      setError(null);

      await removeServer(server.id);

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        type: "configuration",
        title: `Removed server ${server.name}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        status: "success",
        details: {
          action: "remove",
          server: server.url || `${server.command} ${server.args}`,
        },
      });

      // Notify parent that server was removed
      if (onServerRemoved) {
        onServerRemoved();
      }
    } catch (err) {
      console.error("Error removing server:", err);
      setError("Failed to remove server. Please try again.");

      // Add to history
      addToHistory({
        id: crypto.randomUUID(),
        type: "configuration",
        title: `Failed to remove server ${server.name}`,
        timestamp: new Date().toISOString(),
        serverId: server.id,
        status: "error",
        details: {
          action: "remove",
          server: server.url || `${server.command} ${server.args}`,
          error: "Operation failed",
        },
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-blue-500" />
          <CardTitle>Server Configuration</CardTitle>
        </div>
        <CardDescription>
          View and manage your MCP server connection
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="p-4 bg-muted rounded-md flex items-center space-x-3">
          <Database className="h-5 w-5 text-muted-foreground" />
          <div className="text-sm w-full">
            <p className="font-medium">Connection Details</p>
            <p className="text-muted-foreground">
              Transport: {server.transportType}
            </p>

            {server.transportType === "stdio" ? (
              <>
                {server.command && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Command: {server.command}
                  </p>
                )}
                {server.args && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Arguments: {server.args}
                  </p>
                )}
                {server.env && Object.keys(server.env).length > 0 && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Environment variables: {Object.keys(server.env).length}
                  </p>
                )}
              </>
            ) : (
              <>
                {server.url && (
                  <p className="text-muted-foreground text-xs mt-1">
                    URL: {server.url}
                  </p>
                )}
                {server.headers && Object.keys(server.headers).length > 0 && (
                  <p className="text-muted-foreground text-xs mt-1">
                    Headers: {Object.keys(server.headers).length}
                  </p>
                )}
              </>
            )}

            {server.timeout && (
              <p className="text-muted-foreground text-xs mt-1">
                Timeout: {server.timeout}ms
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="w-full"
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Removing..." : "Remove Connection"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Server Connection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove the connection to{" "}
                <strong>{server.name}</strong>? This action cannot be undone,
                and the server would have to be added again to reconnect.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveServer}>
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
