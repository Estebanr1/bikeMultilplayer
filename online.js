// ===== Firebase init =====
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== Online state =====
let roomId = null;
let playerId = "p" + Math.floor(Math.random() * 100000);
let enemyState = { speed: 0, distance: 0 };

// ===== MATCHMAKING AUTOMÁTICO =====
async function startOnlineGame() {
  const roomsSnap = await db.ref("rooms").once("value");

  if (roomsSnap.exists()) {
    const rooms = roomsSnap.val();

    for (let id in rooms) {
      const players = rooms[id].players || {};

      if (Object.keys(players).length === 1) {
        // 👉 UNIRSE COMO JUGADOR 2
        roomId = id;

        db.ref(`rooms/${roomId}/players/${playerId}`).set({
          speed: 0,
          distance: 0
        });

        console.log("Unido a sala:", roomId);
        listenRoom();
        return;
      }
    }
  }

  // 👉 CREAR SALA (JUGADOR 1)
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    players: {
      [playerId]: { speed: 0, distance: 0 }
    }
  });

  console.log("Sala creada:", roomId);
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

// ===== EXPONER FUNCIÓN GLOBAL =====
window.startOnlineGame = startOnlineGame;

