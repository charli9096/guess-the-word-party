const socket = io();

const state = {
  currentView: 'landing',
  roomCode: '',
  playerId: '',
  isHost: false,
  room: null,
  round: null,
  timer: null,
  lastMessage: ''
};

const elements = {
  landing: document.getElementById('landing'),
  lobby: document.getElementById('lobby'),
  game: document.getElementById('game'),
  endScreen: document.getElementById('end-screen'),
  createName: document.getElementById('create-name'),
  joinName: document.getElementById('join-name'),
  joinCode: document.getElementById('join-code'),
  roomCodeBadge: document.getElementById('room-code-badge'),
  playerList: document.getElementById('player-list'),
  scoreboard: document.getElementById('scoreboard'),
  finalScoreboard: document.getElementById('final-scoreboard'),
  startGameBtn: document.getElementById('start-game-btn'),
  leaveRoomBtn: document.getElementById('leave-room-btn'),
  roundLabel: document.getElementById('round-label'),
  roundType: document.getElementById('round-type'),
  timerDisplay: document.getElementById('timer-display'),
  promptText: document.getElementById('prompt-text'),
  guessForm: document.getElementById('guess-form'),
  guessInput: document.getElementById('guess-input'),
  statusMessage: document.getElementById('status-message'),
  winnerTitle: document.getElementById('winner-title'),
  winnerName: document.getElementById('winner-name'),
  createRoomBtn: document.getElementById('create-room-btn'),
  joinRoomBtn: document.getElementById('join-room-btn'),
  playAgainBtn: document.getElementById('play-again-btn')
};

function renderView(view) {
  state.currentView = view;
  const views = [elements.landing, elements.lobby, elements.game, elements.endScreen];
  views.forEach((panel) => panel.classList.remove('active'));

  if (view === 'landing') elements.landing.classList.add('active');
  if (view === 'lobby') elements.lobby.classList.add('active');
  if (view === 'game') elements.game.classList.add('active');
  if (view === 'end') elements.endScreen.classList.add('active');
}

function updateTimer(deadlineMs) {
  clearInterval(state.timer);
  state.timer = setInterval(() => {
    const remainingMs = Math.max(0, deadlineMs - Date.now());
    const seconds = Math.ceil(remainingMs / 1000);
    elements.timerDisplay.textContent = `${Math.max(0, seconds)}s`;
    if (remainingMs <= 0) {
      clearInterval(state.timer);
    }
  }, 200);
}

function renderLobby(room) {
  state.room = room;
  elements.roomCodeBadge.textContent = `ROOM ${room.code}`;
  elements.playerList.innerHTML = '';

  room.players.forEach((player) => {
    const li = document.createElement('li');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = player.name;

    const meta = document.createElement('span');
    meta.className = 'tag';
    meta.textContent = player.host ? 'Host' : 'Player';
    li.append(nameSpan, meta);
    elements.playerList.appendChild(li);
  });

  elements.startGameBtn.style.display = state.isHost ? 'inline-block' : 'none';
}

function renderGame(room) {
  state.room = room;

  if (!room.round) {
    return;
  }

  state.round = room.round;
  elements.roundLabel.textContent = `Round ${room.roundNumber || 1}`;
  elements.roundType.textContent = room.round.label;
  elements.promptText.textContent = room.round.prompt;
  updateTimer(room.round.endsAt);

  if (room.round.summary) {
    elements.statusMessage.textContent = room.round.summary.correct
      ? `${room.round.summary.winner.name} guessed it! +${room.round.summary.points} points`
      : `No one guessed it. The answer was: ${room.round.summary.answer}`;
  } else {
    elements.statusMessage.textContent = 'Type your guess before time runs out!';
  }

  renderScoreboard(room.players);
}

function renderScoreboard(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  elements.scoreboard.innerHTML = '';

  sorted.forEach((player, index) => {
    const li = document.createElement('li');
    const nameWrap = document.createElement('span');
    nameWrap.className = 'name';
    nameWrap.textContent = `${index + 1}. ${player.name}`;

    const scoreWrap = document.createElement('span');
    scoreWrap.textContent = `${player.score} pts`;
    li.append(nameWrap, scoreWrap);
    elements.scoreboard.appendChild(li);
  });
}

function renderEndScreen(data) {
  const winner = data.winner || null;
  if (winner) {
    elements.winnerTitle.textContent = 'Winner!';
    elements.winnerName.textContent = `${winner.name} — ${winner.score} pts`;
  } else {
    elements.winnerTitle.textContent = 'Final Results';
    elements.winnerName.textContent = 'No winner';
  }

  elements.finalScoreboard.innerHTML = '';
  data.rankings.forEach((player, index) => {
    const li = document.createElement('li');
    const nameWrap = document.createElement('span');
    nameWrap.className = 'name';
    nameWrap.textContent = `${index + 1}. ${player.name}`;

    const scoreWrap = document.createElement('span');
    scoreWrap.textContent = `${player.score} pts`;
    li.append(nameWrap, scoreWrap);
    elements.finalScoreboard.appendChild(li);
  });
}

function setMessage(msg) {
  elements.statusMessage.textContent = msg;
}

socket.on('connected', () => {
  console.log('Connected to server');
});

socket.on('joinedRoom', ({ roomCode, isHost, playerId }) => {
  state.roomCode = roomCode;
  state.isHost = isHost;
  state.playerId = playerId;
  renderView('lobby');
  setMessage('Room joined. Waiting for players.');
});

socket.on('roomState', (room) => {
  if (room.status === 'lobby') {
    renderView('lobby');
    renderLobby(room);
    return;
  }

  if (room.status === 'playing') {
    renderView('game');
    renderGame(room);
    return;
  }

  if (room.status === 'finished') {
    renderView('game');
    renderGame(room);
  }
});

socket.on('roundStarted', (round) => {
  elements.statusMessage.textContent = 'New round started!';
  elements.guessInput.value = '';
  elements.guessInput.focus();
  elements.roundLabel.textContent = `Round ${round.roundNumber}`;
  elements.roundType.textContent = round.label;
  elements.promptText.textContent = round.prompt;
  updateTimer(round.endsAt);
});

socket.on('roundEnded', (result) => {
  if (result.correct) {
    setMessage(`${result.winner.name} guessed it! The answer was: ${result.answer}`);
  } else {
    setMessage(`Time is up! The answer was: ${result.answer}`);
  }
  elements.guessInput.value = '';
});

socket.on('gameFinished', (data) => {
  renderEndScreen(data);
  renderView('end');
});

socket.on('errorMessage', (message) => {
  setMessage(message);
});

document.getElementById('create-room-btn').addEventListener('click', () => {
  const name = document.getElementById('create-name').value.trim();
  if (!name) {
    setMessage('Please enter a name before creating a room.');
    return;
  }
  socket.emit('createRoom', { name });
});

document.getElementById('join-room-btn').addEventListener('click', () => {
  const name = document.getElementById('join-name').value.trim();
  const code = document.getElementById('join-code').value.trim();

  if (!name || !code) {
    setMessage('Please enter your name and room code.');
    return;
  }

  socket.emit('joinRoom', { name, code });
});

document.getElementById('start-game-btn').addEventListener('click', () => {
  socket.emit('startGame');
});

document.getElementById('leave-room-btn').addEventListener('click', () => {
  socket.disconnect();
  socket.connect();
  state.room = null;
  state.roomCode = '';
  state.isHost = false;
  renderView('landing');
  elements.statusMessage.textContent = 'You left the room.';
});

document.getElementById('guess-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const guess = elements.guessInput.value.trim();
  if (!guess) return;

  socket.emit('submitGuess', { guess });
  elements.guessInput.value = '';
});

document.getElementById('play-again-btn').addEventListener('click', () => {
  state.roomCode = '';
  state.isHost = false;
  renderView('landing');
  elements.guessInput.value = '';
  elements.statusMessage.textContent = '';
});

renderView('landing');
