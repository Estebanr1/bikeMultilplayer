// ===== Firebase init =====
const firebase = require("firebase/app")
require("firebase/database")
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

firebase.initializeApp(firebaseConfig)
const db = firebase.database()

// ===== Online state =====
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let enemyState = { speed: 0, distance: 0 }
let onlineReady = false
const speed = 0 // Declare speed variable
const distance = 0 // Declare distance variable
const updateEnemyDisplay = (state) => {} // Declare updateEnemyDisplay function

// ===== UI FEEDBACK =====
function updateOnlineStatus(message, isConnected = false) {
  console.log(`[ONLINE] ${message}`)

  const statusEl = document.getElementById("onlineStatus")
  if (statusEl) {
    statusEl.textContent = message
    statusEl.className = isConnected ? "online-status connected" : "online-status waiting"
  }
}

// ===== MATCHMAKING CON TRANSACCIÓN (SIN RACE CONDITION) =====
async function startOnlineGame() {
  updateOnlineStatus("Buscando sala...")

  const matchmakingRef = db.ref("matchmaking/waiting")

  try {
    const result = await matchmakingRef.transaction((currentData) => {
      if (currentData === null) {
        // No hay nadie esperando - ser el host
        return {
          playerId: playerId,
          timestamp: Date.now(),
        }
      } else {
        // Alguien está esperando - unirse a su sala
        // Retornar null para eliminar la entrada
        return null
      }
    })

    if (result.committed) {
      if (result.snapshot.val() !== null) {
        // Somos el host - esperando jugador 2
        isHost = true
        roomId = playerId // Usar nuestro ID como roomId

        await db.ref(`rooms/${roomId}`).set({
          created: Date.now(),
          host: playerId,
          players: {
            [playerId]: { speed: 0, distance: 0, ready: true },
          },
          status: "waiting",
        })

        updateOnlineStatus(`Sala creada: ${roomId.substring(0, 6)}... Esperando rival...`)
        console.log("[ONLINE] HOST - Sala creada:", roomId)

        // Escuchar cuando se une el jugador 2
        listenForPlayer2()
      } else {
        // Nos unimos a una sala existente
        isHost = false

        // Obtener el ID del host que estaba esperando
        const waitingSnap = await db.ref("matchmaking/lastHost").once("value")
        const hostId = waitingSnap.val()

        if (hostId) {
          roomId = hostId

          await db.ref(`rooms/${roomId}/players/${playerId}`).set({
            speed: 0,
            distance: 0,
            ready: true,
          })

          await db.ref(`rooms/${roomId}/status`).set("playing")

          updateOnlineStatus("Conectado! Iniciando carrera...", true)
          console.log("[ONLINE] GUEST - Unido a sala:", roomId)

          onlineReady = true
          listenRoom()
        }
      }
    }

    if (isHost) {
      await db.ref("matchmaking/lastHost").set(playerId)
    }
  } catch (error) {
    console.error("[ONLINE] Error en matchmaking:", error)
    updateOnlineStatus("Error de conexión. Reintentando...")

    // Reintentar después de 2 segundos
    setTimeout(startOnlineGame, 2000)
  }
}

// ===== HOST: Escuchar cuando llega jugador 2 =====
function listenForPlayer2() {
  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()
    const playerCount = Object.keys(players).length

    console.log("[ONLINE] Jugadores en sala:", playerCount)

    if (playerCount >= 2 && !onlineReady) {
      onlineReady = true
      updateOnlineStatus("Rival conectado! Iniciando...", true)

      // Limpiar matchmaking
      db.ref("matchmaking/waiting").remove()
      db.ref("matchmaking/lastHost").remove()

      // Empezar a sincronizar
      listenRoom()
    }
  })

  setTimeout(() => {
    if (!onlineReady && isHost) {
      console.log("[ONLINE] Timeout esperando jugador")
      updateOnlineStatus("Nadie se unió. Haz clic en Online para reintentar.")

      // Limpiar sala
      db.ref(`rooms/${roomId}`).remove()
      db.ref("matchmaking/waiting").remove()
      db.ref("matchmaking/lastHost").remove()
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

        if (typeof updateEnemyDisplay === "function") {
          updateEnemyDisplay(enemyState)
        }
      }
    }
  })
}

// ===== Enviar mi estado =====
function sendOnlineState() {
  if (!roomId || !onlineReady) return

  // Obtener variables globales del juego
  const currentSpeed = typeof speed !== "undefined" ? speed : 0
  const currentDistance = typeof distance !== "undefined" ? distance : 0

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: currentSpeed,
    distance: currentDistance,
    timestamp: Date.now(),
  })
}

// ===== Getters para el juego =====
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

// ===== Limpiar al salir =====
function cleanupOnlineGame() {
  if (roomId) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()

    // Si soy el host y no hay nadie más, eliminar la sala
    if (isHost) {
      db.ref(`rooms/${roomId}`).once("value", (snap) => {
        const data = snap.val()
        if (data && Object.keys(data.players || {}).length <= 1) {
          db.ref(`rooms/${roomId}`).remove()
        }
      })
    }
  }

  // Limpiar matchmaking si estaba esperando
  db.ref("matchmaking/waiting").once("value", (snap) => {
    if (snap.val()?.playerId === playerId) {
      db.ref("matchmaking/waiting").remove()
      db.ref("matchmaking/lastHost").remove()
    }
  })

  roomId = null
  onlineReady = false
  isHost = false
}

// Limpiar al cerrar la ventana
window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== EXPONER FUNCIONES GLOBALES =====
window.startOnlineGame = startOnlineGame
window.sendOnlineState = sendOnlineState
window.getEnemyDistance = getEnemyDistance
window.getEnemySpeed = getEnemySpeed
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getRoomId = getRoomId
window.cleanupOnlineGame = cleanupOnlineGame
