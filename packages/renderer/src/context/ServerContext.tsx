import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { ServerDetails } from '@/types/server';

// Types
type ServerAction =
  | { type: 'INIT_SERVERS'; payload: ServerDetails[] }
  | { type: 'ADD_SERVER'; payload: ServerDetails }
  | { type: 'UPDATE_SERVER'; payload: ServerDetails }
  | { type: 'REMOVE_SERVER'; payload: string }  // server id
  | { type: 'SET_SERVER_CONNECTED'; payload: { id: string, sessionId: string } }
  | { type: 'SET_SERVER_DISCONNECTED'; payload: string } // server id
  | { type: 'SET_SERVER_CONNECTION_ERROR'; payload: { id: string, error: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface ServerState {
  servers: ServerDetails[];
  isLoading: boolean;
  error: string | null;
}

interface ServerContextType extends ServerState {
  addServer: (server: Omit<ServerDetails, 'id'>) => Promise<ServerDetails>;
  updateServer: (server: ServerDetails) => Promise<ServerDetails>;
  removeServer: (id: string) => Promise<boolean>;
  getServerById: (id: string) => Promise<ServerDetails | undefined>;
  refreshServers: () => Promise<void>;
  connectServer: (id: string, sessionId: string) => void;
  disconnectServer: (id: string) => void;
  setServerConnectionError: (id: string, error: string) => void;
  onServerRemoved?: (id: string) => void;
  onServerAdded?: (server: ServerDetails) => void;
}

// Create the context
const ServerContext = createContext<ServerContextType | undefined>(undefined);

// Preload script API access
declare global {
  interface Window {
    getAllServers: () => Promise<ServerDetails[]>;
    getServerById: (id: string) => Promise<ServerDetails>;
    addServer: (server: Omit<ServerDetails, 'id'>) => Promise<ServerDetails>;
    updateServer: (server: ServerDetails) => Promise<ServerDetails>;
    deleteServer: (id: string) => Promise<boolean>;
  }
}

// Reducer function
function serverReducer(state: ServerState, action: ServerAction): ServerState {
  switch (action.type) {
    case 'INIT_SERVERS':
      return {
        ...state,
        servers: action.payload,
        isLoading: false,
      };
    case 'ADD_SERVER':
      return {
        ...state,
        servers: [...state.servers, action.payload],
      };
    case 'UPDATE_SERVER':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id ? action.payload : server
        ),
      };
    case 'REMOVE_SERVER':
      return {
        ...state,
        servers: state.servers.filter(server => server.id !== action.payload),
      };
    case 'SET_SERVER_CONNECTED':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? {
                ...server,
                isConnected: true,
                sessionId: action.payload.sessionId,
                lastConnectionError: undefined
              }
            : server
        ),
      };
    case 'SET_SERVER_DISCONNECTED':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload
            ? {
                ...server,
                isConnected: false,
                sessionId: undefined
              }
            : server
        ),
      };
    case 'SET_SERVER_CONNECTION_ERROR':
      return {
        ...state,
        servers: state.servers.map(server =>
          server.id === action.payload.id
            ? {
                ...server,
                isConnected: false,
                lastConnectionError: action.payload.error
              }
            : server
        ),
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface ServerProviderProps {
  children: ReactNode;
  onServerAdded?: (server: ServerDetails) => void;
  onServerRemoved?: (id: string) => void;
}

// Provider component
export function ServerProvider({ children, onServerAdded, onServerRemoved }: ServerProviderProps) {
  const [state, dispatch] = useReducer(serverReducer, {
    servers: [],
    isLoading: true,
    error: null,
  });

  // Load servers on initial mount
  useEffect(() => {
    refreshServers();
  }, []);

  // Function to refresh servers from storage
  async function refreshServers() {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const servers = await window.getAllServers();
      dispatch({ type: 'INIT_SERVERS', payload: servers });
    } catch (err) {
      console.error('Error fetching servers:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load servers' });
    }
  }

  // Function to mark a server as connected
  function connectServer(id: string, sessionId: string) {
    dispatch({
      type: 'SET_SERVER_CONNECTED',
      payload: { id, sessionId }
    });
  }

  // Function to mark a server as disconnected
  function disconnectServer(id: string) {
    dispatch({
      type: 'SET_SERVER_DISCONNECTED',
      payload: id
    });
  }

  // Function to set connection error for a server
  function setServerConnectionError(id: string, error: string) {
    dispatch({
      type: 'SET_SERVER_CONNECTION_ERROR',
      payload: { id, error }
    });
  }

  // Get a server by ID
  async function getServerById(id: string) {
    try {
      return await window.getServerById(id);
    } catch (err) {
      console.error(`Error fetching server with ID ${id}:`, err);
      throw err;
    }
  }

  // Add a new server
  async function addServer(serverData: Omit<ServerDetails, 'id'>) {
    try {
      const newServer = await window.addServer(serverData);
      dispatch({ type: 'ADD_SERVER', payload: newServer });

      // Call the onServerAdded callback if provided
      if (onServerAdded) {
        onServerAdded(newServer);
      }

      return newServer;
    } catch (err) {
      console.error('Error creating server:', err);
      throw err;
    }
  }

  // Update a server
  async function updateServer(serverData: ServerDetails) {
    try {
      const updated = await window.updateServer(serverData);
      dispatch({ type: 'UPDATE_SERVER', payload: updated });
      return updated;
    } catch (err) {
      console.error('Error updating server:', err);
      throw err;
    }
  }

  // Remove a server
  async function removeServer(id: string) {
    try {
      await window.deleteServer(id);
      dispatch({ type: 'REMOVE_SERVER', payload: id });

      // Call the onServerRemoved callback if provided
      if (onServerRemoved) {
        onServerRemoved(id);
      }

      return true;
    } catch (err) {
      console.error('Error deleting server:', err);
      throw err;
    }
  }

  const value = {
    ...state,
    addServer,
    updateServer,
    removeServer,
    getServerById,
    refreshServers,
    connectServer,
    disconnectServer,
    setServerConnectionError,
    onServerAdded,
    onServerRemoved,
  };

  return <ServerContext.Provider value={value}>{children}</ServerContext.Provider>;
}

// Custom hook to use the server context
export function useServerContext() {
  const context = useContext(ServerContext);
  if (context === undefined) {
    throw new Error('useServerContext must be used within a ServerProvider');
  }
  return context;
}
