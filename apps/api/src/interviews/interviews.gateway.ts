import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class InterviewsGateway {
  @WebSocketServer()
  server: Server;

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
}
