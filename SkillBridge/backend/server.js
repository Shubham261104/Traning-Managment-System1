// Load environment variables FIRST
require('dotenv').config();

// Verify critical environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET is not set in environment variables!');
  console.error('Please create a .env file in the backend directory with JWT_SECRET');
  console.error('Example: JWT_SECRET=your_secret_key_here');
  process.exit(1);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Real-Time Socket Rooms & Active Sessions State
const roomStateMap = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Join Whiteboard Room
  socket.on('join-room', ({ roomId, user }) => {
    if (!roomId) return;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.userData = user || { id: socket.id, name: 'Anonymous User', role: 'student' };

    if (!roomStateMap.has(roomId)) {
      roomStateMap.set(roomId, {
        participants: new Map(),
        timer: { active: false, seconds: 0 },
        activePageIndex: 0,
        stickyNotes: [],
        sessionActive: false
      });
    }

    const room = roomStateMap.get(roomId);
    room.participants.set(socket.id, {
      socketId: socket.id,
      ...socket.userData,
      joinedAt: new Date(),
      handRaised: false,
      isMuted: false
    });

    const activeParticipantsList = Array.from(room.participants.values());

    // Broadcast updated roster & room state
    io.to(roomId).emit('room-state', {
      participants: activeParticipantsList,
      timer: room.timer,
      activePageIndex: room.activePageIndex,
      sessionActive: room.sessionActive
    });

    io.to(roomId).emit('user-joined', {
      user: socket.userData,
      participants: activeParticipantsList
    });
  });

  // Canvas Drawing Update
  socket.on('whiteboard-draw', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('whiteboard-draw', data);
    }
  });

  // Clear Canvas
  socket.on('whiteboard-clear', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('whiteboard-clear', data);
    }
  });

  // Page Operations
  socket.on('whiteboard-page-change', (data) => {
    if (socket.roomId) {
      const room = roomStateMap.get(socket.roomId);
      if (room) room.activePageIndex = data.activePageIndex;
      socket.to(socket.roomId).emit('whiteboard-page-change', data);
    }
  });

  socket.on('whiteboard-page-update', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('whiteboard-page-update', data);
    }
  });

  // Sticky Notes Operations
  socket.on('whiteboard-sticky-update', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('whiteboard-sticky-update', data);
    }
  });

  // Real-Time Cursors & Laser Pointer
  socket.on('cursor-move', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('cursor-move', {
        socketId: socket.id,
        user: socket.userData,
        ...data
      });
    }
  });

  socket.on('laser-move', (data) => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('laser-move', data);
    }
  });

  // Session Control Events
  socket.on('session-status-change', (data) => {
    if (socket.roomId) {
      const room = roomStateMap.get(socket.roomId);
      if (room) room.sessionActive = data.sessionActive;
      io.to(socket.roomId).emit('session-status-change', data);
    }
  });

  socket.on('timer-update', (data) => {
    if (socket.roomId) {
      const room = roomStateMap.get(socket.roomId);
      if (room) room.timer = data;
      socket.to(socket.roomId).emit('timer-update', data);
    }
  });

  // Chat & Reactions
  socket.on('chat-message', (data) => {
    if (socket.roomId) {
      io.to(socket.roomId).emit('chat-message', data);
    }
  });

  socket.on('reaction', (data) => {
    if (socket.roomId) {
      io.to(socket.roomId).emit('reaction', data);
    }
  });

  socket.on('hand-raise', (data) => {
    if (socket.roomId) {
      const room = roomStateMap.get(socket.roomId);
      if (room && room.participants.has(socket.id)) {
        const p = room.participants.get(socket.id);
        p.handRaised = data.isRaised;
      }
      io.to(socket.roomId).emit('hand-raise', {
        socketId: socket.id,
        user: socket.userData,
        ...data
      });
    }
  });

  // Disconnect Handler
  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
    if (socket.roomId && roomStateMap.has(socket.roomId)) {
      const room = roomStateMap.get(socket.roomId);
      room.participants.delete(socket.id);
      const remainingList = Array.from(room.participants.values());
      io.to(socket.roomId).emit('user-left', {
        socketId: socket.id,
        user: socket.userData,
        participants: remainingList
      });
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/instructor', require('./routes/instructor'));
app.use('/api/student', require('./routes/student'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/certificates', require('./routes/certificates'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/support', require('./routes/support'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/team', require('./routes/team'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/mentorship', require('./routes/mentorship'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware (before 404)
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle multer errors
  if (err instanceof require('multer').MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 500MB.' });
    }
    return res.status(400).json({ message: err.message });
  }

  res.status(err.status || 500).json({
    message: err.message || 'Server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : 'An error occurred'
  });
});

// 404 handler (must be last)
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/training_center';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Please make sure MongoDB is running and MONGODB_URI is correct');
    process.exit(1);
  }
};

connectDB();

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✓ Set' : '✗ Missing'}`);
  console.log(`MongoDB URI: ${process.env.MONGODB_URI || 'Using default'}`);
});

module.exports = app;

