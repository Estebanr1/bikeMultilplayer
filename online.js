// ===== ONLINE.JS – V17 HOST CONTROLA INICIO =====
console.log("[ONLINE] Cargando modulo online V17")

// ---------- Firebase ----------
firebase.initializeApp({
  databaseURL: "https://bicigame-a06d7-default-rtdb.firebaseio.com",
})

const db = firebase.database()

// ---------- Estado ----------
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let onlineReady = false
let enemyState = { speed: 0, distance: 0 }

console.log("[ONLINE] Player ID:", playerId)

// ---------- Crear sala (HOST) ----------
async function createRoom() {
  try {
    isHost = true
    onlineReady = false

    roomId = Math.random().toString(36).substring(2, 6).toUpperCase()

    await db.ref(`rooms/${roomId}`).set({
      created: Date.now(),
      host: playerId,
      gameStarted: false,
      startTime: null,
      players: {
        [playerId]: { speed: 0, distance: 0 },
      },
    })

    console.log("[ONLINE] HOST - Sala creada:", roomId)

    // Mostrar código en UI
    const el = document.getElementById("codigoSala")
    if (el) el.textContent = roomId

    listenRoom()
  } catch (e) {
    console.error("[ONLINE] Error creando sala:", e)
    alert("Error creando sala")
  }
}

// ---------- Unirse a sala (GUEST) ----------
async function joinRoom(code) {
  try {
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

    console.log("[ONLINE] GUEST unido a sala:", roomId)

    listenRoom()
  } catch (e) {
    console.error("[ONLINE] Error uniéndose:", e)
    alert("Error al unirse")
  }
}

// ---------- Escuchar sala (HOST y GUEST) ----------
function listenRoom() {
  db.ref(`rooms/${roomId}`).on("value", (snap) => {
    if (!snap.exists()) return

    const room = snap.val()
    const players = room.players || {}
    const playerCount = Object.keys(players).length

    onlineReady = playerCount === 2

    // --- Actualizar enemigo ---
    for (const id in players) {
      if (id !== playerId) {
        enemyState = players[id]
        if (typeof window.updateEnemyDisplay === "function") {
          window.updateEnemyDisplay(enemyState)
        }
      }
    }

    // --- Inicio sincronizado ---
    if (room.gameStarted && room.startTime) {
      if (typeof window.startOnlineRace === "function") {
        window.startOnlineRace(room.startTime)
      }
    }
  })
}

// ---------- HOST inicia el juego ----------
function hostStartGame() {
  if (!roomId || !isHost || !onlineReady) return

  const now = Date.now()

  console.log("[ONLINE] HOST inicia la carrera")

  db.ref(`rooms/${roomId}`).update({
    gameStarted: true,
    startTime: now,
  })
}

// ---------- Enviar estado ----------
function sendOnlineState(speed, distance) {
  if (!roomId || !onlineReady) return

  db.ref(`rooms/${roomId}/players/${playerId}`).update({
    speed: speed || 0,
    distance: distance || 0,
    t: Date.now(),
  })
}

// ---------- Getters ----------
function isOnlineGameReady() {
  return onlineReady
}
function isGameHost() {
  return isHost
}
function getEnemySpeed() {
  return enemyState.speed || 0
}
function getEnemyDistance() {
  return enemyState.distance || 0
}

// ---------- Cleanup ----------
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

// ---------- Exponer ----------
window.createRoom = createRoom
window.joinRoom = joinRoom
window.hostStartGame = hostStartGame
window.sendOnlineState = sendOnlineState
window.isOnlineGameReady = isOnlineGameReady
window.isGameHost = isGameHost
window.getEnemySpeed = getEnemySpeed
window.getEnemyDistance = getEnemyDistance
window.cleanupOnlineGame = cleanupOnlineGame

console.log("[ONLINE] Modulo online V17 listo")
