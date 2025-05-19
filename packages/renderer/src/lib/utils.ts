import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useState, useEffect } from "react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useServerPort() {
  const [serverPort, setServerPort] = useState<number | null>(null);

  useEffect(() => {
    window.httpServer
      .getServerPort()
      .then((port) => {
        setServerPort(port);
      })
      .catch((err) => {
        console.error(`Failed to get HTTP server port: ${err.message}`);
      });
  }, []);

  return serverPort;
}
