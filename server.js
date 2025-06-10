const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

let waitingPlayer = null;

io.on('connection', (socket) => {
  socket.on('joinGame', () => {
    if (waitingPlayer) {
      const room = `room-${waitingPlayer.id}-${socket.id}`;
      socket.join(room);
      waitingPlayer.join(room);

      socket.emit('gameStart', { symbol: 'O' });
      waitingPlayer.emit('gameStart', { symbol: 'X' });

      socket.data.room = room;
      waitingPlayer.data.room = room;
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting');
    }
  });

  socket.on('makeMove', (index) => {
    if (socket.data.room) {
      socket.to(socket.data.room).emit('opponentMove', index);
    }
  });

  socket.on('disconnect', () => {
    if (waitingPlayer === socket) {
      waitingPlayer = null;
    }
    if (socket.data.room) {
      socket.to(socket.data.room).emit('opponentLeft');
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
