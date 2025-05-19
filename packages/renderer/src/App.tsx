"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { HistoryPanel } from "@/components/history-panel"
import { CreateConnectionDialog } from "@/components/create-connection-dialog"
import { ServerProvider } from "@/context/ServerContext"
import type { HistoryEntry } from "@/types/server"

export default function Home() {
  const [showConnectionDialog, setShowConnectionDialog] = useState(false)
  const [selectedServer, setSelectedServer] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>("ping")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true)
  
  // Load panel states from store on initial render
  useEffect(() => {
    async function loadPanelStates() {
      try {
        const panelState = await window.getPanelState()
        setIsSidebarCollapsed(panelState.isSidebarCollapsed)
        setIsHistoryPanelOpen(panelState.isHistoryPanelOpen)
      } catch (error) {
        console.error('Failed to load panel states:', error)
        // Fall back to defaults if there's an error
        setIsSidebarCollapsed(false)
        setIsHistoryPanelOpen(true)
      }
    }
    loadPanelStates()
  }, [])

  // Listen for navigation events
  useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      if (event.detail?.action) {
        setSelectedAction(event.detail.action);
      }
    };

    window.addEventListener('navigate-to-action', handleNavigate as EventListener);

    return () => {
      window.removeEventListener('navigate-to-action', handleNavigate as EventListener);
    };
  }, [])

  const addToHistory = (entry: HistoryEntry) => {
    setHistory((prev) => [entry, ...prev])
  }
  
  // Custom setters that also save the state
  const handleSidebarCollapsedChange = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed)
    window.savePanelState({ isSidebarCollapsed: collapsed }).catch(error => {
      console.error('Failed to save sidebar state:', error)
    })
  }
  
  const handleHistoryPanelOpenChange = (open: boolean) => {
    setIsHistoryPanelOpen(open)
    window.savePanelState({ isHistoryPanelOpen: open }).catch(error => {
      console.error('Failed to save history panel state:', error)
    })
  }

  // Wrapper for setting the selected server that also resets the action to "ping"
  const handleServerChange = (serverId: string | null) => {
    setSelectedServer(serverId)

    // If the server is actually changing (not just being set to the same value),
    // and a server is being selected (not deselected), set action to ping
    if (serverId !== selectedServer && serverId !== null) {
      setSelectedAction("ping")
    }
  }

  // Handle new server added
  const handleServerAdded = (newServerId: string) => {
    // Set the newly added server as the selected server using our new handler
    handleServerChange(newServerId)
  }

  return (
    <ServerProvider
      onServerAdded={(server) => handleServerAdded(server.id)}
    >
      <div className="flex h-screen bg-zinc-50 dark:bg-zinc-900">
        <Sidebar
          selectedServer={selectedServer}
          setSelectedServer={handleServerChange}
          onCreateConnection={() => setShowConnectionDialog(true)}
          selectedAction={selectedAction}
          setSelectedAction={setSelectedAction}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={handleSidebarCollapsedChange}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <MainContent selectedServer={selectedServer} selectedAction={selectedAction} addToHistory={addToHistory} />
        </div>

        <HistoryPanel history={history} isOpen={isHistoryPanelOpen} setIsOpen={handleHistoryPanelOpenChange} />

        <CreateConnectionDialog
          open={showConnectionDialog}
          onOpenChange={setShowConnectionDialog}
          onServerAdded={handleServerAdded}
        />
      </div>
    </ServerProvider>
  )
}
