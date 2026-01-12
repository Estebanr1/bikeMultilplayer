/**************************************************
 * GAME.JS – V16 ONLINE SYNC (HOST AUTORITATIVO)
 **************************************************/

console.log("[GAME] Cargando V16 ONLINE SYNC")

/* ===============================
   VARIABLES GLOBALES
================================ */
let gameMode = "local"        // local | online
let isRunning = false
let raceEnded = false

const GAME_DURATION = 60      // segundos
const GOAL_DISTANCE = 1000    // metros

let onlineStartTime = null    // 🔴 TIEMPO MAESTRO
let animationFrameId = null

// Player state
const playerState = {
  p1: { clicks: 0, distance: 0, speed: 0 },
  p2: { clicks: 0, distance: 0, speed: 0 }
}

/* ===============================
   UTILIDADES
================================ */
function $(id) {
  return document.getElementById(id)
}

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"))
  $(id)?.classList.add("active")
}

/* ===============================
   TIEMPO SINCRONIZADO ONLINE
================================ */
function getOnlineElapsedSeconds() {
  if (!onlineStartTime) return 0
  return Math.floor((Date.now() - onlineStartTime) / 1000)
}

function getTimeLeft() {
  const elapsed = getOnlineElapsedSeconds()
  return Math.max(0, GAME_DURATION - elapsed)
}

/* ===============================
   INICIO DE JUEGO
================================ */
function startGame(mode) {
  console.log("[GAME] startGame:", mode)

  gameMode = mode
  raceEnded = false
  isRunning = true

  resetPlayers()
  showPage("juegoCarrera")

  if (mode === "online") {
    if (window.isGameHost?.()) {
      // HOST define el inicio REAL
      onlineStartTime = Date.now()
      window.onlineSetStartTime?.(onlineStartTime)
      console.log("[GAME] Host inicia carrera:", onlineStartTime)
    }
  }

  startLoop()
}

/* ===============================
   LOOP PRINCIPAL
================================ */
function startLoop() {
  cancelAnimationFrame(animationFrameId)

  function loop() {
    if (!isRunning) return

    updateGame()
    animationFrameId = requestAnimationFrame(loop)
  }

  loop()
}

/* ===============================
   UPDATE PRINCIPAL
================================ */
function updateGame() {
  if (raceEnded) return

  let timeLeft = GAME_DURATION

  if (gameMode === "online") {
    if (!onlineStartTime) return   // Guest espera
    timeLeft = getTimeLeft()
  }

  $("tiempoRestante").innerText = timeLeft

  updatePlayers()
  updateUI()

  if (timeLeft <= 0) {
    endGame()
  }
}

/* ===============================
   JUGADORES
================================ */
function resetPlayers() {
  playerState.p1 = { clicks: 0, distance: 0, speed: 0 }
  playerState.p2 = { clicks: 0, distance: 0, speed: 0 }
}

function registerClick(player) {
  if (!isRunning || raceEnded) return

  playerState[player].clicks++
  playerState[player].speed = 15
}

function updatePlayers() {
  for (const p of ["p1", "p2"]) {
    playerState[p].distance += playerState[p].speed * 0.1
    playerState[p].speed *= 0.92

    if (playerState[p].distance >= GOAL_DISTANCE) {
      endGame()
    }
  }

  if (gameMode === "online") {
    window.onlineSendState?.(playerState)
  }
}

/* ===============================
   UI
================================ */
function updateUI() {
  $("p1Dist").innerText = Math.floor(playerState.p1.distance) + "m"
  $("p2Dist").innerText = Math.floor(playerState.p2.distance) + "m"

  $("p1Speed").innerText = Math.floor(playerState.p1.speed) + " km/h"
  $("p2Speed").innerText = Math.floor(playerState.p2.speed) + " km/h"

  updateBikePosition("player1Container", playerState.p1.distance)
  updateBikePosition("player2Container", playerState.p2.distance)
}

function updateBikePosition(id, distance) {
  const percent = Math.min(100, (distance / GOAL_DISTANCE) * 100)
  $(id).style.bottom = percent + "%"
}

/* ===============================
   FIN DE JUEGO
================================ */
function endGame() {
  if (raceEnded) return

  raceEnded = true
  isRunning = false
  cancelAnimationFrame(animationFrameId)

  console.log("[GAME] Carrera finalizada")

  showResults()
}

function showResults() {
  showPage("resultados")

  let winner = "Empate"

  if (playerState.p1.distance > playerState.p2.distance) {
    winner = "Jugador 1"
  } else if (playerState.p2.distance > playerState.p1.distance) {
    winner = "Jugador 2"
  }

  $("winnerText").innerText = winner
}

/* ===============================
   EVENTOS
================================ */
window.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM READY")

  $("btnP1Click")?.addEventListener("click", () => registerClick("p1"))
  $("btnP2Click")?.addEventListener("click", () => registerClick("p2"))
})

/* ===============================
   ONLINE CALLBACKS
================================ */

// 🔵 Guest recibe orden REAL de inicio
window.onOnlineStart = (startTime) => {
  console.log("[GAME] Online start recibido:", startTime)
  onlineStartTime = startTime
  startGame("online")
}

// 🔵 Guest recibe estado rival
window.onOnlineState = (state) => {
  playerState.p2 = state.p2
}

console.log("[GAME] V16 ONLINE SYNC cargado")
