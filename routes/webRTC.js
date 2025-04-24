const express = require('express');
const router = express.Router();
const { Server } = require('socket.io');
const admin = require('firebase-admin');

let io;

function initializeWebRTCServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle WebRTC signaling messages
    socket.on('offer', (data) => {
      console.log('Offer received:', data);
      socket.to(data.room).emit('offer', data);
    });

    socket.on('answer', (data) => {
      console.log('Answer received:', data);
      socket.to(data.room).emit('answer', data);
    });

    socket.on('candidate', (data) => {
      console.log('Candidate received:', data);
      socket.to(data.room).emit('candidate', data);
    });

    // Handle joining a room
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room: ${roomId}`);
    });

    // Handle leaving a room
    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.id} left room: ${roomId}`);
    });

    // Handle call initiation and send FCM notification
    socket.on('call-initiation', async (data) => {
      const { recipientDeviceToken, room, callerName } = data;
      if (!recipientDeviceToken) {
        console.error('Recipient device token is missing.');
        return;
      }

      const message = {
        notification: {
          title: 'Incoming Call',
          body: `${callerName} is calling you.`,
        },
        data: {
          type: 'call-invitation',
          room,
          callerName,
        },
        token: recipientDeviceToken,
      };

      try {
        await admin.messaging().send(message);
        console.log('FCM notification sent successfully.');
      } catch (error) {
        console.error('Error sending FCM notification:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
}

module.exports = { router, initializeWebRTCServer };