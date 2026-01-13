// ===== ONLINE.JS – V16 FIX =====
console.log("[ONLINE] Cargando modulo online V16 FIX")

firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false

console.log("[ONLINE] Player ID:", playerId)

// ===== CREAR SALA =====
async function createRoom() {
  isHost = true
  onlineReady = false

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

  await db.ref(`rooms/${roomId}`).set({
    created: Date.now(),
    host: playerId,
    gameStarted: false,
    players: {
      [playerId]: { speed: 0, distance: 0 },
    },
  })

  document.getElementById("codigoSala").textContent = roomId
  listenRoom()
}

// ===== UNIRSE A SALA =====
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

  const data = snap.val()
  if (Object.keys(data.players || {}).length >= 2) {
    alert("Sala llena")
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
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    onlineReady = Object.keys(players).length === 2

    // actualizar enemigo
    for (const id in players) {
      if (id !== playerId) {
        window.updateEnemyDisplay?.(players[id])
      }
    }

    // guest espera orden del host
    if (!isHost && room.gameStarted === true) {
      window.startOnlineRace?.()
    }
  })
}

// ===== HOST INICIA =====
function hostStartGame() {
  if (!isHost || !roomId) return
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
  window.startOnlineRace?.()
}

// ===== ENVIAR ESTADO =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return
  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
  })
}

// ===== CLEANUP =====
function cleanupOnlineGame() {
  if (!roomId) return
  db.ref(`rooms/${roomId}/players/${playerId}`).remove()
  if (isHost) db.ref(`rooms/${roomId}`).remove()
  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== EXPORT =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = () => onlineReady
window.isGameHost = () => isHost
window.hostStartGame = hostStartGame
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V16 FIX listo")
