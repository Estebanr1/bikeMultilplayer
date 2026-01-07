// ===== Firebase init =====
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Online state =====
let roomId = null;
let playerId = "p" + Math.floor(Math.random() * 100000);
let enemyState = {
  speed: 0,
  distance: 0
};

// ===== UI =====
function createRoom() {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

  db.ref("rooms/" + roomId).set({ created: Date.now() });
  db.ref(`rooms/${roomId}/players/${playerId}`).set({ speed: 0, distance: 0 });

  alert("Sala creada: " + roomId);
  listenRoom();
}

function joinRoomPrompt() {
  const code = prompt("Código de sala:");
  if (!code) return;

  roomId = code.toUpperCase();
  db.ref(`rooms/${roomId}/players/${playerId}`).set({ speed: 0, distance: 0 });

  listenRoom();
}

// ===== Sync =====
function listenRoom() {
  db.ref(`rooms/${roomId}/players`).on("value", snap => {
    if (!snap.exists()) return;

    const players = snap.val();

    for (let id in players) {
      if (id !== playerId) {
        enemyState = players[id];
      }
    }
  });
}

// ===== Called from your game loop =====
function sendOnlineState() {
  if (!roomId) return;

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance
  });
}

// ===== Used by your render =====
function getEnemyDistance() {
  return enemyState.distance || 0;
}

function getEnemySpeed() {
  return enemyState.speed || 0;
}
