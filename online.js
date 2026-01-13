// ===== ONLINE.JS – V16 FINAL FIX =====
console.log("[ONLINE] Cargando modulo online V16 FINAL FIX")

// Firebase init (frontend)
firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

// ===== ESTADO (DECLARADO ARRIBA → SIN TDZ) =====
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== CREAR SALA =====
async function createRoom() {
  isHost = true
  onlineReady = false

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

  await db.ref(`rooms/${roomId}`).set({
    host: playerId,
    gameStarted: false,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  const el = document.getElementById("codigoSala")
  if (el) el.textContent = roomId

  listenRoom()
}

// ===== UNIRSE =====
async function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false

  const snap = await db.ref(`rooms/${roomId}`).once("value")
  if (!snap.exists()) {
    alert("Sala no existe")
    roomId = null
    return
  }

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

  listenRoom()
}

// ===== ESCUCHAR SALA =====
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", snap => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    onlineReady = Object.keys(players).length === 2

    // 🔹 SOLO HOST puede iniciar
    if (room.gameStarted && typeof window.startOnlineRace === "function") {
      window.startOnlineRace()
    }

    // 🔹 Enemigo
    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        window.updateEnemyDisplay?.(enemyState)
      }
    }
  })
}

// ===== ENVIAR ESTADO =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
  })
}

// ===== HOST INICIA =====
function hostStartGame() {
  if (!roomId || !isHost) return
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
}

// ===== CLEANUP =====
function cleanupOnlineGame() {
  if (!roomId) return
  db.ref(`rooms/${roomId}/players/${playerId}`).remove()
  if (isHost) db.ref(`rooms/${roomId}`).remove()
  roomId = null
}

// ===== EXPONER =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.hostStartGame = hostStartGame
window.cleanupOnlineGame = cleanupOnlineGame
window.isGameHost = () => isHost
window.isOnlineGameReady = () => onlineReady

console.log("[ONLINE] Modulo online V16 FINAL FIX listo")
