const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

function initializeWebRTCServer(server) {
  const io = require('socket.io')(server, {
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

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
}

module.exports = { router, initializeWebRTCServer };