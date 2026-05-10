import { io } from 'socket.io-client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, '')

let socket = null
let currentToken = null

export const connectSocket = (token) => {
  if (!token) {
    return null
  }

  if (socket && currentToken === token && socket.connected) {
    return socket
  }

  if (socket) {
    socket.disconnect()
  }

  currentToken = token
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  })

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    currentToken = null
  }
}
