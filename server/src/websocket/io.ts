import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { AgentEvent } from "./events";

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on("join:run", (runId: string) => {
      socket.join(`run:${runId}`);
      console.log(`   joined room run:${runId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitAgentEvent(event: AgentEvent) {
  if (!io) return;
  io.to(`run:${event.runId}`).emit("agent:event", event);
  // Also broadcast globally so clients that haven't joined yet can still see it
  io.emit("agent:event", event);
}
