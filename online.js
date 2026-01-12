// ===== ONLINE.JS - V16 HOST AUTHORITY (SINCRONIZACION POR STARTTIME) =====
console.log("[ONLINE] Cargando modulo online V16 HOST AUTHORITY...")

// Firebase config
const firebaseConfig = {
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
}

const firebase = window.firebase
let db

try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }
  db = firebase.database()
  console.log("[ONLINE] Firebase conectado")
} catch (error) {
  console.error("[ONLINE] Error Firebase:", error)
}

// Estado
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let gameStarted = false
let startTime = null
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== CREAR SALA (HOST) =====
async function createRoom() {
  if (!db) {
    alert("Firebase no conectado")
    return
  }

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true
  onlineReady = false
  gameStarted = false
  startTime = null

  console.log("[ONLINE] HOST creando sala:", roomId)

  try {
    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      status: "waiting",
      gameStarted: false,
      startTime: null,
      players: {
        [playerId]: { speed: 0, distance: 0 },
      },
    })

    // Actualizar UI
    document.getElementById("codigoSala").textContent = roomId
    document.getElementById("opcionesView")?.classList.add("hidden")
    document.getElementById("crearSalaView")?.classList.remove("hidden")

    console.log("[ONLINE] Sala creada, esperando rival...")
    listenRoom()
  } catch (error) {
    console.error("[ONLINE] Error creando sala:", error)
    alert("Error creando sala")
  }
}

// ===== UNIRSE A SALA (GUEST) =====
async function joinRoom(codigo) {
  if (!db) {
    alert("Firebase no conectado")
    return false
  }

  codigo = codigo.toUpperCase().trim()
  console.log("[ONLINE] GUEST intentando unirse a:", codigo)

  try {
    const snap = await db.ref(`rooms/${codigo}`).once("value")

    if (!snap.exists()) {
      console.log("[ONLINE] Sala no existe:", codigo)
      alert("Sala '" + codigo + "' no existe. Verifica el codigo.")
      return false
    }

    const room = snap.val()

    if (room.status !== "waiting") {
      alert("Esta sala ya tiene partida en curso")
      return false
    }

    const playerCount = room.players ? Object.keys(room.players).length : 0
    if (playerCount >= 2) {
      alert("Sala llena")
      return false
    }

    const statusRef = db.ref(`rooms/${codigo}/status`)
    const result = await statusRef.transaction((current) => {
      if (current === "waiting") return "ready"
      return undefined // Abortar
    })

    if (!result.committed) {
      alert("Otro jugador se unio primero")
      return false
    }

    // Unirse exitosamente
    roomId = codigo
    isHost = false
    onlineReady = true

    await db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
    })

    console.log("[ONLINE] GUEST unido exitosamente")

    // Actualizar UI
    document.getElementById("salaConectada").textContent = roomId
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("conectadoView")?.classList.remove("hidden")
    document.getElementById("p1StatusOnline").textContent = "Host"
    document.getElementById("p2StatusOnline").textContent = "Tu (Guest)"

    const btnIniciar = document.getElementById("btnIniciarOnline")
    if (btnIniciar) {
      btnIniciar.textContent = "Esperando que Host inicie..."
      btnIniciar.disabled = true
      btnIniciar.classList.add("opacity-50", "cursor-not-allowed")
    }

    listenRoom()
    return true
  } catch (error) {
    console.error("[ONLINE] Error uniendose:", error)
    alert("Error al unirse")
    return false
  }
}

// ===== ESCUCHAR SALA =====
function listenRoom() {
  if (!roomId || !db) return

  console.log("[ONLINE] Escuchando sala:", roomId)

  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) {
      console.log("[ONLINE] Sala eliminada")
      return
    }

    const room = snap.val()
    const players = room.players || {}
    const playerCount = Object.keys(players).length

    // HOST: detectar cuando se une el guest
    if (isHost && playerCount === 2 && !onlineReady) {
      onlineReady = true
      console.log("[ONLINE] HOST: Rival conectado!")

      document.getElementById("crearSalaView")?.classList.add("hidden")
      document.getElementById("conectadoView")?.classList.remove("hidden")
      document.getElementById("salaConectada").textContent = roomId
      document.getElementById("p1StatusOnline").textContent = "Tu (Host)"
      document.getElementById("p2StatusOnline").textContent = "Guest conectado"

      const btnIniciar = document.getElementById("btnIniciarOnline")
      if (btnIniciar) {
        btnIniciar.textContent = "Iniciar Carrera"
        btnIniciar.disabled = false
        btnIniciar.classList.remove("opacity-50", "cursor-not-allowed")
      }
    }

    // Actualizar estado del enemigo
    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        window.updateEnemyDisplay?.(enemyState)
      }
    }

    if (!isHost && room.gameStarted && room.startTime && !gameStarted) {
      gameStarted = true
      startTime = room.startTime
      console.log("[ONLINE] GUEST: Juego iniciado por HOST, startTime:", startTime)

      // Llamar al callback del game.js con el startTime
      window.startOnlineRace?.(startTime)
    }
  })
}

// ===== HOST INICIA JUEGO =====
function hostStartGame() {
  if (!isHost || !roomId || !onlineReady) {
    console.log("[ONLINE] No se puede iniciar:", { isHost, roomId, onlineReady })
    return null
  }

  startTime = Date.now()
  gameStarted = true

  console.log("[ONLINE] HOST iniciando juego con startTime:", startTime)

  db.ref(`rooms/${roomId}`).update({
    gameStarted: true,
    startTime: startTime,
  })

  return startTime
}

// ===== ENVIAR ESTADO =====
function sendOnlineState(speed, distance) {
  if (!roomId || !db) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: speed || 0,
    distance: distance || 0,
  })
}

// ===== GETTERS =====
function isOnlineGameReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}
function getRoomId() {
  return roomId
}
function getStartTime() {
  return startTime
}
function getEnemyState() {
  return enemyState
}

// ===== CLEANUP =====
function cleanupOnlineGame() {
  if (roomId && db) {
    db.ref(`rooms/${roomId}/players/${playerId}`).remove()
    if (isHost) {
      db.ref(`rooms/${roomId}`).remove()
    }
  }
  roomId = null
  isHost = false
  onlineReady = false
  gameStarted = false
  startTime = null
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== EXPONER GLOBALMENTE =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.hostStartGame = hostStartGame
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getRoomId = getRoomId
window.getStartTime = getStartTime
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo V16 HOST AUTHORITY listo!")
