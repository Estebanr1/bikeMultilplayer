// ===== GAME.JS – V16 ESTABLE =====
console.log("[GAME] Cargando V16 ESTABLE")

let gameActive = false
let gameMode = null
let timer = null
let timeLeft = 60

let player1 = { speed: 0, distance: 0 }
let player2 = { speed: 0, distance: 0 }

// ===== UI =====
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.remove("active")
    p.classList.add("hidden")
  })
  const page = document.getElementById(id)
  page?.classList.remove("hidden")
  page?.classList.add("active")
}

// ===== JUEGO =====
function startGame(mode) {
  console.log("[GAME] startGame:", mode)

  gameMode = mode
  gameActive = true
  timeLeft = 60

  player1 = { speed: 0, distance: 0 }
  player2 = { speed: 0, distance: 0 }

  showPage("juegoCarrera")

  clearInterval(timer)
  timer = setInterval(() => {
    timeLeft--
    document.getElementById("tiempoRestante").textContent = timeLeft
    if (timeLeft <= 0) endGame()
  }, 1000)
}

function endGame() {
  console.log("[GAME] endGame")
  gameActive = false
  clearInterval(timer)
  showPage("resultados")
}

// ===== ONLINE =====
window.startOnlineRace = () => {
  console.log("[GAME] startOnlineRace recibido")
  startGame("online")
}

window.updateEnemyDisplay = (enemy) => {
  if (!gameActive) return
  player2.distance = enemy.distance || 0
  player2.speed = enemy.speed || 0
}

// ===== EVENTOS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM READY")

  document.getElementById("btnLocal")?.addEventListener("click", () => {
    showPage("seleccionModo")
  })

  document.getElementById("btnOnline")?.addEventListener("click", () => {
    showPage("paginaOnline")
  })

  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      startGame(btn.dataset.mode)
    })
  })

  document.getElementById("btnCrearSala")?.addEventListener("click", () => {
    document.getElementById("opcionesView").classList.add("hidden")
    document.getElementById("crearSalaView").classList.remove("hidden")
    window.createRoom?.()
  })

  document.getElementById("btnUnirseSala")?.addEventListener("click", () => {
    document.getElementById("opcionesView").classList.add("hidden")
    document.getElementById("unirseSalaView").classList.remove("hidden")
  })

  document.getElementById("btnConectarSala")?.addEventListener("click", () => {
    const code = document.getElementById("inputCodigoSala").value
    window.joinRoom?.(code)
    document.getElementById("unirseSalaView").classList.add("hidden")
    document.getElementById("conectadoView").classList.remove("hidden")
  })

  document.getElementById("btnIniciarOnline")?.addEventListener("click", () => {
    if (window.isGameHost?.()) {
      window.hostStartGame?.()
    }
  })

  document.getElementById("btnPlayAgain")?.addEventListener("click", () => {
    showPage("inicio")
  })

  document.getElementById("btnBackHome")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    showPage("inicio")
  })
})

console.log("[GAME] V16 ESTABLE cargado")
