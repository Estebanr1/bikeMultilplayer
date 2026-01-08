// ===== ONLINE.JS - V16 FIREBASE MATCHMAKING (SALAS CON CODIGO) =====
console.log("[ONLINE] Cargando modulo online V16...")

// Firebase config (usando CDN, ya cargado en index.html)
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

// Declare firebase variable
const firebase = window.firebase

// Init Firebase (verificar si ya existe)
let db
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  db = firebase.database()
  console.log("[ONLINE] Firebase inicializado correctamente")
} catch (error) {
  console.error("[ONLINE] Error inicializando Firebase:", error)
}

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

// ===== CREAR SALA (HOST) =====
async function createRoom() {
  if (!db) {
    alert("Error: Firebase no esta conectado")
    return
  }

  updateOnlineStatus("Creando sala...")

  const codigo = Math.random().toString(36).substring(2, 6).toUpperCase()
  roomId = codigo
  isHost = true

  try {
    // Crear sala en Firebase
    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      players: {
        [playerId]: { speed: 0, distance: 0, ready: true },
      },
      status: "waiting",
      gameStarted: false,
    })

    // Mostrar codigo al usuario
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("esperandoView")?.classList.remove("hidden")
    document.getElementById("salaId").textContent = roomId

    updateOnlineStatus("Sala creada. Esperando rival...")
    console.log("[ONLINE] HOST - Sala creada:", roomId)

    // Escuchar cuando se una jugador 2
    listenForPlayer2()
  } catch (error) {
    console.error("[ONLINE] Error creando sala:", error)
    updateOnlineStatus("Error creando sala")
    alert("Error creando sala. Intenta de nuevo.")
  }
}

// ===== UNIRSE A SALA (GUEST) =====
async function joinRoom(codigo) {
  if (!db) {
    alert("Error: Firebase no esta conectado")
    return
  }

  if (!codigo || codigo.length < 4) {
    alert("Ingresa un codigo de sala valido (4 caracteres)")
    return
  }

  codigo = codigo.toUpperCase().trim()
  updateOnlineStatus("Verificando sala...")

  try {
    const roomSnap = await db.ref(`rooms/${codigo}`).once("value")

    if (!roomSnap.exists()) {
      console.log("[ONLINE] Sala no existe:", codigo)
      updateOnlineStatus("Sala no encontrada")
      alert("La sala '" + codigo + "' no existe. Verifica el codigo.")
      return
    }

    const roomData = roomSnap.val()
    console.log("[ONLINE] Sala encontrada:", roomData)

    if (roomData.status !== "waiting") {
      updateOnlineStatus("Sala no disponible")
      alert("Esta sala ya tiene una partida en curso o finalizo.")
      return
    }

    const playerCount = roomData.players ? Object.keys(roomData.players).length : 0
    if (playerCount >= 2) {
      updateOnlineStatus("Sala llena")
      alert("Esta sala ya tiene 2 jugadores.")
      return
    }

    // Todo OK - unirse como GUEST
    roomId = codigo
    isHost = false

    const statusRef = db.ref(`rooms/${roomId}/status`)
    const result = await statusRef.transaction((currentStatus) => {
      if (currentStatus === "waiting") {
        return "playing"
      }
      return // Abortar si ya no esta waiting
    })

    if (!result.committed || result.snapshot.val() !== "playing") {
      updateOnlineStatus("No se pudo unir")
      alert("Otro jugador se unio primero. Intenta otra sala.")
      roomId = null
      return
    }

    // Agregar jugador a la sala
    await db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
      ready: true,
    })

    console.log("[ONLINE] GUEST unido a sala:", roomId)
    updateOnlineStatus("Conectado! Eres Jugador 2", true)
    onlineReady = true

    showConnectedView()
    listenRoom()
  } catch (error) {
    console.error("[ONLINE] Error uniendose:", error)
    updateOnlineStatus("Error de conexion")
    alert("Error al unirse a la sala. Intenta de nuevo.")
    roomId = null
  }
}

// ===== HOST: Escuchar jugador 2 =====
function listenForPlayer2() {
  if (!roomId) return

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

  // Timeout 120s (2 minutos)
  setTimeout(() => {
    if (!onlineReady && isHost) {
      console.log("[ONLINE] Timeout - nadie se unio")
      updateOnlineStatus("Nadie se unio. Intenta de nuevo.")
      db.ref(`rooms/${roomId}`).remove()
      roomId = null
      resetOnlineUI()
    }
  }, 120000)
}

// ===== Mostrar vista conectado =====
function showConnectedView() {
  document.getElementById("crearSalaView")?.classList.add("hidden")
  document.getElementById("unirseSalaView")?.classList.add("hidden")
  document.getElementById("esperandoView")?.classList.add("hidden")
  document.getElementById("conectadoView")?.classList.remove("hidden")

  document.getElementById("miRol").textContent = isHost ? "Eres Jugador 1 (Host)" : "Eres Jugador 2 (Guest)"
  document.getElementById("p1StatusOnline").textContent = "Listo"
  document.getElementById("p2StatusOnline").textContent = "Listo"
}

// ===== Reset UI =====
function resetOnlineUI() {
  document.getElementById("crearSalaView")?.classList.remove("hidden")
  document.getElementById("unirseSalaView")?.classList.remove("hidden")
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
  if (roomId && db) {
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
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.getEnemyDistance = getEnemyDistance
window.getEnemySpeed = getEnemySpeed
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getRoomId = getRoomId
window.cleanupOnlineGame = cleanupOnlineGame
window.hostStartGame = hostStartGame

console.log("[ONLINE] Modulo online V16 cargado!")
