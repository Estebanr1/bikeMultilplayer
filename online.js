// ===== Firebase init =====
const firebase = window.firebase // Declare the firebase variable
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

firebase.initializeApp(firebaseConfig)
const db = firebase.database()

// ===== Online state =====
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let enemyState = { speed: 0, distance: 0 } // Initialize enemyState
let onlineReady = false

console.log("[ONLINE] Mi ID:", playerId)

// ===== UI FEEDBACK =====
function updateOnlineStatus(message, isConnected = false) {
  console.log(`[ONLINE] ${message}`)
  const statusEl = document.getElementById("onlineStatus")
  if (statusEl) {
    statusEl.textContent = message
    statusEl.className = isConnected ? "online-status connected" : "online-status waiting"
  }
}

// ===== MATCHMAKING SIMPLIFICADO =====
async function startOnlineGame() {
  updateOnlineStatus("Buscando sala...")

  try {
    // Paso 1: Buscar salas esperando jugadores
    const roomsSnap = await db.ref("rooms").orderByChild("status").equalTo("waiting").limitToFirst(1).once("value")

    const rooms = roomsSnap.val()

    if (rooms) {
      // HAY UNA SALA ESPERANDO - UNIRSE COMO GUEST
      const foundRoomId = Object.keys(rooms)[0]
      console.log("[ONLINE] Sala encontrada:", foundRoomId)

      // Intentar tomar la sala con transacción
      const statusRef = db.ref(`rooms/${foundRoomId}/status`)
      const result = await statusRef.transaction((currentStatus) => {
        if (currentStatus === "waiting") {
          return "playing" // Tomar la sala
        }
        return // Abortar si ya no está waiting
      })

      if (result.committed && result.snapshot.val() === "playing") {
        // Éxito - somos el guest
        isHost = false
        roomId = foundRoomId

        await db.ref(`rooms/${roomId}/players/${playerId}`).set({
          speed: 0,
          distance: 0,
          ready: true,
        })

        updateOnlineStatus("Conectado! Eres Jugador 2", true)
        console.log("[ONLINE] GUEST - Unido a sala:", roomId)

        onlineReady = true
        listenRoom()
        return
      }
    }

    // NO HAY SALA O LA TRANSACCIÓN FALLÓ - CREAR NUEVA COMO HOST
    console.log("[ONLINE] Creando nueva sala como HOST")
    isHost = true
    roomId = playerId

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      players: {
        [playerId]: { speed: 0, distance: 0, ready: true },
      },
      status: "waiting",
    })

    updateOnlineStatus(`Sala: ${roomId.slice(-6)} - Esperando rival...`)
    console.log("[ONLINE] HOST - Sala creada:", roomId)

    // Escuchar cuando llegue el guest
    listenForPlayer2()
  } catch (error) {
    console.error("[ONLINE] Error:", error)
    updateOnlineStatus("Error. Reintentando en 2s...")
    setTimeout(startOnlineGame, 2000)
  }
}

// ===== HOST: Escuchar cuando llega jugador 2 =====
function listenForPlayer2() {
  const playersRef = db.ref(`rooms/${roomId}/players`)

  playersRef.on("child_added", (snap) => {
    const newPlayerId = snap.key

    if (newPlayerId !== playerId && !onlineReady) {
      console.log("[ONLINE] Jugador 2 conectado:", newPlayerId)
      onlineReady = true
      updateOnlineStatus("Rival conectado! Eres Jugador 1", true)
      listenRoom()
    }
  })

  // Timeout de 60 segundos
  setTimeout(() => {
    if (!onlineReady && isHost) {
      console.log("[ONLINE] Timeout - nadie se unió")
      updateOnlineStatus("Nadie se unió. Click en Online para reintentar.")
      db.ref(`rooms/${roomId}`).remove()
      roomId = null
    }
  }, 60000)
}

// ===== Sync bidireccional =====
function listenRoom() {
  if (!roomId) return

  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()
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

// ===== Enviar mi estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: speed || 0,
    distance: distance || 0,
    timestamp: Date.now(),
  })
}

// ===== Getters =====
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

function getRoomId() {
  return roomId
}

// ===== Cleanup =====
function cleanupOnlineGame() {
  if (roomId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()
    if (isHost) {
      db.ref(`rooms/${roomId}`).remove()
    }
  }
  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== EXPONER GLOBALMENTE =====
window.startOnlineGame = startOnlineGame
window.sendOnlineState = sendOnlineState
window.getEnemyDistance = getEnemyDistance
window.getEnemySpeed = getEnemySpeed
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getRoomId = getRoomId
window.cleanupOnlineGame = cleanupOnlineGame
