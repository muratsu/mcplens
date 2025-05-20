"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  PlusCircle,
  Server,
  Zap,
  Wrench,
  MessageSquare,
  Settings,
  ChevronRight,
  ChevronLeft,
  Cog,
  Bot,
} from "lucide-react";
import { useServerContext } from "@/context/ServerContext";

interface SidebarProps {
  selectedServer: string | null;
  setSelectedServer: (server: string | null) => void;
  onCreateConnection: () => void;
  selectedAction: string | null;
  setSelectedAction: (action: string | null) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export function Sidebar({
  selectedServer,
  setSelectedServer,
  onCreateConnection,
  selectedAction,
  setSelectedAction,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  // Get server connections from context
  const { servers, isLoading } = useServerContext();

  // Update selectedServer if it no longer exists in the servers list
  useEffect(() => {
    if (!isLoading && selectedServer) {
      const serverExists = servers.some(
        (server) => server.id === selectedServer
      );
      if (!serverExists) {
        setSelectedServer(null);
      }
    }
  }, [servers, selectedServer, setSelectedServer, isLoading]);

  // Get the selected server object
  const selectedServerObj = selectedServer
    ? servers.find((server) => server.id === selectedServer)
    : null;

  // Only enable non-configuration actions if the server is connected
  const isActionDisabled = () => {
    if (!selectedServer) {
      return true;
    } else {
      return false;
    }
    // if (actionId === "configuration") return false // Configuration is always enabled
    // return !selectedServerObj?.isConnected
  };

  const actions = [
    { id: "ping", name: "Ping", icon: <Zap className="h-4 w-4" /> },
    { id: "tools", name: "Tools", icon: <Wrench className="h-4 w-4" /> },
    { id: "chat", name: "Chat", icon: <MessageSquare className="h-4 w-4" /> },
    { id: "exec", name: "Exec", icon: <Bot className="h-4 w-4" /> },
    {
      id: "configuration",
      name: "Configuration",
      icon: <Cog className="h-4 w-4" />,
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-16 border-r border-border flex flex-col bg-white dark:bg-zinc-950">
        <div className="p-2 flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <div className="p-2 flex justify-center">
          <Button variant="ghost" size="icon" onClick={onCreateConnection}>
            <PlusCircle className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        <ScrollArea className="flex-1">
          <div className="p-2 flex flex-col items-center gap-2">
            {servers.map((server) => (
              <Button
                key={server.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-md",
                  selectedServer === server.id && "bg-accent"
                )}
                onClick={() => setSelectedServer(server.id)}
                title={server.name}
              >
                <Server className="h-5 w-5" />
              </Button>
            ))}
          </div>

          <Separator className="my-2" />

          <div className="p-2 flex flex-col items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                size="icon"
                className={cn(
                  "h-10 w-10 rounded-md",
                  selectedAction === action.id && "bg-accent",
                  isActionDisabled() && "opacity-50"
                )}
                onClick={() => setSelectedAction(action.id)}
                disabled={isActionDisabled()}
                title={action.name}
              >
                {action.icon}
                {action.id !== "configuration" &&
                  selectedServerObj?.isConnected &&
                  action.id === selectedAction && (
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-green-500"></span>
                  )}
              </Button>
            ))}
          </div>
        </ScrollArea>

        <div className="p-2 border-t border-border mt-auto flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setSelectedAction("settings")}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-border flex flex-col bg-white dark:bg-zinc-950">
      <div className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">🔎 MCP Lens</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsCollapsed(true)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 pb-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onCreateConnection}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Connection
        </Button>
      </div>

      <Separator />

      <div className="flex-1 overflow-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            Servers
          </h3>
          <ScrollArea className="h-[200px]">
            {isLoading ? (
              <div className="text-sm text-muted-foreground py-2 px-4">
                Loading servers...
              </div>
            ) : servers.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2 px-4">
                No connections added
              </div>
            ) : (
              servers.map((server) => (
                <Button
                  key={server.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start mb-1 text-left font-normal",
                    selectedServer === server.id && "bg-accent"
                  )}
                  onClick={() => setSelectedServer(server.id)}
                >
                  <div className="relative">
                    <Server className="h-4 w-4 mr-2" />
                    {server.isConnected && (
                      <span className="absolute bottom-0 right-1 h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    )}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-sm">{server.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {server.transportType}
                    </span>
                  </div>
                </Button>
              ))
            )}
          </ScrollArea>
        </div>

        <Separator />

        <div className="p-4">
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">
            ACTIONS
          </h3>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={cn(
                "w-full justify-start mb-1",
                selectedAction === action.id && "bg-accent",
                isActionDisabled() && "opacity-50"
              )}
              onClick={() => setSelectedAction(action.id)}
              disabled={isActionDisabled()}
            >
              <div className="mr-2 relative">
                {action.icon}
                {action.id !== "configuration" &&
                  selectedServerObj?.isConnected &&
                  action.id === selectedAction && (
                    <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-green-500"></span>
                  )}
              </div>
              {action.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => setSelectedAction("settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}
