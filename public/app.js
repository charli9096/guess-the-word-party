* {
  box-sizing: border-box;
}

:root {
  --bg: #111827;
  --bg-soft: #1f2937;
  --panel: #0f172a;
  --panel-alt: #1e293b;
  --primary: #8b5cf6;
  --primary-strong: #7c3aed;
  --accent: #22c55e;
  --danger: #ef4444;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --border: rgba(148, 163, 184, 0.2);
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #111827, #1e1b4b);
  color: var(--text);
}

button, input {
  font: inherit;
}

.app-shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

.topbar {
  margin-bottom: 24px;
}

.brand {
  font-size: clamp(1.5rem, 4vw, 2.6rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
}

.panel {
  display: none;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
  padding: 24px;
}

.panel.active {
  display: block;
}

h1, h2, h3, p {
  margin-top: 0;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.card {
  background: var(--panel-alt);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

input {
  width: 100%;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 12px 14px;
}

button {
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  background: var(--primary);
  color: white;
  cursor: pointer;
  font-weight: 700;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

button:hover {
  transform: translateY(-1px);
}

button.secondary {
  background: rgba(148, 163, 184, 0.18);
  color: var(--text);
}

button.primary {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
}

.badge {
  background: rgba(34, 197, 94, 0.2);
  color: #a7f3d0;
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.lobby-layout {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr;
  gap: 18px;
  align-items: start;
}

.player-list-wrap, .scoreboard-wrap {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 16px;
}

.player-list, .scoreboard {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.player-list li, .scoreboard li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(30, 41, 59, 0.9);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
}

.player-list li .name, .scoreboard li .name {
  font-weight: 700;
}

.player-list li .tag {
  font-size: 0.7rem;
  color: var(--muted);
  text-transform: uppercase;
}

.lobby-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.game-topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.mini-label {
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.72rem;
}

.timer-box {
  background: rgba(139, 92, 246, 0.16);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 14px;
  padding: 12px 18px;
  text-align: center;
  min-width: 100px;
}

.timer-box span {
  display: block;
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.timer-box strong {
  font-size: 1.6rem;
}

.prompt-box {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(34, 197, 94, 0.14));
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px 20px;
  text-align: center;
  font-size: clamp(1.2rem, 2vw, 2rem);
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.guess-form {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.guess-form input {
  flex: 1;
}

.status-message {
  min-height: 24px;
  color: #a7f3d0;
  font-weight: 700;
  margin-bottom: 18px;
}

.winner-name {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  color: #fef08a;
  margin-bottom: 24px;
}

#play-again-btn {
  margin-top: 18px;
}

@media (max-width: 700px) {
  .lobby-layout {
    grid-template-columns: 1fr;
  }

  .guess-form {
    flex-direction: column;
  }

  .game-topbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
