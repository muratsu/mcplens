"use client"

import { PingAction } from "@/components/actions/ping-action"
import { ToolsAction } from "@/components/actions/tools-action"
import { ChatAction } from "@/components/actions/chat-action"
import { ConfigurationAction } from "@/components/actions/configuration-action"
import { ExecAction } from "@/components/actions/exec-action"
import { SettingsAction } from "@/components/actions/settings-action"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Server } from "lucide-react"
import { useServerContext } from "@/context/ServerContext"
import type { ServerDetails, HistoryEntry } from "@/types/server"

interface MainContentProps {
  selectedServer: string | null
  selectedAction: string | null
  addToHistory: (entry: HistoryEntry) => void
}

export function MainContent({ selectedServer, selectedAction, addToHistory }: MainContentProps) {
  const { isLoading, error: serversError, servers } = useServerContext()

  // Get the selected server details from the context
  const serverDetails = selectedServer ? servers.find(server => server.id === selectedServer) as ServerDetails | undefined : null

  // Show settings if that's the selected action, regardless of server selection
  if (selectedAction === "settings") {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">Configure application settings</p>
            </div>
          </div>
        </div>
        <SettingsAction />
      </div>
    )
  }
  
  // For all other actions, require a server
  if (!selectedServer) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">No Server Selected</h2>
          <p className="text-muted-foreground mb-4">
            Select a server connection from the sidebar or create a new one to get started.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>Loading server details...</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (serversError || !serverDetails) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Could not load server details. Please try again.</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Handle server removal in the configuration action
  const handleServerRemoved = () => {
    // Reset the selected server since it was removed
    // Navigate back to the server selection screen
    window.location.reload()
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Server className="h-6 w-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{serverDetails.name}</h1>
              <span className="text-muted-foreground">•</span>
              <p className="text-muted-foreground">{serverDetails.transportType}</p>
            </div>
            <div className="flex items-center">
              <p className="text-muted-foreground">{serverDetails.url}</p>
              {serverDetails.isConnected && (
                <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-green-500"></span>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedAction === "ping" && <PingAction server={serverDetails} addToHistory={addToHistory} />}

      {selectedAction === "tools" && <ToolsAction server={serverDetails} addToHistory={addToHistory} />}

      {selectedAction === "chat" && <ChatAction server={serverDetails} addToHistory={addToHistory} />}

      {selectedAction === "exec" && <ExecAction server={serverDetails} addToHistory={addToHistory} />}

      {selectedAction === "configuration" && (
        <ConfigurationAction
          server={serverDetails}
          addToHistory={addToHistory}
          onServerRemoved={handleServerRemoved}
        />
      )}
      

    </div>
  )
}
