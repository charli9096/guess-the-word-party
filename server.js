const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 8;
const MAX_ROUNDS = 6;
const ROUND_DURATION_MS = 30000;

const ROUND_TYPES = [
  { type: 'clue', label: 'Clue Guess' },
  { type: 'category', label: 'Category Guess' },
  { type: 'emoji', label: 'Emoji Clue' },
  { type: 'scramble', label: 'Word Scramble' },
  { type: 'fast', label: 'Fast Guess' }
];

const WORD_BANK = {
  clue: [
    { prompt: 'It keeps your drinks cold and your food fresh.', answer: 'fridge' },
    { prompt: 'It flies through the sky, has wings, and sings at sunrise.', answer: 'bird' },
    { prompt: 'You can read it, write in it, and carry it everywhere.', answer: 'notebook' },
    { prompt: 'It is full of water but never gets wet.', answer: 'spoon' },
    { prompt: 'It glows in the dark and is often found in a bedroom.', answer: 'lamp' }
  ],
  category: [
    { prompt: 'Category: Famous movie titles with a spell in the name.', answer: 'harry potter' },
    { prompt: 'Category: Fruit that can be red or green and is often made into pie.', answer: 'apple' },
    { prompt: 'Category: Things that go on your feet.', answer: 'shoes' },
    { prompt: 'Category: Holiday that includes fireworks.', answer: 'new year' },
    { prompt: 'Category: Ocean animals that can be big and friendly.', answer: 'dolphin' }
  ],
  emoji: [
    { prompt: '🌙✨🌌', answer: 'night sky' },
    { prompt: '🍕🍕🍕', answer: 'pizza' },
    { prompt: '☀️🏖️🌊', answer: 'beach day' },
    { prompt: '📚🧠💡', answer: 'study time' },
    { prompt: '🚀🌍', answer: 'space travel' }
  ],
  scramble: [
    { prompt: 'Unscramble: A R C O M', answer: 'macro' },
    { prompt: 'Unscramble: R O E N D S', answer: 'sonder' },
    { prompt: 'Unscramble: C E N I T P', answer: 'picnic' },
    { prompt: 'Unscramble: I N E A W T R', answer: 'airplane' },
    { prompt: 'Unscramble: O D W O N', answer: 'window' }
  ],
  fast: [
    { prompt: 'A place where people go to learn.', answer: 'school' },
    { prompt: 'A machine that helps you travel on roads.', answer: 'car' },
    { prompt: 'The opposite of hot.', answer: 'cold' },
    { prompt: 'A place full of books and shelves.', answer: 'library' },
    { prompt: 'A giant body of salt water.', answer: 'ocean' }
  ]
};

const rooms = new Map();

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  do {
    code = '';
    for (let i = 0; i < 5; i += 1) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
  } while (rooms.has(code));

  return code;
}

function normalizeAnswer(value = '') {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function getRoomState(room) {
  return {
    code: room.code,
    status: room.status,
    roundNumber: room.roundNumber,
    totalRounds: MAX_ROUNDS,
    players: Array.from(room.players.values()).map((player) => ({
      id: player.id,
      name: player.name,
      score: player.score,
      streak: player.streak,
      host: player.host
    })),
    phase: room.phase,
    round: room.round ? {
      type: room.round.type,
      label: room.round.label,
      prompt: room.round.prompt,
      answer: room.round.answer,
      endsAt: room.round.endsAt,
      winner: room.round.winner ? {
        id: room.round.winner.id,
        name: room.round.winner.name
      } : null,
      summary: room.round.summary || null
    } : null,
    winner: room.winner ? { id: room.winner.id, name: room.winner.name, score: room.winner.score } : null
  };
}

function createPlayer(id, name, host = false) {
  return {
    id,
    name,
    score: 0,
    streak: 0,
    host,
    connected: true
  };
}

function getRandomPrompt(type) {
  const candidates = WORD_BANK[type] || WORD_BANK.clue;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function clearRoomTimer(room) {
  if (room.timer) {
    clearTimeout(room.timer);
    room.timer = null;
  }
}

function awardPoints(player, elapsedMs) {
  const basePoints = 100;
  const speedBonus = Math.max(0, Math.round((ROUND_DURATION_MS - elapsedMs) / 250));
  const streakBonus = player.streak * 15;
  const total = basePoints + speedBonus + streakBonus;
  player.score += total;
  player.streak += 1;
  return total;
}

function resetPlayerStreaks(room) {
  room.players.forEach((player) => {
    player.streak = 0;
  });
}

function finishGame(room) {
  clearRoomTimer(room);
  room.status = 'finished';
  room.phase = 'finished';

  const rankedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
  room.winner = rankedPlayers[0];

  io.to(room.code).emit('gameFinished', {
    winner: room.winner ? { id: room.winner.id, name: room.winner.name, score: room.winner.score } : null,
    rankings: rankedPlayers.map((player) => ({ id: player.id, name: player.name, score: player.score }))
  });

  io.to(room.code).emit('roomState', getRoomState(room));
}

function advanceRound(room) {
  clearRoomTimer(room);

  if (room.roundNumber >= MAX_ROUNDS) {
    finishGame(room);
    return;
  }

  const roundIndex = room.roundNumber;
  const roundDef = ROUND_TYPES[roundIndex % ROUND_TYPES.length];
  const prompt = getRandomPrompt(roundDef.type);

  room.phase = 'playing';
  room.roundNumber += 1;
  room.round = {
    type: roundDef.type,
    label: roundDef.label,
    prompt: prompt.prompt,
    answer: prompt.answer,
    startsAt: Date.now(),
    endsAt: Date.now() + ROUND_DURATION_MS,
    winner: null,
    summary: null
  };

  io.to(room.code).emit('roundStarted', {
    roundNumber: room.roundNumber,
    totalRounds: MAX_ROUNDS,
    type: room.round.type,
    label: room.round.label,
    prompt: room.round.prompt,
    endsAt: room.round.endsAt,
    timeLimit: ROUND_DURATION_MS
  });

  io.to(room.code).emit('roomState', getRoomState(room));

  room.timer = setTimeout(() => {
    const round = room.round;
    if (!round) return;

    const summary = {
      correct: false,
      answer: round.answer,
      winner: null,
      roundNumber: room.roundNumber,
      label: round.label
    };

    room.round.summary = summary;
    io.to(room.code).emit('roundEnded', summary);

    setTimeout(() => {
      const roomState = rooms.get(room.code);
      if (!roomState) return;
      if (roomState.status !== 'finished') {
        advanceRound(roomState);
      }
    }, 1800);
  }, ROUND_DURATION_MS);
}

function beginGame(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  if (room.players.size < 2) {
    io.to(roomCode).emit('errorMessage', 'At least 2 players are required to start the game.');
    return;
  }

  room.status = 'playing';
  room.phase = 'playing';
  room.roundNumber = 0;
  room.round = null;
  room.winner = null;
  room.players.forEach((player) => {
    player.score = 0;
    player.streak = 0;
  });

  advanceRound(room);
}

function removePlayerFromRoom(socketId) {
  for (const room of rooms.values()) {
    const player = [...room.players.values()].find((entry) => entry.id === socketId);
    if (!player) continue;

    room.players.delete(socketId);

    if (room.players.size === 0) {
      rooms.delete(room.code);
      return;
    }

    const remainingPlayers = Array.from(room.players.values());
    if (player.host && remainingPlayers.length > 0) {
      remainingPlayers[0].host = true;
    }

    if (room.status === 'playing' && room.players.size < 2) {
      clearRoomTimer(room);
      room.status = 'lobby';
      room.phase = 'lobby';
      room.round = null;
      io.to(room.code).emit('errorMessage', 'Not enough players. The game has returned to the lobby.');
    }

    io.to(room.code).emit('roomState', getRoomState(room));
    return;
  }
}

io.on('connection', (socket) => {
  socket.on('createRoom', ({ name }) => {
    const safeName = (name || 'Player').trim().slice(0, 18) || 'Player';
    const code = generateRoomCode();
    const room = {
      code,
      status: 'lobby',
      phase: 'lobby',
      roundNumber: 0,
      players: new Map(),
      timer: null,
      round: null,
      winner: null
    };

    const player = createPlayer(socket.id, safeName, true);
    room.players.set(socket.id, player);
    rooms.set(code, room);

    socket.join(code);
    socket.data.roomCode = code;
    socket.data.playerName = safeName;

    io.to(code).emit('roomState', getRoomState(room));
    socket.emit('joinedRoom', { roomCode: code, isHost: true, playerId: socket.id });
  });

  socket.on('joinRoom', ({ code, name }) => {
    const roomCode = String(code || '').toUpperCase();
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('errorMessage', 'Room not found.');
      return;
    }

    if (room.players.size >= MAX_PLAYERS) {
      socket.emit('errorMessage', 'This room is full.');
      return;
    }

    const safeName = (name || 'Player').trim().slice(0, 18) || 'Player';
    const player = createPlayer(socket.id, safeName, false);
    room.players.set(socket.id, player);

    socket.join(roomCode);
    socket.data.roomCode = roomCode;
    socket.data.playerName = safeName;

    io.to(roomCode).emit('roomState', getRoomState(room));
    socket.emit('joinedRoom', { roomCode, isHost: false, playerId: socket.id });
  });

  socket.on('startGame', () => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (!player || !player.host) {
      socket.emit('errorMessage', 'Only the room host can start the game.');
      return;
    }

    beginGame(roomCode);
  });

  socket.on('submitGuess', ({ guess }) => {
    const roomCode = socket.data.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || !room.round) return;

    const player = room.players.get(socket.id);
    if (!player) return;

    if (room.round.winner) return;

    const normalizedGuess = normalizeAnswer(String(guess || ''));
    const normalizedAnswer = normalizeAnswer(String(room.round.answer || ''));
    if (!normalizedGuess) return;

    if (normalizedGuess === normalizedAnswer) {
      const elapsed = Date.now() - room.round.startsAt;
      const pointsEarned = awardPoints(player, elapsed);
      room.round.winner = { id: player.id, name: player.name, score: pointsEarned };
      room.round.summary = {
        correct: true,
        answer: room.round.answer,
        winner: { id: player.id, name: player.name },
        points: pointsEarned,
        roundNumber: room.roundNumber,
        label: room.round.label
      };

      clearRoomTimer(room);
      io.to(roomCode).emit('roundEnded', room.round.summary);

      setTimeout(() => {
        const currentRoom = rooms.get(roomCode);
        if (!currentRoom) return;
        if (currentRoom.status !== 'finished') {
          advanceRound(currentRoom);
        }
      }, 1800);
    } else {
      player.streak = 0;
    }
  });

  socket.on('disconnect', () => {
    removePlayerFromRoom(socket.id);
  });
});

app.use(express.static(path.join(__dirname, 'public')));

server.listen(PORT, () => {
  console.log(`Guess the Word Party is running on port ${PORT}`);
});
