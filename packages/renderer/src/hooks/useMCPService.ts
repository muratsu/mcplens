import { useState, useEffect, useCallback, useRef } from 'react';

// Type definitions to match the preload script
interface TransportConfig {
  transportType: 'stdio' | 'sse' | 'streamable-http';
  url?: string;
  command?: string;
  args?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
}

type MCPMessage = any;

interface UseMCPServiceReturn {
  createSession: (config: TransportConfig) => Promise<{ sessionId: string }>;
  sendMessage: (sessionId: string, message: MCPMessage) => Promise<any>;
  closeSession: (sessionId: string) => Promise<boolean>;
  getConfig: () => Promise<any>;
  messages: { sessionId: string; message: MCPMessage }[];
  clearMessages: () => void;
  isConnected: boolean;
  lastError: Error | null;
}

export function useMCPService(): UseMCPServiceReturn {
  // State to track active sessions and messages
  const [messages, setMessages] = useState<{ sessionId: string; message: MCPMessage }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);

  // Use a ref to store the cleanup function for the message listener
  const cleanupRef = useRef<(() => void) | null>(null);

  // Initialize the message listener
  useEffect(() => {
    // Set up the message listener
    const cleanup = window.onMCPMessage((data) => {
      setMessages(prev => [...prev, data]);
    });

    // Store the cleanup function
    cleanupRef.current = cleanup;

    // Clean up when component unmounts
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // Function to create a new session
  const createSession = useCallback(async (config: TransportConfig) => {
    try {
      setLastError(null);
      const result = await window.createMCPSession(config);
      setIsConnected(true);
      return result;
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, []);

  // Function to send a message to a session
  const sendMessage = useCallback(async (sessionId: string, message: MCPMessage) => {
    try {
      setLastError(null);
      return await window.sendMCPMessage(sessionId, message);
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, []);

  // Function to close a session
  const closeSession = useCallback(async (sessionId: string) => {
    try {
      setLastError(null);
      const result = await window.closeMCPSession(sessionId);
      if (result) {
        setIsConnected(false);
      }
      return result;
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, []);

  // Function to get configuration
  const getConfig = useCallback(async () => {
    try {
      setLastError(null);
      return await window.getMCPConfig();
    } catch (error) {
      setLastError(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }, []);

  // Function to clear the messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    createSession,
    sendMessage,
    closeSession,
    getConfig,
    messages,
    clearMessages,
    isConnected,
    lastError,
  };
}
