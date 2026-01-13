console.log("[ONLINE] Cargando modulo online V16 FIX")

// ===== FIREBASE INIT (OBLIGATORIO) =====
if (!firebase.apps.length) {
  firebase.initializeApp({
    databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
  })
}

const db = firebase.database()

// ===== ESTADO =====
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let gameStarted = false

console.log("[ONLINE] Player ID:", playerId)

// ===== CREAR SALA =====
function createRoom() {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true
  gameStarted = false

  db.ref(`rooms/${roomId}`).set({
    state: "waiting",
    host: playerId,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  document.getElementById("codigoSala").textContent = roomId
  document.getElementById("salaConectada").textContent = roomId

  listenRoom()
}

// ===== UNIRSE =====
function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false
  gameStarted = false

  db.ref(`rooms/${roomId}`).once("value").then((snap) => {
    if (!snap.exists()) {
      alert("Sala no existe")
      return
    }

    db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
    })

    document.getElementById("salaConectada").textContent = roomId
    listenRoom()
  })
}

// ===== ESCUCHAR SALA =====
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const data = snap.val()

    if (data.state === "playing" && !gameStarted) {
      gameStarted = true
      window.startGame("online")
    }

    const players = data.players || {}
    for (const id in players) {
      if (id !== playerId && window.updateEnemyDisplay) {
        window.updateEnemyDisplay(players[id])
      }
    }
  })
}

// ===== INICIAR (SOLO HOST) =====
function startOnlineGame() {
  if (!isHost) return

  db.ref(`rooms/${roomId}`).update({
    state: "playing",
    startTime: firebase.database.ServerValue.TIMESTAMP,
  })
}

// ===== API =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.startOnlineGame = startOnlineGame
window.isGameHost = () => isHost

console.log("[ONLINE] Modulo online V16 FIX listo")
