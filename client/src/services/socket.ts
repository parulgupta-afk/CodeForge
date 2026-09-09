import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = ((import.meta as any).env?.VITE_WS_URL as string) || "http://localhost:3001";
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
