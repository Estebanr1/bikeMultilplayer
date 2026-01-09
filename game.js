// ===============================
// GAME.JS V17-C (ONLINE SYNC)
// ===============================
console.log("[GAME] Cargando V17-C ONLINE SYNC");

let gameRunning = false;
let timeLeft = 60;
let clicks = 0;
let distance = 0;
let timerInterval = null;

// ---- DOM READY ----
window.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM READY");

  // BOTON HOST INICIA
  const btnStartOnline = document.getElementById("btnIniciarOnline");
  if (btnStartOnline) {
    btnStartOnline.onclick = () => {
      if (ONLINE.state.isHost) {
        ONLINE.startGameAsHost();
      }
    };
  }
});

// ---- CUANDO HOST ARRANCA ----
ONLINE.onGameStart = (initialTime) => {
  console.log("[GAME] Juego ONLINE iniciado");
  timeLeft = initialTime;
  startGame();
};

// ---- PROGRESO REMOTO ----
ONLINE.onRemoteProgress = (remote) => {
  if (!remote) return;
  updateRemoteUI(remote);
};

// ---- INICIAR JUEGO ----
function startGame() {
  if (gameRunning) return;
  gameRunning = true;
  clicks = 0;
  distance = 0;

  showGameScreen();
  startTimer();
}

// ---- TIMER (SOLO LOCAL) ----
function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!gameRunning) return;
    timeLeft--;
    updateTimeUI();

    if (timeLeft <= 0) endGame();
  }, 1000);
}

// ---- CLICK JUGADOR ----
document.addEventListener("keydown", e => {
  if (!gameRunning) return;
  if (e.code === "Space") registerClick();
});

function registerClick() {
  clicks++;
  distance += 5;
  updateLocalUI();
  ONLINE.sendProgress(clicks, distance);
}

// ---- FIN ----
function endGame() {
  gameRunning = false;
  clearInterval(timerInterval);
  console.log("[GAME] Juego terminado");
}

// ---- UI (SIMPLIFICADO) ----
function showGameScreen() {
  mostrarPagina("juegoCarrera");
}

function updateTimeUI() {
  const t = document.getElementById("tiempoRestante");
  if (t) t.textContent = timeLeft;
}

function updateLocalUI() {
  document.getElementById("p1Dist").textContent = distance + "m";
}

function updateRemoteUI(remote) {
  document.getElementById("p2Dist").textContent = remote.dist + "m";
}
