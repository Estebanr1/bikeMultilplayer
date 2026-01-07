const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomId = null;
let playerId = "p" + Math.floor(Math.random() * 10000);

function createRoom() {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("roomCode").textContent = roomId;

  db.ref("rooms/" + roomId).set({
    status: "waiting"
  });

  db.ref("rooms/" + roomId + "/players").child(playerId).set({
    distance: 0
  });

  listenRoom();
}

function joinRoomPrompt() {
  const code = prompt("Código de sala:");
  if (!code) return;
  roomId = code.toUpperCase();

  document.getElementById("menu").classList.add("hidden");
  document.getElementById("lobby").classList.remove("hidden");
  document.getElementById("roomCode").textContent = roomId;

  db.ref("rooms/" + roomId + "/players").child(playerId).set({
    distance: 0
  });

  listenRoom();
}

function listenRoom() {
  db.ref("rooms/" + roomId + "/players").on("value", snap => {
    if (!snap.exists()) return;

    const players = snap.val();
    const ids = Object.keys(players);

    if (ids.length >= 2) {
      startGame();
    }

    ids.forEach(id => {
      if (id !== playerId) {
        document.getElementById("enemyDistance").textContent =
          players[id].distance.toFixed(1);
      }
    });
  });
}

function sendOnlineState() {
  if (!roomId) return;

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    distance
  });
}

function cancelRoom() {
  if (roomId) {
    db.ref("rooms/" + roomId).remove();
  }
  location.reload();
}
