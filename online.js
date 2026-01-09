// ===== ONLINE.JS – V16 FINAL =====
console.log("[ONLINE] Cargando modulo online V16 FINAL")

// ===============================
// Firebase init (UNA SOLA VEZ)
// ===============================
if (!firebase.apps.length) {
  firebase.initializeApp({
    databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
  })
}
const db = firebase.database()

// ===============================
// Estado global
// ===============================
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false

let enemyState = { speed: 0, distance: 0 }

// ⏱️ tiempo (solo lectura en clientes)
let startTime = null
let duration = 30000 // ms (30s)

console.log("[ONLINE] Player ID:", playerId)

// ===============================
// Crear sala (HOST)
// ===============================
async function createRoom() {
  try {
    isHost = true
    onlineReady = false
    roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

    console.log("[ONLINE] HOST - Sala creada:", roomId)

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      gameStarted: false,
      startTime: null,
      duration,
      players: {
        [playerId]: { speed: 0, distance: 0 },
      },
    })

    const codeEl = document.getElementById("codigoSala")
    if (codeEl) codeEl.textContent = roomId

    listenRoom()
  } catch (err) {
    console.error("[ONLINE] Error creando sala:", err)
    alert("Error creando sala")
  }
}

// ===============================
// Unirse a sala (GUEST)
// ===============================
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

  const room = snap.val()
  const players = room.players || {}

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
  listenRoom()
}

// ===============================
// Escuchar sala completa
// ===============================
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    const ids = Object.keys(players)

    onlineReady = ids.length === 2

    // -------------------------------
    // HOST: iniciar partida UNA vez
    // -------------------------------
    if (onlineReady && isHost && !room.gameStarted) {
      console.log("[ONLINE] Host inicia partida (time authority)")

      const now = Date.now()

      db.ref(`rooms/${roomId}`).update({
        gameStarted: true,
        startTime: now,
      })

      if (typeof window.onOnlineReady === "function") {
        window.onOnlineReady()
      }
    }

    // -------------------------------
    // Tiempo sincronizado (HOST + GUEST)
    // -------------------------------
    if (room.startTime) {
      startTime = room.startTime
      duration = room.duration || duration

      const remainingMs = Math.max(0, startTime + duration - Date.now())
      const remainingSec = Math.ceil(remainingMs / 1000)

      if (typeof window.updateOnlineTimer === "function") {
        window.updateOnlineTimer(remainingSec)
      }

      if (remainingMs <= 0) {
        if (typeof window.endGame === "function") {
          window.endGame()
        }
      }
    }

    // -------------------------------
    // Estado del enemigo
    // -------------------------------
    ids.forEach((id) => {
      if (id !== playerId) {
        enemyState = players[id]
        if (typeof window.updateEnemyDisplay === "function") {
          window.updateEnemyDisplay(enemyState)
        }
      }
    })
  })
}

// ===============================
// Enviar estado del jugador
// ===============================
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
    t: Date.now(),
  })
}

// ===============================
// Getters
// ===============================
function isOnlineGameReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}
function getRoomId() {
  return roomId
}

// ===============================
// Cleanup
// ===============================
function cleanupOnlineGame() {
  if (!roomId) return

  db.ref(`rooms/${roomId}/players/${playerId}`).remove()
  if (isHost) db.ref(`rooms/${roomId}`).remove()

  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===============================
// Exponer API
// ===============================
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V16 FINAL cargado")
