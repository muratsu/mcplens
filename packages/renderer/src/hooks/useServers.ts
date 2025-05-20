import { useState, useEffect, useCallback } from 'react';

// These types need to match what's exposed in the preload script
interface ServerConfig {
  id: string;
  name: string;
  url: string;
}

const { getAllServers, getServerById, addServer, updateServer, deleteServer } = window;

export function useServers() {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all servers
  const fetchServers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllServers();
      setServers(data);
    } catch (err) {
      setError('Failed to load servers');
      console.error('Error fetching servers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get a server by ID
  const fetchServerById = useCallback(async (id: string) => {
    try {
      return await getServerById(id);
    } catch (err) {
      console.error(`Error fetching server with ID ${id}:`, err);
      throw err;
    }
  }, []);

  // Create a new server
  const createServer = useCallback(async (serverData: Omit<ServerConfig, 'id'>) => {
    try {
      const newServer = await addServer(serverData);
      setServers(prev => [...prev, newServer]);
      return newServer;
    } catch (err) {
      console.error('Error creating server:', err);
      throw err;
    }
  }, []);

  // Update a server
  const updateServerData = useCallback(async (serverData: ServerConfig) => {
    try {
      const updated = await updateServer(serverData);
      setServers(prev => prev.map(server =>
        server.id === updated.id ? updated : server
      ));
      return updated;
    } catch (err) {
      console.error('Error updating server:', err);
      throw err;
    }
  }, []);

  // Delete a server
  const removeServer = useCallback(async (id: string) => {
    try {
      await deleteServer(id);
      setServers(prev => prev.filter(server => server.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting server:', err);
      throw err;
    }
  }, []);

  // Load servers on initial mount
  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return {
    servers,
    isLoading,
    error,
    fetchServers,
    fetchServerById,
    createServer,
    updateServerData,
    removeServer
  };
}