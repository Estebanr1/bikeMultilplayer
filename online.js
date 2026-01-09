let roomId = null
let playerId = null
let isHost = false
let onlineReady = false
let gameStarted = false

// ===== ONLINE.JS – V16 STABLE =====
console.log("[ONLINE] Cargando modulo online V16 STABLE")


// Firebase init
firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

// Estado online
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ===== Crear sala =====
async function createRoom() {
  try {
    isHost = true
    gameStarted = false

    roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
    console.log("[ONLINE] HOST - Sala creada:", roomId)

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      gameStarted: false,
      players: {
        [playerId]: { speed: 0, distance: 0 },
      },
    })

    // 🔴 ESTO ES CLAVE
    const codeEl = document.getElementById("codigoSala")
    if (codeEl) {
      codeEl.textContent = roomId
    } else {
      console.error("[ONLINE] codigoSala no existe en el DOM")
    }

    listenPlayers()
  } catch (err) {
    console.error("[ONLINE] Error creando sala:", err)
    alert("Error creando sala")
  }
}


// ===== Unirse a sala =====
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

  const data = snap.val()
  const players = data.players || {}

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
  listenPlayers()
}

// ===== Escuchar jugadores =====
// ===== Escuchar jugadores =====
function listenPlayers() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    const playerCount = Object.keys(players).length

    onlineReady = playerCount === 2

    const started = room.gameStarted === true

    // 🔹 HOST: si hay 2 jugadores y aún no inició, inicia
    if (onlineReady && isHost && !started) {
      console.log("[ONLINE] Host detecta 2 jugadores. Iniciando juego...")

      db.ref(`rooms/${roomId}`).update({
        gameStarted: true,
      })

      // Avisar al game.js
      if (typeof window.onOnlineReady === "function") {
        window.onOnlineReady()
      }
    }

    // 🔹 Actualizar enemigo
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


// ===== Enviar estado =====
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed,
    distance,
    t: Date.now(),
  })
}

// ===== Host inicia carrera =====
function hostStartGame() {
  if (!roomId || !isHost) return
  db.ref(`rooms/${roomId}/gameStarted`).set(true)
}

// ===== Escuchar inicio =====
db.ref("rooms").on("child_changed", (snap) => {
  const data = snap.val()
  if (data?.gameStarted && roomId === snap.key && !isHost) {
    if (typeof window.startOnlineRace === "function") {
      window.startOnlineRace()
    }
  }
})

// ===== Getters =====
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
    if (isHost) db.ref(`rooms/${roomId}`).remove()
  }
  roomId = null
  onlineReady = false
  isHost = false
}

window.addEventListener("beforeunload", cleanupOnlineGame)

// ===== Exponer =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.hostStartGame = hostStartGame
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V16 STABLE cargado")
