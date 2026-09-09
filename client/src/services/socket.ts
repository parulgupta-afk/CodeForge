import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In dev, Vite proxies /api but WebSocket needs the backend origin
    const url = import.meta.env.VITE_WS_URL || "http://localhost:3001";
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function joinRun(runId: string) {
  getSocket().emit("join:run", runId);
}
