// ===== ONLINE.JS - V16 FIREBASE MATCHMAKING (FIXED) =====
console.log("[ONLINE] Cargando modulo online V16 FIX...")

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
  console.log("[ONLINE] Firebase inicializado correctamente")
} catch (error) {
  console.error("[ONLINE] Error inicializando Firebase:", error)
}

// ===== Estado =====
let roomId = null
const playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let enemyState = { speed: 0, distance: 0 }
let onlineReady = false
let gameStarted = false

console.log("[ONLINE] Mi ID:", playerId)

// ===== UI =====
function updateOnlineStatus(message, isConnected = false) {
  console.log("[ONLINE]", message)
  const el = document.getElementById("onlineStatus")
  if (el) {
    el.textContent = message
    el.className = isConnected
      ? "online-status connected"
      : "online-status waiting"
  }
}

// ===== CREAR SALA =====
async function createRoom() {
  if (!db) return alert("Firebase no conectado")

  updateOnlineStatus("Creando sala...")

  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true

  try {
    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      status: "waiting",
      gameStarted: false,
      players: {
        [playerId]: {
          speed: 0,
          distance: 0,
          ready: true,
        },
      },
    })

    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("esperandoView")?.classList.remove("hidden")
    document.getElementById("salaId").textContent = roomId

    updateOnlineStatus("Sala creada. Esperando rival...")
    console.log("[ONLINE] HOST sala:", roomId)

    listenForPlayer2()
  } catch (e) {
    console.error(e)
    updateOnlineStatus("Error creando sala")
  }
}

// ===== UNIRSE A SALA (FIX REAL) =====
async function joinRoom(codigo) {
  if (!db) return alert("Firebase no conectado")

  codigo = codigo?.toUpperCase().trim()
  if (!codigo || codigo.length < 4) {
    alert("Código inválido")
    return
  }

  updateOnlineStatus("Verificando sala...")

  try {
    const roomRef = db.ref(`rooms/${codigo}`)
    const snap = await roomRef.once("value")

    if (!snap.exists()) {
      updateOnlineStatus("Sala no existe")
      return
    }

    const room = snap.val()
    console.log("[ONLINE] Sala encontrada:", room)

    const players = room.players || {}
    const count = Object.keys(players).length

    if (count >= 2) {
      updateOnlineStatus("Sala llena")
      return
    }

    // === UNIÓN LIMPIA ===
    roomId = codigo
    isHost = false

    await db.ref(`rooms/${roomId}/players/${playerId}`).set({
      speed: 0,
      distance: 0,
      ready: true,
    })

    // marcar sala activa
    await db.ref(`rooms/${roomId}`).update({
      status: "playing",
      gameStarted: true,
    })

    onlineReady = true
    updateOnlineStatus("Conectado! Jugador 2", true)

    showConnectedView()
    listenRoom()
  } catch (e) {
    console.error(e)
    updateOnlineStatus("Error al unirse")
  }
}

// ===== HOST escucha jugador 2 =====
function listenForPlayer2() {
  if (!roomId) return

  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()
    const ids = Object.keys(players)

    if (ids.length === 2 && !onlineReady) {
      onlineReady = true
      updateOnlineStatus("Rival conectado! Jugador 1", true)
      showConnectedView()
      listenRoom()
    }
  })
}

// ===== UI conectado =====
function showConnectedView() {
  document.getElementById("crearSalaView")?.classList.add("hidden")
  document.getElementById("unirseSalaView")?.classList.add("hidden")
  document.getElementById("esperandoView")?.classList.add("hidden")
  document.getElementById("conectadoView")?.classList.remove("hidden")

  document.getElementById("miRol").textContent =
    isHost ? "Jugador 1 (Host)" : "Jugador 2"
}

// ===== SYNC =====
function listenRoom() {
  if (!roomId) return

  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return
    const players = snap.val()
    for (const id in players) {
      if (id !== playerId) enemyState = players[id]
    }
  })
}

// ===== ENVIAR ESTADO =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return
  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
    t: Date.now(),
  })
}

// ===== GETTERS =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.getEnemyDistance = () => enemyState.distance || 0
window.getEnemySpeed = () => enemyState.speed || 0
window.isOnlineGameReady = () => onlineReady
window.isGameHost = () => isHost
window.getRoomId = () => roomId

console.log("[ONLINE] Modulo online FIX cargado")
