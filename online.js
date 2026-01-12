// ===== ONLINE.JS – V16 HOST AUTHORITY FIX =====
console.log("[ONLINE] Cargando modulo online V16 FIX")

firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }
let startTime = null

console.log("[ONLINE] Player ID:", playerId)

// ===== Crear sala (HOST) =====
async function createRoom() {
  isHost = true
  onlineReady = false
  startTime = null

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    host: playerId,
    gameStarted: false,
    startTime: null,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  document.getElementById("codigoSala").textContent = roomId
  listenRoom()
}

// ===== Unirse a sala (GUEST) =====
async function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false
  onlineReady = false

  const ref = db.ref(`rooms/${roomId}`)
  const snap = await ref.once("value")
  if (!snap.exists()) {
    alert("Sala no existe")
    return
  }

  const players = snap.val().players || {}
  if (Object.keys(players).length >= 2) {
    alert("Sala llena")
    return
  }

  await db.ref(`rooms/${roomId}/players/${playerId}`).set({
    speed: 0,
    distance: 0,
  })

  listenRoom()
}

// ===== Escuchar sala completa =====
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}

    onlineReady = Object.keys(players).length === 2
    startTime = room.startTime ?? null

    // ENEMIGO
    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        window.updateEnemyDisplay?.(enemyState)
      }
    }

    // INICIO CONTROLADO POR HOST
    if (room.gameStarted && startTime) {
      window.startOnlineRace?.(startTime)
    }
  })
}

// ===== HOST inicia carrera =====
function hostStartGame() {
  if (!isHost || !onlineReady) return

  const ts = Date.now()

  db.ref(`rooms/${roomId}`).update({
    gameStarted: true,
    startTime: ts,
  })
}

// ===== Enviar estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
  })
}

// ===== Cleanup =====
function cleanupOnlineGame() {
  if (roomId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()
    if (isHost) db.ref(`rooms/${roomId}`).remove()
  }
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== Exponer =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.hostStartGame = hostStartGame
window.isOnlineGameReady = () => onlineReady
window.isGameHost = () => isHost

console.log("[ONLINE] Modulo online V16 FIX listo")
