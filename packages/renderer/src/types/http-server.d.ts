export {};

declare global {
  interface Window {
    httpServer: {
      getServerPort: () => Promise<number>;
    };
  }
}