console.log("[ONLINE] Cargando modulo online V16 FIX")

// ===== Firebase config (YA EXISTENTE EN TU PROYECTO) =====
// firebase.initializeApp(firebaseConfig)

const db = firebase.database()

// ===== Estado =====
let roomId = null
let playerId = "p" + Math.floor(Math.random() * 100000)
let isHost = false
let gameStarted = false

console.log("[ONLINE] Player ID:", playerId)

// ===== Utils =====
function isGameHost() {
  return isHost === true
}

// ===== Crear sala =====
function createRoom() {
  roomId = Math.random().toString(36).substring(2, 6).toUpperCase()
  isHost = true

  db.ref(`rooms/${roomId}`).set({
    state: "waiting",
    host: playerId,
    players: {
      [playerId]: {
        clicks: 0,
        distance: 0,
        speed: 0,
      },
    },
  })

  document.getElementById("codigoSala").textContent = roomId
  document.getElementById("salaConectada").textContent = roomId

  showCrearSala()
  listenRoomState()
  listenPlayers()
}

// ===== Unirse a sala =====
function joinRoom(code) {
  roomId = code.toUpperCase()
  isHost = false

  db.ref(`rooms/${roomId}`).once("value").then((snap) => {
    if (!snap.exists()) {
      alert("Sala no existe")
      return
    }

    db.ref(`rooms/${roomId}/players/${playerId}`).set({
      clicks: 0,
      distance: 0,
      speed: 0,
    })

    document.getElementById("salaConectada").textContent = roomId

    showConectado()
    listenRoomState()
    listenPlayers()
  })
}

// ===== UI =====
function showCrearSala() {
  document.getElementById("opcionesView").classList.add("hidden")
  document.getElementById("crearSalaView").classList.remove("hidden")
}

function showConectado() {
  document.getElementById("opcionesView").classList.add("hidden")
  document.getElementById("crearSalaView").classList.add("hidden")
  document.getElementById("unirseSalaView").classList.add("hidden")
  document.getElementById("conectadoView").classList.remove("hidden")

  const btn = document.getElementById("btnIniciarOnline")
  if (isHost) {
    btn.style.display = "block"
    btn.disabled = false
  } else {
    btn.style.display = "none"
  }
}

// ===== Iniciar carrera (SOLO HOST) =====
function startOnlineGame() {
  if (!isHost) return

  db.ref(`rooms/${roomId}`).update({
    state: "playing",
    startTime: firebase.database.ServerValue.TIMESTAMP,
  })
}

// ===== Escuchar estado de sala =====
function listenRoomState() {
  db.ref(`rooms/${roomId}/state`).on("value", (snap) => {
    if (snap.val() === "playing" && !gameStarted) {
      gameStarted = true
      if (window.startGame) {
        window.startGame("online")
      }
    }
  })
}

// ===== Escuchar jugadores =====
function listenPlayers() {
  db.ref(`rooms/${roomId}/players`).on("value", (snap) => {
    if (!snap.exists()) return

    const players = snap.val()

    for (const id in players) {
      if (id !== playerId) {
        if (window.updateEnemyDisplay) {
          window.updateEnemyDisplay(players[id])
        }
      }
    }
  })
}

// ===== Exponer =====
window.createRoom = createRoom
window.joinRoom = joinRoom
window.startOnlineGame = startOnlineGame
window.isGameHost = isGameHost

console.log("[ONLINE] Modulo online V16 FIX listo")
