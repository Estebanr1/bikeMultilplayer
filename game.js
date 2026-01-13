console.log("[GAME] Cargando V16 ONLINE SYNC")

let mode = "single"
let gameRunning = false
let startTimestamp = null

let clicks = 0
let distance = 0
let speed = 0

// ===== START GAME =====
function startGame(selectedMode) {
  mode = selectedMode
  gameRunning = true
  clicks = 0
  distance = 0
  speed = 0

  document.getElementById("inicio").classList.remove("active")
  document.getElementById("paginaOnline").classList.remove("active")
  document.getElementById("juegoCarrera").classList.add("active")

  if (mode === "online") {
    firebase.database().ref(`rooms/${roomId}/startTime`).once("value").then((snap) => {
      startTimestamp = snap.val()
      startTimer()
    })
  } else {
    startTimestamp = Date.now()
    startTimer()
  }
}

// ===== TIMER (SYNC ONLINE) =====
function startTimer() {
  const tiempoEl = document.getElementById("tiempoRestante")

  const interval = setInterval(() => {
    if (!gameRunning) {
      clearInterval(interval)
      return
    }

    const elapsed = Math.floor((Date.now() - startTimestamp) / 1000)
    const remaining = Math.max(0, 60 - elapsed)

    tiempoEl.textContent = remaining

    if (remaining <= 0) {
      endGame()
      clearInterval(interval)
    }
  }, 250)
}

// ===== INPUT =====
function handleClick() {
  if (!gameRunning) return

  clicks++
  speed = 20
  distance += 5

  updateUI()

  if (mode === "online") {
    firebase.database().ref(`rooms/${roomId}/players/${playerId}`).update({
      clicks,
      distance,
      speed,
    })
  }
}

// ===== UPDATE UI =====
function updateUI() {
  document.getElementById("p1Dist").textContent = distance + "m"
  document.getElementById("p1Speed").textContent = speed + " km/h"
}

// ===== ENEMY =====
window.updateEnemyDisplay = function (enemy) {
  document.getElementById("p2Dist").textContent = enemy.distance + "m"
  document.getElementById("p2Speed").textContent = enemy.speed + " km/h"
}

// ===== END =====
function endGame() {
  gameRunning = false
  document.getElementById("juegoCarrera").classList.remove("active")
  document.getElementById("resultados").classList.add("active")
}

// ===== EVENTS =====
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnP1Click").onclick = handleClick
  document.getElementById("btnIniciarOnline").onclick = () => {
    if (window.startOnlineGame) {
      window.startOnlineGame()
    }
  }
})

window.startGame = startGame

console.log("[GAME] V16 ONLINE SYNC cargado")
