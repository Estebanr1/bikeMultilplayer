// ===== GAME.JS V16 CLEAN =====
console.log("[GAME] Cargando V16 CLEAN")

let mode = null
let gameRunning = false

document.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM READY")

  const btnCrear = document.getElementById("btnCrearSala")
  const btnUnirse = document.getElementById("btnConectarSala")
  const btnIniciar = document.getElementById("btnIniciarOnline")

  btnCrear.onclick = async () => {
    const code = await window.createRoom()
    document.getElementById("codigoSala").textContent = code
    document.getElementById("crearSalaView").classList.remove("hidden")
    document.getElementById("opcionesView").classList.add("hidden")
  }

  btnUnirse.onclick = async () => {
    const code = document.getElementById("inputCodigoSala").value
    const ok = await window.joinRoom(code)
    if (!ok) {
      alert("No se pudo unir")
      return
    }
    document.getElementById("salaConectada").textContent = code
    document.getElementById("unirseSalaView").classList.add("hidden")
    document.getElementById("conectadoView").classList.remove("hidden")
    btnIniciar.style.display = "none"
  }

  btnIniciar.onclick = () => {
    if (!window.isGameHost()) return
    window.hostStartGame()
  }
})

// ===== Eventos desde online.js =====
window.onOnlineReady = (isHost) => {
  document.getElementById("conectadoView").classList.remove("hidden")
  document.getElementById("btnIniciarOnline").style.display = isHost
    ? "block"
    : "none"
}

window.onOnlineGameStart = () => {
  startGame()
}

// ===== Juego =====
function startGame() {
  if (gameRunning) return
  gameRunning = true
  console.log("[GAME] Carrera iniciada")

  document.getElementById("paginaOnline").classList.remove("active")
  document.getElementById("juegoCarrera").classList.add("active")
}

// ===== Loop ejemplo =====
function gameLoop() {
  if (!gameRunning) return

  // ejemplo de datos
  const speed = Math.random() * 30
  const distance = Math.random() * 100

  window.sendOnlineState(speed, distance)

  const enemy = window.getEnemyState()
  // acá tu render existente
}

setInterval(gameLoop, 100)

console.log("[GAME] V16 CLEAN listo")
