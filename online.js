// ===============================
// ONLINE.JS V17-C (HOST MANDA)
// ===============================
console.log("[ONLINE] Cargando modulo online V17-C");

let onlineState = {
  enabled: false,
  isHost: false,
  roomCode: null,
  playerId: "p" + Math.floor(Math.random() * 10000),
  started: false
};

let roomRef = null;

// ---- API PUBLICA ----
window.ONLINE = {
  state: onlineState,
  createRoom,
  joinRoom,
  startGameAsHost,
  sendProgress,
  onGameStart: null,
  onRemoteProgress: null
};

// ---- CREAR SALA (HOST) ----
function createRoom() {
  onlineState.enabled = true;
  onlineState.isHost = true;
  onlineState.roomCode = Math.floor(1000 + Math.random() * 9000).toString();

  roomRef = firebase.database().ref("rooms/" + onlineState.roomCode);

  roomRef.set({
    host: onlineState.playerId,
    started: false,
    time: 60,
    players: {
      host: { clicks: 0, dist: 0 },
      guest: { clicks: 0, dist: 0 }
    }
  });

  listenRoom();
  return onlineState.roomCode;
}

// ---- UNIRSE A SALA (GUEST) ----
function joinRoom(code) {
  onlineState.enabled = true;
  onlineState.isHost = false;
  onlineState.roomCode = code;

  roomRef = firebase.database().ref("rooms/" + code);
  listenRoom();
}

// ---- ESCUCHA CENTRAL ----
function listenRoom() {
  roomRef.on("value", snap => {
    const data = snap.val();
    if (!data) return;

    // SOLO CUANDO EL HOST ARRANCA
    if (data.started && !onlineState.started) {
      onlineState.started = true;
      console.log("[ONLINE] Juego iniciado por host");
      if (ONLINE.onGameStart) ONLINE.onGameStart(data.time);
    }

    // PROGRESO REMOTO
    if (onlineState.isHost && ONLINE.onRemoteProgress) {
      ONLINE.onRemoteProgress(data.players.guest);
    }

    if (!onlineState.isHost && ONLINE.onRemoteProgress) {
      ONLINE.onRemoteProgress(data.players.host);
    }
  });
}

// ---- HOST INICIA JUEGO ----
function startGameAsHost() {
  if (!onlineState.isHost) return;
  roomRef.update({
    started: true,
    time: 60
  });
}

// ---- ENVIAR PROGRESO ----
function sendProgress(clicks, dist) {
  if (!roomRef) return;
  const path = onlineState.isHost ? "players/host" : "players/guest";
  roomRef.child(path).update({ clicks, dist });
}

console.log("[ONLINE] Modulo online V17-C listo");
