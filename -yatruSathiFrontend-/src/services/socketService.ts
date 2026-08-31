/**
 * YatruSathi Real-time Group Chat Service
 * Manages Socket.IO connection to the Flask AI chatbot server.
 * Exposes join/leave/send helpers and a typed event listener API.
 */
import { io, Socket } from 'socket.io-client';
import type { EventContext } from './api/chat';

const CHATBOT_URL = import.meta.env.VITE_CHATBOT_URL || 'http://localhost:5000';

export interface ChatMessage {
  sender: string;
  text: string;
  type: 'user' | 'ai' | 'system';
  timestamp: string;
}

export interface SystemMessage {
  text: string;
  type: 'join' | 'leave' | 'info';
}

export interface AiReply {
  question: string;
  answer: string;
  timestamp: string;
}

type MessageHandler = (msg: ChatMessage) => void;
type SystemHandler = (msg: SystemMessage) => void;
type AiReplyHandler = (reply: AiReply) => void;

class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  /** Connect to the Flask Socket.IO server. Call once on app start. */
  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(CHATBOT_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[SocketService] Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[SocketService] Disconnected');
    });

    this.socket.on('connect_error', err => {
      console.warn('[SocketService] Connection error:', err.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && !!this.socket?.connected;
  }

  // ── Room management ────────────────────────────────────────────────────────

  joinGroup(groupId: string | number, username: string): void {
    this.socket?.emit('join_group', { group_id: String(groupId), username });
  }

  leaveGroup(groupId: string | number, username: string): void {
    this.socket?.emit('leave_group', { group_id: String(groupId), username });
  }

  // ── Sending messages ───────────────────────────────────────────────────────

  sendGroupMessage(
    groupId: string | number,
    username: string,
    message: string,
    eventContext?: EventContext
  ): void {
    this.socket?.emit('group_message', {
      group_id: String(groupId),
      username,
      message,
      event_context: eventContext,
    });
  }

  /** Ask the AI directly; its answer is broadcast to the whole room. */
  askAI(groupId: string | number, question: string, eventContext?: EventContext): void {
    this.socket?.emit('ask_ai', {
      group_id: String(groupId),
      message: question,
      event_context: eventContext,
    });
  }

  // ── Event listeners ────────────────────────────────────────────────────────

  onMessage(handler: MessageHandler): () => void {
    this.socket?.on('new_message', handler);
    return () => this.socket?.off('new_message', handler);
  }

  onSystemMessage(handler: SystemHandler): () => void {
    this.socket?.on('system_message', handler);
    return () => this.socket?.off('system_message', handler);
  }

  onAiReply(handler: AiReplyHandler): () => void {
    this.socket?.on('ai_reply', handler);
    return () => this.socket?.off('ai_reply', handler);
  }
}

// Singleton — share one connection across the whole app
export const socketService = new SocketService();
