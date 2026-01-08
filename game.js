// ===== GAME.JS - V16 COMPLETE =====
console.log("[GAME] Cargando V16 COMPLETE...")

// Estado del juego
const gameState = {
  // Conexion sensor
  isConnected: false,
  connectionMethod: null,
  serialPort: null,
  writer: null,

  // Juego
  gameActive: false,
  gameMode: null,
  gameTimer: null,
  timeLeft: 60,
  raceDistance: 1000,

  // Jugadores
  player1: { velocidad: 0, distancia: 0, clickCount: 0, position: 0 },
  player2: { velocidad: 0, distancia: 0, clickCount: 0, position: 0 },

  // Sensor
  totalClicks: 0,
  lastInputTime: 0,
}

// ===== UTILIDADES =====
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden")
    page.classList.remove("active")
  })
  const target = document.getElementById(pageId)
  if (target) {
    target.classList.remove("hidden")
    target.classList.add("active")
  }
}

function updateConnectionStatus(message, connected = false) {
  const el = document.getElementById("estadoConexion")
  if (el) {
    el.innerHTML = `<span class="${connected ? "text-green-800" : "text-blue-800"}">${message}</span>`
    el.className = `mb-4 p-4 rounded-lg border ${connected ? "bg-green-100 border-green-300" : "bg-blue-100 border-blue-300"}`
  }
}

// ===== SENSOR USB =====
async function checkSerialSupport() {
  if (!("serial" in navigator)) {
    updateConnectionStatus("Web Serial no disponible. Usa Chrome/Edge o modo manual.")
    return false
  }
  updateConnectionStatus("Web Serial disponible. Conecta tu sensor.")
  return true
}

async function connectSensor() {
  const supported = await checkSerialSupport()
  if (!supported) {
    gameState.connectionMethod = "manual"
    gameState.isConnected = true
    updateConnectionStatus("Modo manual activado", true)
    return
  }

  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 115200 })

    gameState.serialPort = port
    gameState.isConnected = true
    gameState.connectionMethod = "usb"

    updateConnectionStatus("Sensor conectado!", true)
    document.getElementById("sensorStatus")?.classList.remove("hidden")
    document.getElementById("detectarNodeMCU").textContent = "Sensor Conectado"
    document.getElementById("detectarNodeMCU").disabled = true

    // Leer datos
    startReading(port)
  } catch (error) {
    console.error("[GAME] Error sensor:", error)
    if (error.name !== "NotFoundError") {
      gameState.connectionMethod = "manual"
      gameState.isConnected = true
      updateConnectionStatus("Modo manual activado", true)
    }
  }
}

function startReading(port) {
  let buffer = ""

  const readLoop = async () => {
    try {
      if (!port.readable) return

      const reader = port.readable.getReader()
      const decoder = new TextDecoder()

      try {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 100)),
        ])

        if (!done && value) {
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split(/[\r\n]+/)
          buffer = lines.pop() || ""

          for (const line of lines) {
            const clean = line.trim().toLowerCase()
            if (clean === "click" || clean === "sensor_activated" || clean === "1") {
              handleSensorClick()
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (e) {
      if (e.message !== "timeout") console.error("[GAME] Read error:", e)
    }
  }

  setInterval(readLoop, 200)
}

function handleSensorClick() {
  gameState.totalClicks++
  updateClickDisplay()

  // LED visual
  const led = document.getElementById("ledDot")
  if (led) {
    led.className = "w-4 h-4 rounded-full mx-auto mb-1 bg-green-500"
    setTimeout(() => (led.className = "w-4 h-4 rounded-full mx-auto mb-1 bg-gray-400"), 300)
  }

  if (gameState.gameActive) {
    handlePlayerInput(1)
  }
}

function updateClickDisplay() {
  const el = document.getElementById("totalClicks")
  if (el) el.textContent = gameState.totalClicks
  document.getElementById("clickCounter")?.classList.remove("hidden")
}

// ===== LOGICA DEL JUEGO =====
function handlePlayerInput(playerNum) {
  if (!gameState.gameActive) return

  const player = playerNum === 1 ? gameState.player1 : gameState.player2
  const now = Date.now()
  const timeDiff = now - gameState.lastInputTime

  // Calcular velocidad
  if (timeDiff < 200) player.velocidad = 45
  else if (timeDiff < 500) player.velocidad = 35
  else if (timeDiff < 1000) player.velocidad = 25
  else player.velocidad = 15

  // Avanzar
  const increment = 3 + player.velocidad / 8
  player.distancia = Math.min(gameState.raceDistance, player.distancia + increment)
  player.position = (player.distancia / gameState.raceDistance) * 100
  player.clickCount++

  gameState.lastInputTime = now

  // Animacion bici
  const bike = document.getElementById(`bike${playerNum}`)
  if (bike) {
    bike.parentElement.parentElement.classList.add("bike-racing")
    setTimeout(() => bike.parentElement.parentElement.classList.remove("bike-racing"), 300)
  }

  // Enviar online si aplica
  if (typeof window.sendOnlineState === "function" && window.isOnlineGameReady?.()) {
    window.sendOnlineState(player.velocidad, player.distancia)
  }

  updateDisplay()

  // Verificar victoria
  if (player.distancia >= gameState.raceDistance) {
    endGame(playerNum)
  }
}

// Para recibir datos del enemigo online
window.updateEnemyDisplay = (enemyState) => {
  if (!gameState.gameActive) return

  gameState.player2.distancia = enemyState.distance || 0
  gameState.player2.velocidad = enemyState.speed || 0
  gameState.player2.position = (gameState.player2.distancia / gameState.raceDistance) * 100

  updateDisplay()

  if (gameState.player2.distancia >= gameState.raceDistance) {
    endGame(2)
  }
}

function updateDisplay() {
  const p1 = gameState.player1
  const p2 = gameState.player2

  // Posiciones visuales
  const p1Container = document.getElementById("player1Container")
  const p2Container = document.getElementById("player2Container")

  if (p1Container) p1Container.style.bottom = `${5 + p1.position * 0.85}%`
  if (p2Container) p2Container.style.bottom = `${5 + p2.position * 0.85}%`

  // Stats
  document.getElementById("p1Speed").textContent = `${Math.round(p1.velocidad)} km/h`
  document.getElementById("p1Dist").textContent = `${Math.round(p1.distancia)}m`
  document.getElementById("p2Speed").textContent = `${Math.round(p2.velocidad)} km/h`
  document.getElementById("p2Dist").textContent = `${Math.round(p2.distancia)}m`

  // Progress bars
  document.getElementById("p1Percent").textContent = `${Math.round(p1.position)}%`
  document.getElementById("p1ProgressFill").style.width = `${p1.position}%`
  document.getElementById("p2Percent").textContent = `${Math.round(p2.position)}%`
  document.getElementById("p2ProgressFill").style.width = `${p2.position}%`
}

function startGame(mode) {
  console.log("[GAME] Iniciando modo:", mode)

  gameState.gameActive = true
  gameState.gameMode = mode
  gameState.timeLeft = 60
  gameState.player1 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.player2 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.lastInputTime = Date.now()

  showPage("juegoCarrera")

  // Configurar UI segun modo
  const lane2 = document.getElementById("lane2")
  const progressP2 = document.getElementById("progressP2")
  const btnP2 = document.getElementById("btnP2Click")

  if (mode === "multi" || mode === "online") {
    lane2?.classList.remove("hidden")
    progressP2?.classList.remove("hidden")
    if (mode === "multi") btnP2?.classList.remove("hidden")
    document.getElementById("modoDisplay").textContent = mode === "online" ? "Online" : "Multijugador"
  } else {
    lane2?.classList.add("hidden")
    progressP2?.classList.add("hidden")
    btnP2?.classList.add("hidden")
    document.getElementById("modoDisplay").textContent = "Individual"
  }

  // Timer
  gameState.gameTimer = setInterval(() => {
    gameState.timeLeft--
    document.getElementById("tiempoRestante").textContent = gameState.timeLeft

    if (gameState.timeLeft <= 0) {
      endGame(null)
    }
  }, 1000)

  // Decay velocidad
  setInterval(() => {
    if (gameState.gameActive) {
      gameState.player1.velocidad *= 0.95
      gameState.player2.velocidad *= 0.95
      updateDisplay()
    }
  }, 500)
}

// Funcion para que online.js inicie el juego
window.startOnlineRace = () => {
  startGame("online")
}

function endGame(winner) {
  gameState.gameActive = false
  if (gameState.gameTimer) clearInterval(gameState.gameTimer)

  setTimeout(() => {
    showPage("resultados")
    showResults(winner)
  }, 500)
}

function showResults(winner) {
  const p1 = gameState.player1
  const p2 = gameState.player2

  let winnerText = ""
  if (winner === 1) winnerText = "Jugador 1 GANO!"
  else if (winner === 2) winnerText = "Jugador 2 GANO!"
  else if (p1.distancia > p2.distancia) winnerText = "Jugador 1 GANO!"
  else if (p2.distancia > p1.distancia) winnerText = "Jugador 2 GANO!"
  else winnerText = "EMPATE!"

  document.getElementById("winnerText").textContent = winnerText

  document.getElementById("resultsTable").innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div class="bg-blue-100 p-4 rounded-lg text-center">
                <div class="font-bold text-blue-600">Jugador 1</div>
                <div class="text-2xl font-bold">${Math.round(p1.distancia)}m</div>
                <div class="text-sm text-gray-600">${p1.clickCount} clicks</div>
            </div>
            <div class="bg-red-100 p-4 rounded-lg text-center">
                <div class="font-bold text-red-600">Jugador 2</div>
                <div class="text-2xl font-bold">${Math.round(p2.distancia)}m</div>
                <div class="text-sm text-gray-600">${p2.clickCount} clicks</div>
            </div>
        </div>
    `
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
  console.log("[GAME] DOM ready")
  checkSerialSupport()

  // Sensor
  document.getElementById("detectarNodeMCU")?.addEventListener("click", connectSensor)

  // Navegacion
  document.getElementById("btnLocal")?.addEventListener("click", () => showPage("seleccionModo"))
  document.getElementById("btnOnline")?.addEventListener("click", () => showPage("paginaOnline"))
  document.getElementById("volverInicio")?.addEventListener("click", () => showPage("inicio"))
  document.getElementById("volverDesdeOnline")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    document.getElementById("opcionesView")?.classList.remove("hidden")
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("conectadoView")?.classList.add("hidden")
    showPage("inicio")
  })

  // Modos locales
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      startGame(this.dataset.mode)
    })
  })

  document.getElementById("btnCrearSala")?.addEventListener("click", () => {
    const codigo = Math.random().toString(36).substring(2, 6).toUpperCase()
    document.getElementById("codigoSala").textContent = codigo
    document.getElementById("opcionesView")?.classList.add("hidden")
    document.getElementById("crearSalaView")?.classList.remove("hidden")

    // Iniciar sala en Firebase si está disponible
    if (typeof window.createOnlineRoom === "function") {
      window.createOnlineRoom(codigo)
    }
  })

  document.getElementById("btnUnirseSala")?.addEventListener("click", () => {
    document.getElementById("opcionesView")?.classList.add("hidden")
    document.getElementById("unirseSalaView")?.classList.remove("hidden")
  })

  document.getElementById("btnConectarSala")?.addEventListener("click", () => {
    const codigo = document.getElementById("inputCodigoSala")?.value.toUpperCase()
    if (codigo && codigo.length >= 4) {
      document.getElementById("salaConectada").textContent = codigo
      document.getElementById("unirseSalaView")?.classList.add("hidden")
      document.getElementById("conectadoView")?.classList.remove("hidden")

      // Unirse a sala en Firebase si está disponible
      if (typeof window.joinOnlineRoom === "function") {
        window.joinOnlineRoom(codigo)
      }
    } else {
      alert("Ingresa un código de 4 caracteres")
    }
  })

  document.getElementById("btnSimularConexion")?.addEventListener("click", () => {
    const codigo = document.getElementById("codigoSala").textContent
    document.getElementById("salaConectada").textContent = codigo
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("conectadoView")?.classList.remove("hidden")
    document.getElementById("p1StatusOnline").textContent = "Tu (Host)"
    document.getElementById("p2StatusOnline").textContent = "Conectado"
  })

  document.getElementById("btnCancelarCrear")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    document.getElementById("crearSalaView")?.classList.add("hidden")
    document.getElementById("opcionesView")?.classList.remove("hidden")
  })

  document.getElementById("btnCancelarUnirse")?.addEventListener("click", () => {
    document.getElementById("unirseSalaView")?.classList.add("hidden")
    document.getElementById("opcionesView")?.classList.remove("hidden")
  })

  document.getElementById("btnIniciarOnline")?.addEventListener("click", () => {
    if (window.isOnlineGameReady?.()) {
      if (window.isGameHost?.()) {
        window.hostStartGame?.()
      }
      startGame("online")
    } else {
      // Demo mode - iniciar sin conexión real
      startGame("online")
    }
  })

  // Controles de juego
  document.getElementById("btnP1Click")?.addEventListener("click", () => {
    if (gameState.gameActive) handlePlayerInput(1)
  })

  document.getElementById("btnP2Click")?.addEventListener("click", () => {
    if (gameState.gameActive && gameState.gameMode === "multi") handlePlayerInput(2)
  })

  // Teclado
  document.addEventListener("keydown", (e) => {
    if (!gameState.gameActive) return

    if (e.code === "Space" && gameState.gameMode === "multi") {
      e.preventDefault()
      handlePlayerInput(2)
    }
  })

  // Resultados
  document.getElementById("btnPlayAgain")?.addEventListener("click", () => {
    if (gameState.gameMode === "online") {
      showPage("paginaOnline")
      document.getElementById("opcionesView")?.classList.remove("hidden")
      document.getElementById("crearSalaView")?.classList.add("hidden")
      document.getElementById("unirseSalaView")?.classList.add("hidden")
      document.getElementById("conectadoView")?.classList.add("hidden")
    } else {
      showPage("seleccionModo")
    }
  })

  document.getElementById("btnBackHome")?.addEventListener("click", () => {
    window.cleanupOnlineGame?.()
    showPage("inicio")
  })
})

console.log("[GAME] V16 COMPLETE cargado!")
