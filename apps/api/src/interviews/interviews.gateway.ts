import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import WebSocket from 'ws';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class InterviewsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private agentsWsConnections = new Map<string, WebSocket>();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);

    // Close any open agents WebSocket connections
    const sessionId = this.getSessionIdForClient(client.id);
    if (sessionId) {
      const ws = this.agentsWsConnections.get(sessionId);
      if (ws) {
        ws.close();
        this.agentsWsConnections.delete(sessionId);
      }
    }
  }

  @SubscribeMessage('join-session')
  handleJoinSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`session:${data.sessionId}`);
    return { event: 'joined', sessionId: data.sessionId };
  }

  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`session:${data.sessionId}`);
    return { event: 'left', sessionId: data.sessionId };
  }

  @SubscribeMessage('start-realtime-interview')
  async handleStartRealtimeInterview(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;

    console.log(`[Gateway] Starting realtime interview for session ${sessionId}`);

    try {
      // Connect to Python agents WebSocket endpoint (simple interview)
      const agentsUrl = process.env.AGENTS_API_URL || 'http://localhost:8000';
      const wsUrl = agentsUrl.replace('http', 'ws');
      console.log(`[Gateway] Connecting to Python WebSocket: ${wsUrl}/api/agents/simple-interview/${sessionId}`);
      const ws = new WebSocket(`${wsUrl}/api/agents/simple-interview/${sessionId}`);

      // Store the connection
      this.agentsWsConnections.set(sessionId, ws);
      console.log(`[Gateway] WebSocket connection stored for session ${sessionId}`);

      // Forward messages from agents to client
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          console.log(`[Gateway] Received message from Python: type=${data.type}, dataLength=${data.data?.length || 'N/A'}`);
          client.emit('realtime-message', data);
          console.log(`[Gateway] ✅ Forwarded message to client`);
        } catch (e) {
          console.error('Error parsing message from agents:', e);
        }
      });

      ws.on('error', (error) => {
        console.error(`[Gateway] WebSocket error for session ${sessionId}:`, error);
        client.emit('realtime-error', { message: error.message });
      });

      ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString();
        console.log(`[Gateway] Agents WebSocket closed for session ${sessionId}, code=${code}, reason=${reasonStr || 'none'}`);
        this.agentsWsConnections.delete(sessionId);
        client.emit('realtime-closed');
      });

      ws.on('open', () => {
        console.log(`[Gateway] ✅ WebSocket connection opened for session ${sessionId}`);
      });

      // Wait for connection to open
      await new Promise((resolve, reject) => {
        ws.once('open', resolve);
        ws.once('error', reject);
      });

      return { event: 'realtime-started', sessionId };
    } catch (error) {
      console.error('Error starting realtime interview:', error);
      return { event: 'error', message: error.message };
    }
  }

  private audioChunkCount = new Map<string, number>();

  @SubscribeMessage('realtime-audio')
  handleRealtimeAudio(
    @MessageBody() data: { sessionId: string; audio: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId, audio } = data;

    if (!audio) {
      console.warn(`[Gateway] Received empty audio for session ${sessionId}`);
      return;
    }

    console.log(`[Gateway] Received complete audio for session ${sessionId}, length: ${audio.length} bytes`);

    const ws = this.agentsWsConnections.get(sessionId);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'audio', data: audio }));
    } else {
      console.warn(`[Gateway] Cannot forward audio - WebSocket not ready for session ${sessionId}`);
    }
  }

  @SubscribeMessage('end-realtime-interview')
  handleEndRealtimeInterview(
    @MessageBody() data: { sessionId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { sessionId } = data;
    const ws = this.agentsWsConnections.get(sessionId);

    if (ws) {
      ws.send(JSON.stringify({ type: 'end' }));
      ws.close();
      this.agentsWsConnections.delete(sessionId);
    }

    return { event: 'realtime-ended', sessionId };
  }

  // Server-side methods to emit events
  emitQuestionUpdate(sessionId: string, question: any) {
    this.server.to(`session:${sessionId}`).emit('question-update', question);
  }

  emitAnswerReceived(sessionId: string, answer: any) {
    this.server.to(`session:${sessionId}`).emit('answer-received', answer);
  }

  emitSessionCompleted(sessionId: string) {
    this.server.to(`session:${sessionId}`).emit('session-completed');
  }

  emitAvatarVideoReady(sessionId: string, videoUrl: string) {
    this.server.to(`session:${sessionId}`).emit('avatar-video-ready', videoUrl);
  }

  private getSessionIdForClient(clientId: string): string | null {
    // This is a simplified implementation
    // In production, you'd want to track this mapping properly
    for (const [sessionId, ws] of this.agentsWsConnections.entries()) {
      // You might need to enhance this logic based on your needs
      return sessionId;
    }
    return null;
  }
}
