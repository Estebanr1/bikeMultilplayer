// ===== ONLINE.JS V16 CLEAN =====
console.log("[ONLINE] Cargando modulo online V16 CLEAN")

// Firebase init (usa el firebase ya cargado por HTML)
firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let gameStarted = false

let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== Crear sala =====
async function createRoom() {
  isHost = true
  onlineReady = false
  gameStarted = false

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    host: playerId,
    gameStarted: false,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  listenRoom()
  return roomId
}

// ===== Unirse a sala =====
async function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false
  onlineReady = false
  gameStarted = false

  const snap = await db.ref(`rooms/${roomId}`).once("value")
  if (!snap.exists()) return false

  const data = snap.val()
  const players = data.players || {}

  if (Object.keys(players).length >= 2) return false

  await db.ref(`rooms/${roomId}/players/${playerId}`).set({
    speed: 0,
    distance: 0,
  })

  listenRoom()
  return true
}

// ===== Escuchar sala =====
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    const count = Object.keys(players).length

    onlineReady = count === 2
    gameStarted = room.gameStarted === true

    if (onlineReady && typeof window.onOnlineReady === "function") {
      window.onOnlineReady(isHost)
    }

    if (gameStarted && typeof window.onOnlineGameStart === "function") {
      window.onOnlineGameStart()
    }

    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
      }
    }
  })
}

// ===== Enviar estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady || !gameStarted) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
  })
}

// ===== Host inicia =====
function hostStartGame() {
  if (!isHost || !roomId) return
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
}

// ===== Getters =====
function getEnemyState() {
  return enemyState
}
function isOnlineReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}

// ===== Cleanup =====
function cleanupOnline() {
  if (!roomId) return
  db.ref(`rooms/${roomId}/players/${playerId}`).remove()
  if (isHost) db.ref(`rooms/${roomId}`).remove()
  roomId = null
}

window.addEventListener("beforeunload", cleanupOnline)

// ===== Exponer API =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.hostStartGame = hostStartGame
window.getEnemyState = getEnemyState
window.isOnlineReady = isOnlineReady
window.isGameHost = isGameHost

console.log("[ONLINE] Modulo online V16 CLEAN listo")
