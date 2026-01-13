console.log("[GAME] Cargando V16 ONLINE SYNC")

let gameRunning = false
let startTime = 0
let distance = 0
let speed = 0

function startGame(mode) {
  gameRunning = true
  distance = 0
  speed = 0

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"))
  document.getElementById("juegoCarrera").classList.add("active")

  firebase.database().ref(`rooms/${roomId}/startTime`).once("value").then(snap => {
    startTime = snap.val() || Date.now()
    runTimer()
  })
}

function runTimer() {
  const el = document.getElementById("tiempoRestante")

  const i = setInterval(() => {
    if (!gameRunning) {
      clearInterval(i)
      return
    }

    const t = Math.floor((Date.now() - startTime) / 1000)
    const r = Math.max(0, 60 - t)
    el.textContent = r

    if (r <= 0) {
      gameRunning = false
    }
  }, 200)
}

function handleClick() {
  if (!gameRunning) return

  distance += 5
  speed = 20

  document.getElementById("p1Dist").textContent = distance + "m"
  document.getElementById("p1Speed").textContent = speed + " km/h"

  firebase.database().ref(`rooms/${roomId}/players/${playerId}`).update({
    distance,
    speed,
  })
}

window.updateEnemyDisplay = (e) => {
  document.getElementById("p2Dist").textContent = e.distance + "m"
  document.getElementById("p2Speed").textContent = e.speed + " km/h"
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnP1Click").onclick = handleClick
  document.getElementById("btnIniciarOnline").onclick = () => {
    if (window.startOnlineGame) window.startOnlineGame()
  }
})

window.startGame = startGame

console.log("[GAME] V16 ONLINE SYNC cargado")
// ===== UI FIX V16 =====
document.addEventListener("DOMContentLoaded", () => {

  const show = (id) => {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"))
    document.getElementById(id)?.classList.add("active")
  }

  // Inicio
  document.getElementById("btnOnline")?.onclick = () => show("paginaOnline")
  document.getElementById("volverDesdeOnline")?.onclick = () => show("inicio")

  // Online flow
  document.getElementById("btnCrearSala")?.onclick = () => {
    document.getElementById("opcionesView").classList.add("hidden")
    document.getElementById("crearSalaView").classList.remove("hidden")
    window.createRoom()
  }

  document.getElementById("btnUnirseSala")?.onclick = () => {
    document.getElementById("opcionesView").classList.add("hidden")
    document.getElementById("unirseSalaView").classList.remove("hidden")
  }

  document.getElementById("btnConectarSala")?.onclick = () => {
    const code = document.getElementById("inputCodigoSala").value.trim()
    if (code.length === 4) window.joinRoom(code)
  }

  document.getElementById("btnCancelarCrear")?.onclick = () => {
    document.getElementById("crearSalaView").classList.add("hidden")
    document.getElementById("opcionesView").classList.remove("hidden")
  }

  document.getElementById("btnCancelarUnirse")?.onclick = () => {
    document.getElementById("unirseSalaView").classList.add("hidden")
    document.getElementById("opcionesView").classList.remove("hidden")
  }

})

