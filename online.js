// ===== ONLINE.JS - FIREBASE SIMPLE SYNC (STABLE) =====
console.log("[ONLINE] Modulo online STABLE cargando...")

const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

const firebase = window.firebase
let db = null

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  db = firebase.database()
  console.log("[ONLINE] Firebase OK")
} catch (e) {
  console.error("[ONLINE] Firebase error:", e)
}

// ===== STATE =====
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== CREATE ROOM =====
async function createRoom() {
  if (!db) return alert("Firebase no conectado")

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  console.log("[ONLINE] Sala creada:", roomId)
  listenPlayers()
}

// ===== JOIN ROOM =====
async function joinRoom(code) {
  if (!db) return alert("Firebase no conectado")
  if (!code) return

  code = code.toUpperCase()
  const snap = await db.ref(`rooms/${code}`).once("value")
  if (!snap.exists()) {
    alert("Sala no existe")
    return
  }

  roomId = code
  isHost = false

  const players = snap.val().players || {}
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
  onlineReady = true
  listenPlayers()
}

// ===== LISTEN PLAYERS =====
function listenPlayers() {
  if (!roomId) return

  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()
    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        onlineReady = true

        if (typeof window.updateEnemyDisplay === "function") {
          window.updateEnemyDisplay(enemyState)
        }
      }
    }
  })
}

// ===== SEND STATE (called from game.js) =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: speed || 0,
    distance: distance || 0,
  })
}

// ===== GETTERS =====
function getEnemyDistance() {
  return enemyState.distance || 0
}
function getEnemySpeed() {
  return enemyState.speed || 0
}
function isOnlineGameReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}

// ===== CLEANUP =====
function cleanupOnlineGame() {
  if (roomId && db) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()
    if (isHost) db.ref(`rooms/${roomId}`).remove()
  }
  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== EXPORT =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.getEnemyDistance = getEnemyDistance
window.getEnemySpeed = getEnemySpeed
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online STABLE listo")
