// ===== ONLINE.JS - V16 FINAL FIXED =====
console.log("[ONLINE] Cargando modulo online V16 FINAL FIXED")

// ===============================
// Firebase init (UNA SOLA VEZ)
// ===============================
const firebase = require("firebase/app")
require("firebase/database")
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
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let gameStarted = false
let startTime = null

let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===============================
// Crear sala (HOST)
// ===============================
async function createRoom() {
  try {
    isHost = true
    onlineReady = false
    gameStarted = false
    startTime = null
    roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

    console.log("[ONLINE] HOST - Sala creada:", roomId)

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

    const codeEl = document.getElementById("codigoSala")
    if (codeEl) codeEl.textContent = roomId

    listenRoom()
    return true
  } catch (err) {
    console.error("[ONLINE] Error creando sala:", err)
    alert("Error creando sala")
    return false
  }
}

// ===============================
// Unirse a sala (GUEST)
// ===============================
async function joinRoom(code) {
  const codigo = code.toUpperCase().trim()
  console.log("[ONLINE] GUEST intentando unirse a:", codigo)

  try {
    const ref = db.ref(`rooms/${codigo}`)
    const snap = await ref.once("value")

    // Verificar que la sala existe
    if (!snap.exists()) {
      console.log("[ONLINE] Sala NO existe:", codigo)
      alert("Sala '" + codigo + "' no existe. Verifica el codigo.")
      return false
    }

    const room = snap.val()
    const players = room.players || {}
    const playerCount = Object.keys(players).length

    // Verificar que no este llena
    if (playerCount >= 2) {
      console.log("[ONLINE] Sala llena:", codigo)
      alert("Sala llena - ya hay 2 jugadores")
      return false
    }

    // Verificar status
    if (room.status !== "waiting") {
      console.log("[ONLINE] Sala no esta esperando:", room.status)
      alert("Esta sala ya tiene partida en curso")
      return false
    }

    // Unirse exitosamente
    roomId = codigo
    isHost = false
    onlineReady = false
    gameStarted = false

    await db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
    })

    // Actualizar status a ready
    await db.ref(`rooms/${roomId}/status`).set("ready")

    console.log("[ONLINE] GUEST unido exitosamente a sala:", roomId)

    listenRoom()
    return true
  } catch (err) {
    console.error("[ONLINE] Error uniendose:", err)
    alert("Error al unirse a la sala")
    return false
  }
}

// ===============================
// Escuchar sala completa
// ===============================
function listenRoom() {
  console.log("[ONLINE] Escuchando sala:", roomId)

  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) {
      console.log("[ONLINE] Sala eliminada")
      return
    }

    const room = snap.val()
    const players = room.players || {}
    const ids = Object.keys(players)
    const playerCount = ids.length

    // Detectar cuando hay 2 jugadores
    if (playerCount === 2 && !onlineReady) {
      onlineReady = true
      console.log("[ONLINE] 2 jugadores conectados!")

      if (isHost) {
        // HOST: mostrar vista conectado y habilitar boton
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
      } else {
        // GUEST: deshabilitar boton, esperar que host inicie
        document.getElementById("p1StatusOnline").textContent = "Host"
        document.getElementById("p2StatusOnline").textContent = "Tu (Guest)"

        const btnIniciar = document.getElementById("btnIniciarOnline")
        if (btnIniciar) {
          btnIniciar.textContent = "Esperando que Host inicie..."
          btnIniciar.disabled = true
          btnIniciar.classList.add("opacity-50", "cursor-not-allowed")
        }
      }
    }

    // GUEST: detectar cuando HOST inicia el juego
    if (!isHost && room.gameStarted && room.startTime && !gameStarted) {
      gameStarted = true
      startTime = room.startTime
      console.log("[ONLINE] GUEST: Host inicio el juego, startTime:", startTime)

      // Iniciar carrera con el tiempo del host
      if (typeof window.startOnlineRace === "function") {
        window.startOnlineRace(startTime)
      }
    }

    // Actualizar estado del enemigo
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
// HOST inicia el juego
// ===============================
function hostStartGame() {
  if (!isHost || !roomId || !onlineReady) {
    console.log("[ONLINE] No puede iniciar:", { isHost, roomId, onlineReady })
    return null
  }

  startTime = Date.now()
  gameStarted = true

  console.log("[ONLINE] HOST iniciando juego, startTime:", startTime)

  db.ref(`rooms/${roomId}`).update({
    gameStarted: true,
    startTime: startTime,
  })

  return startTime
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
function getStartTime() {
  return startTime
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
  gameStarted = false
  startTime = null
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===============================
// Exponer API
// ===============================
window.createRoom = createRoom
window.joinRoom = joinRoom
window.hostStartGame = hostStartGame
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getRoomId = getRoomId
window.getStartTime = getStartTime
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V16 FINAL FIXED cargado")
