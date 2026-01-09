// ===== GAME.JS - V17 ONLINE SYNC =====
console.log("[GAME] Cargando V17 ONLINE SYNC")

// ===== ESTADO GLOBAL =====
const gameState = {
  gameActive: false,
  gameMode: null,

  raceDuration: 60, // segundos
  startTime: null,
  timerInterval: null,

  raceDistance: 1000,

  player1: { velocidad: 0, distancia: 0, clicks: 0, position: 0 },
  player2: { velocidad: 0, distancia: 0, clicks: 0, position: 0 },
}

// ===== UTIL =====
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"))
  document.getElementById(id)?.classList.remove("hidden")
}

// ===== DISPLAY =====
function updateDisplay() {
  const p1 = gameState.player1
  const p2 = gameState.player2

  document.getElementById("p1Speed").textContent = `${Math.round(p1.velocidad)} km/h`
  document.getElementById("p1Dist").textContent = `${Math.round(p1.distancia)} m`
  document.getElementById("p2Speed").textContent = `${Math.round(p2.velocidad)} km/h`
  document.getElementById("p2Dist").textContent = `${Math.round(p2.distancia)} m`

  document.getElementById("p1ProgressFill").style.width = `${p1.position}%`
  document.getElementById("p2ProgressFill").style.width = `${p2.position}%`
}

// ===== TIMER SINCRONIZADO =====
function startSyncedTimer(startTime) {
  gameState.startTime = startTime

  gameState.timerInterval = setInterval(() => {
    const now = Date.now()
    const elapsed = Math.floor((now - gameState.startTime) / 1000)
    const remaining = Math.max(0, gameState.raceDuration - elapsed)

    document.getElementById("tiempoRestante").textContent = remaining

    if (remaining <= 0) {
      endGame()
    }
  }, 250)
}

// ===== INPUT =====
function handlePlayerInput() {
  if (!gameState.gameActive) return

  const p = gameState.player1

  p.clicks++
  p.velocidad = Math.min(45, p.velocidad + 5)
  p.distancia = Math.min(gameState.raceDistance, p.distancia + p.velocidad / 5)
  p.position = (p.distancia / gameState.raceDistance) * 100

  if (typeof window.sendOnlineState === "function") {
    window.sendOnlineState(p.velocidad, p.distancia)
  }

  updateDisplay()

  if (p.distancia >= gameState.raceDistance) {
    endGame()
  }
}

// ===== ENEMIGO ONLINE =====
window.updateEnemyDisplay = (enemy) => {
  if (!gameState.gameActive) return

  const p = gameState.player2

  p.velocidad = enemy.speed || 0
  p.distancia = enemy.distance || 0
  p.position = (p.distancia / gameState.raceDistance) * 100

  updateDisplay()
}

// ===== INICIO ONLINE (HOST Y GUEST) =====
window.startOnlineRace = (startTime) => {
  console.log("[GAME] Carrera online iniciada", startTime)

  resetGameState()
  gameState.gameMode = "online"
  gameState.gameActive = true

  showPage("juegoCarrera")
  startSyncedTimer(startTime)
}

// ===== RESET =====
function resetGameState() {
  clearInterval(gameState.timerInterval)

  gameState.player1 = { velocidad: 0, distancia: 0, clicks: 0, position: 0 }
  gameState.player2 = { velocidad: 0, distancia: 0, clicks: 0, position: 0 }
}

// ===== FIN =====
function endGame() {
  if (!gameState.gameActive) return

  gameState.gameActive = false
  clearInterval(gameState.timerInterval)

  showPage("resultados")

  let winner = "EMPATE"
  if (gameState.player1.distancia > gameState.player2.distancia) winner = "GANASTE"
  if (gameState.player2.distancia > gameState.player1.distancia) winner = "PERDISTE"

  document.getElementById("winnerText").textContent = winner
}

// ===== EVENTOS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM READY")

  document.getElementById("btnP1Click")?.addEventListener("click", handlePlayerInput)

  document.getElementById("btnIniciarOnline")?.addEventListener("click", () => {
    if (window.isGameHost?.() && window.isOnlineGameReady?.()) {
      window.hostStartGame()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") handlePlayerInput()
  })
})

console.log("[GAME] V17 ONLINE SYNC cargado")
