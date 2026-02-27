const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

let currentPoll = null;
let votes = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Send current poll status to newly connected clients
  if (currentPoll) {
    socket.emit('poll:update', { poll: currentPoll, votes });
  }

  // Host starts a new poll
  socket.on('host:start_poll', (pollData) => {
    currentPoll = pollData;
    votes = {};

    // Initialize vote counts
    if (pollData && pollData.options) {
      pollData.options.forEach(option => {
        votes[option.id] = 0;
      });
    }

    console.log('Host started a new poll:', currentPoll);

    // Broadcast the new poll to all connected clients
    io.emit('poll:update', { poll: currentPoll, votes });
  });

  // Host stops the current poll
  socket.on('host:stop_poll', () => {
    currentPoll = null;
    io.emit('poll:update', { poll: null, votes: {} });
    console.log('Host stopped the poll');
  });

  // Voter submits a vote
  socket.on('voter:vote', (optionId) => {
    if (currentPoll && votes[optionId] !== undefined) {
      votes[optionId] += 1;
      console.log(`Vote received for option ${optionId}. Current votes:`, votes);

      // Broadcast updated votes to all clients
      io.emit('poll:update', { poll: currentPoll, votes });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
