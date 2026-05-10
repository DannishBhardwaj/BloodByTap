const jwt = require('jsonwebtoken');
const User = require('../models/User');

const donorSocketMap = new Map();

const addDonorSocket = (userId, socketId) => {
  const key = String(userId);
  const existing = donorSocketMap.get(key) || new Set();
  existing.add(socketId);
  donorSocketMap.set(key, existing);
};

const removeDonorSocket = (userId, socketId) => {
  const key = String(userId);
  const existing = donorSocketMap.get(key);
  if (!existing) return;

  existing.delete(socketId);
  if (existing.size === 0) {
    donorSocketMap.delete(key);
  }
};

const setupSocketServer = (io) => {
  io.use(async (socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const headerToken = socket.handshake.headers?.authorization?.replace('Bearer ', '');
      const token = authToken || headerToken;

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('_id role isActive');

      if (!user || !user.isActive) {
        return next(new Error('Unauthorized socket connection'));
      }

      socket.user = {
        id: user._id.toString(),
        role: user.role
      };

      return next();
    } catch (error) {
      return next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    socket.join(`user:${userId}`);

    if (socket.user.role === 'donor') {
      socket.join(`donor:${userId}`);
      addDonorSocket(userId, socket.id);
    }

    socket.on('disconnect', () => {
      if (socket.user?.role === 'donor') {
        removeDonorSocket(userId, socket.id);
      }
    });
  });
};

const emitBloodRequestAlert = (io, bloodRequest, nearbyDonors) => {
  if (!io || !bloodRequest || !Array.isArray(nearbyDonors)) {
    return { targeted: 0, deliveredToOnlineSockets: 0 };
  }

  let deliveredToOnlineSockets = 0;
  const payload = {
    entityType: bloodRequest.entityType || 'blood-request',
    requestId: bloodRequest._id,
    bloodType: bloodRequest.bloodType,
    quantity: bloodRequest.quantity,
    urgency: bloodRequest.urgency,
    radiusMeters: bloodRequest.radiusMeters,
    hospitalName: bloodRequest.hospitalName,
    location: bloodRequest.location,
    createdAt: bloodRequest.createdAt
  };

  nearbyDonors.forEach((donor) => {
    const donorUserId = donor.user?._id?.toString()
      || donor.user?.toString()
      || donor.userId?.toString()
      || donor._id?.toString();
    if (!donorUserId) {
      return;
    }

    const roomName = `donor:${donorUserId}`;
    const room = io.sockets.adapter.rooms.get(roomName);
    if (room && room.size > 0) {
      deliveredToOnlineSockets += room.size;
      io.to(roomName).emit('new-emergency-alert', {
        ...payload,
        donorDistance: donor.distance
      });
    }
  });

  return {
    targeted: nearbyDonors.length,
    deliveredToOnlineSockets
  };
};

module.exports = {
  setupSocketServer,
  emitBloodRequestAlert
};
