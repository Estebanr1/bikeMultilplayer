// ===== ONLINE.JS – V16 STABLE =====
console.log("[ONLINE] Cargando modulo online V16 STABLE")

// Firebase init
firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

// Estado online
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== Crear sala =====
async function createRoom() {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true
  onlineReady = false

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    host: playerId,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
    gameStarted: false,
  })

  console.log("[ONLINE] Sala creada:", roomId)
  listenPlayers()
}

// ===== Unirse a sala =====
async function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false
  onlineReady = false

  const ref = db.ref(`rooms/${roomId}`)
  const snap = await ref.once("value")

  if (!snap.exists()) {
    alert("Sala no existe")
    roomId = null
    return
  }

  const data = snap.val()
  const players = data.players || {}

  if (Object.keys(players).length >= 2) {
    alert("Sala llena")
    roomId = null
    return
  }

  await db.ref(`rooms/${roomId}/players/${playerId}`).set({
    speed: 0,
    distance: 0,
  })

  console.log("[ONLINE] Unido a sala:", roomId)
  listenPlayers()
}

// ===== Escuchar jugadores =====
function listenPlayers() {
  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()
    onlineReady = Object.keys(players).length === 2

    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        if (typeof window.updateEnemyDisplay === "function") {
          window.updateEnemyDisplay(enemyState)
        }
      }
    }
  })
}

// ===== Enviar estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
    t: Date.now(),
  })
}

// ===== Host inicia carrera =====
function hostStartGame() {
  if (!roomId || !isHost) return
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
}

// ===== Escuchar inicio =====
db.ref("rooms").on("child_changed", (snap) => {
  const data = snap.val()
  if (data?.gameStarted && roomId === snap.key && !isHost) {
    if (typeof window.startOnlineRace === "function") {
      window.startOnlineRace()
    }
  }
})

// ===== Getters =====
function isOnlineGameReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}
function getRoomId() {
  return roomId
}

// ===== Cleanup =====
function cleanupOnlineGame() {
  if (roomId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()
    if (isHost) db.ref(`rooms/${roomId}`).remove()
  }
  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== Exponer =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.hostStartGame = hostStartGame
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V16 STABLE cargado")
