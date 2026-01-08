// ===== ONLINE.JS - V16 FIREBASE MATCHMAKING =====
console.log("[ONLINE] Cargando modulo online V16...")

// Import Firebase
const firebase = require("firebase/app")
require("firebase/database")

// Firebase config
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

// Init Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig)
const db = firebase.database()

// Estado online
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let enemyState = { speed: 0, distance: 0 }
let onlineReady = false
let gameStarted = false

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

// ===== MATCHMAKING =====
async function startOnlineGame() {
  updateOnlineStatus("Buscando sala...")

  // Mostrar vista de espera
  document.getElementById("buscarView")?.classList.add("hidden")
  document.getElementById("esperandoView")?.classList.remove("hidden")

  try {
    // Paso 1: Buscar salas esperando
    const roomsSnap = await db.ref("rooms").orderByChild("status").equalTo("waiting").limitToFirst(1).once("value")

    const rooms = roomsSnap.val()

    if (rooms) {
      // HAY SALA ESPERANDO - UNIRSE COMO GUEST
      const foundRoomId = Object.keys(rooms)[0]
      console.log("[ONLINE] Sala encontrada:", foundRoomId)

      // Transaccion atomica para tomar la sala
      const statusRef = db.ref(`rooms/${foundRoomId}/status`)
      const result = await statusRef.transaction((currentStatus) => {
        if (currentStatus === "waiting") {
          return "playing"
        }
        return // Abortar
      })

      if (result.committed && result.snapshot.val() === "playing") {
        // Exito - somos guest
        isHost = false
        roomId = foundRoomId

        await db.ref(`rooms/${roomId}/players/${playerId}`).set({
          speed: 0,
          distance: 0,
          ready: true,
        })

        updateOnlineStatus("Conectado! Eres Jugador 2", true)
        console.log("[ONLINE] GUEST unido a sala:", roomId)

        onlineReady = true
        showConnectedView()
        listenRoom()
        return
      }
    }

    // NO HAY SALA - CREAR COMO HOST
    console.log("[ONLINE] Creando sala como HOST")
    isHost = true
    roomId = playerId

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      players: {
        [playerId]: { speed: 0, distance: 0, ready: true },
      },
      status: "waiting",
      gameStarted: false,
    })

    document.getElementById("salaId").textContent = roomId.slice(-6)
    updateOnlineStatus("Esperando rival...")
    console.log("[ONLINE] HOST - Sala creada:", roomId)

    // Escuchar jugador 2
    listenForPlayer2()
  } catch (error) {
    console.error("[ONLINE] Error:", error)
    updateOnlineStatus("Error. Reintentando...")
    setTimeout(startOnlineGame, 2000)
  }
}

// ===== HOST: Escuchar jugador 2 =====
function listenForPlayer2() {
  const playersRef = db.ref(`rooms/${roomId}/players`)

  playersRef.on("child_added", (snap) => {
    const newPlayerId = snap.key

    if (newPlayerId !== playerId && !onlineReady) {
      console.log("[ONLINE] Jugador 2 conectado:", newPlayerId)
      onlineReady = true
      updateOnlineStatus("Rival conectado! Eres Jugador 1", true)
      showConnectedView()
      listenRoom()
    }
  })

  // Timeout 60s
  setTimeout(() => {
    if (!onlineReady && isHost) {
      console.log("[ONLINE] Timeout")
      updateOnlineStatus("Nadie se unio. Intenta de nuevo.")
      db.ref(`rooms/${roomId}`).remove()
      roomId = null
      resetOnlineUI()
    }
  }, 60000)
}

// ===== Mostrar vista conectado =====
function showConnectedView() {
  document.getElementById("buscarView")?.classList.add("hidden")
  document.getElementById("esperandoView")?.classList.add("hidden")
  document.getElementById("conectadoView")?.classList.remove("hidden")

  document.getElementById("miRol").textContent = isHost ? "Eres Jugador 1 (Host)" : "Eres Jugador 2 (Guest)"
  document.getElementById("p1StatusOnline").textContent = "Listo"
  document.getElementById("p2StatusOnline").textContent = "Listo"
}

// ===== Reset UI =====
function resetOnlineUI() {
  document.getElementById("buscarView")?.classList.remove("hidden")
  document.getElementById("esperandoView")?.classList.add("hidden")
  document.getElementById("conectadoView")?.classList.add("hidden")
}

// ===== Sync bidireccional =====
function listenRoom() {
  if (!roomId) return

  // Escuchar estado de jugadores
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

  // Escuchar inicio de juego (para guest)
  db.ref(`rooms/${roomId}/gameStarted`).on("value", (snap) => {
    if (snap.val() === true && !gameStarted && !isHost) {
      console.log("[ONLINE] Host inicio el juego")
      gameStarted = true
      if (typeof window.startOnlineRace === "function") {
        window.startOnlineRace()
      }
    }
  })
}

// ===== Enviar estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: speed || 0,
    distance: distance || 0,
    timestamp: Date.now(),
  })
}

// ===== Iniciar juego (host) =====
function hostStartGame() {
  if (!roomId || !isHost) return

  console.log("[ONLINE] Host iniciando juego")
  gameStarted = true
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
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
  gameStarted = false
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
window.hostStartGame = hostStartGame

console.log("[ONLINE] Modulo online V16 cargado!")
