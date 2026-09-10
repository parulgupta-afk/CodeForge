import { io, Socket } from "socket.io-client";

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

let socket: Socket | null = null;
let connectionState: ConnectionState = "disconnected";
const stateListeners = new Set<(s: ConnectionState) => void>();

function setState(s: ConnectionState) {
  connectionState = s;
  stateListeners.forEach((fn) => fn(s));
}

export function getConnectionState(): ConnectionState {
  return connectionState;
}

export function onConnectionState(fn: (s: ConnectionState) => void): () => void {
  stateListeners.add(fn);
  fn(connectionState);
  return () => stateListeners.delete(fn);
}

export function getSocket(): Socket {
  if (!socket) {
    const url = import.meta.env.VITE_WS_URL || "http://localhost:3001";
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 8000,
    });

    socket.on("connect", () => setState("connected"));
    socket.on("disconnect", () => setState("disconnected"));
    socket.on("reconnect_attempt", () => setState("reconnecting"));
    socket.on("reconnect", () => setState("connected"));
    socket.on("connect_error", () => setState("disconnected"));
  }
  return socket;
}

export function joinRun(runId: string) {
  getSocket().emit("join:run", runId);
}
