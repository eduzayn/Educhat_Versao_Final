import { io } from 'socket.io-client';

const SOCKET_URL = process.env.NODE_ENV === 'production'
  ? window.location.origin
  : 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  autoConnect: true,
});

// Handlers globais
socket.on('connect', () => {
  console.log('✅ Socket.IO conectado');
});

socket.on('disconnect', (reason) => {
  console.log('❌ Socket.IO desconectado:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Erro de conexão Socket.IO:', error);
});

// Exportar socket tipado
export type Socket = typeof socket; 