// ===== VERSIÓN 16 ONLINE - JAVASCRIPT CON PEERJS =====
console.log("🚀 BIKE RACE GAME V16 ONLINE CARGADA")

// Estado global del juego
const gameState = {
  // Conexión
  isConnected: false,
  connectionMethod: null,
  serialPort: null,
  writer: null,
  readingInterval: null,

  // Juego
  gameActive: false,
  gameMode: null,
  gameTimer: null,
  timeLeft: 60,
  raceDistance: 1000,

  // Jugadores
  player1: {
    velocidad: 0,
    distancia: 0,
    clickCount: 0,
    position: 0,
  },
  player2: {
    velocidad: 0,
    distancia: 0,
    clickCount: 0,
    position: 0,
  },

  // Sensor
  totalClicks: 0,
  lastSensorTime: 0,
  ledStatus: false,

  // Online con PeerJS
  peer: null,
  roomCode: null,
  isHost: false,
  connection: null,
  isOnlineReady: false,

  // Logs
  connectionLog: [],
}

// ===== FUNCIONES DE UTILIDAD =====
function showPage(pageId) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.add("hidden")
    page.classList.remove("active")
  })
  const targetPage = document.getElementById(pageId)
  if (targetPage) {
    targetPage.classList.remove("hidden")
    targetPage.classList.add("active")
  }
}

function addConnectionLog(message) {
  const timestamp = new Date().toLocaleTimeString()
  console.log(`V16: ${timestamp}: ${message}`)
  gameState.connectionLog.push(`${timestamp}: ${message}`)
}

function updateConnectionStatus(status, isConnected = false) {
  const statusElement = document.getElementById("estadoConexion")
  if (statusElement) {
    if (isConnected) {
      statusElement.innerHTML = `<i class="fas fa-check-circle text-green-600"></i><span class="text-green-800 ml-2">${status}</span>`
      statusElement.className = "mb-6 p-4 rounded-lg bg-green-50 border border-green-200"
    } else {
      statusElement.innerHTML = `<i class="fas fa-exclamation-triangle text-blue-600"></i><span class="text-blue-800 ml-2">${status}</span>`
      statusElement.className = "mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200"
    }
  }
}

// ===== CONEXIÓN DEL SENSOR =====
async function checkSerialSupport() {
  try {
    if (!("serial" in navigator)) {
      updateConnectionStatus("❌ Web Serial API no disponible. Usa Chrome/Edge.")
      return false
    }
    updateConnectionStatus("✅ Web Serial API disponible. Listo para conectar.")
    return true
  } catch (error) {
    updateConnectionStatus("❌ Error verificando compatibilidad.")
    return false
  }
}

async function connectToNodeMCU() {
  const supported = await checkSerialSupport()
  if (!supported) {
    startSimulatedConnection()
    return
  }

  try {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 115200 })

    gameState.serialPort = port
    gameState.isConnected = true
    gameState.connectionMethod = "usb"

    updateConnectionStatus("🎉 ¡Sensor conectado!", true)
    showConnectedElements()

    const textEncoder = new TextEncoderStream()
    textEncoder.readable.pipeTo(port.writable)
    const writer = textEncoder.writable.getWriter()
    gameState.writer = writer

    startPeriodicReading(port)
  } catch (error) {
    console.error("Error conectando:", error)
    if (error.name !== "NotFoundError") {
      startSimulatedConnection()
    }
  }
}

function startPeriodicReading(port) {
  let buffer = ""

  const readChunk = async () => {
    try {
      if (!port.readable) return

      const reader = port.readable.getReader()
      const decoder = new TextDecoder()

      try {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 100)),
        ])

        if (done) return

        if (value) {
          const text = decoder.decode(value, { stream: true })
          buffer += text

          const lines = buffer.split(/[\r\n]+/)
          buffer = lines.pop() || ""

          for (const line of lines) {
            const cleanLine = line.trim()
            if (cleanLine) {
              processSerialData(cleanLine)
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error) {
      if (error.message !== "timeout") {
        console.error("Error leyendo:", error)
      }
    }
  }

  gameState.readingInterval = setInterval(readChunk, 200)
}

function processSerialData(data) {
  const lowerData = data.toLowerCase()

  if (lowerData === "click" || lowerData === "sensor_activated" || data === "1") {
    addConnectionLog("🚴‍♂️ ¡SENSOR ACTIVADO!")
    setLedStatus(true)
    setTimeout(() => setLedStatus(false), 300)

    gameState.totalClicks++
    updateTotalClicksDisplay()
    handlePlayerInput(1, "sensor")
  }
}

function showConnectedElements() {
  const status = document.getElementById("sensorStatus")
  const controls = document.getElementById("controlButtons")
  const btn = document.getElementById("detectarNodeMCU")

  if (status) status.classList.remove("hidden")
  if (controls) controls.classList.remove("hidden")
  if (btn) {
    btn.textContent = "Sensor Conectado"
    btn.disabled = true
  }
}

function setLedStatus(status) {
  gameState.ledStatus = status
  const dot = document.getElementById("ledDot")
  const text = document.getElementById("ledStatusText")

  if (dot && text) {
    if (status) {
      dot.className = "w-4 h-4 rounded-full mx-auto mb-1 bg-green-500 animate-pulse"
      text.textContent = "🟢 ON"
    } else {
      dot.className = "w-4 h-4 rounded-full mx-auto mb-1 bg-gray-400"
      text.textContent = "⚫ OFF"
    }
  }
}

function updateTotalClicksDisplay() {
  const element = document.getElementById("totalClicks")
  if (element) {
    element.textContent = gameState.totalClicks
  }

  const counter = document.getElementById("clickCounter")
  if (counter && gameState.totalClicks > 0) {
    counter.classList.remove("hidden")
  }

  const lastTime = document.getElementById("lastClickTime")
  if (lastTime) {
    lastTime.textContent = `Último: ${new Date().toLocaleTimeString()}`
  }
}

function startSimulatedConnection() {
  updateConnectionStatus("🎮 Modo manual activado", true)
  gameState.isConnected = true
  gameState.connectionMethod = "manual"
}

async function testSensor() {
  if (gameState.writer) {
    try {
      await gameState.writer.write("TEST_SENSOR\n")
      addConnectionLog("🧪 Comando de prueba enviado")
    } catch (error) {
      addConnectionLog("❌ Error enviando comando")
    }
  }
}

// ===== LÓGICA DEL JUEGO =====
function handlePlayerInput(playerNum, inputType) {
  if (!gameState.gameActive) {
    addConnectionLog(`Input recibido pero juego no activo: Jugador ${playerNum}`)
    return
  }

  const player = playerNum === 1 ? gameState.player1 : gameState.player2
  const currentTime = Date.now()
  const timeDiff = currentTime - gameState.lastSensorTime

  player.velocidad = calculateSpeed(timeDiff)
  const distanceIncrement = 3 + player.velocidad / 8
  player.distancia = Math.min(gameState.raceDistance, player.distancia + distanceIncrement)
  player.clickCount++
  player.position = (player.distancia / gameState.raceDistance) * 100

  gameState.lastSensorTime = currentTime

  const bikeElement = document.getElementById(`player${playerNum}Bike`)
  if (bikeElement) {
    bikeElement.classList.add("bike-racing")
    setTimeout(() => bikeElement.classList.remove("bike-racing"), 300)
  }

  // Enviar a jugador remoto si está conectado
  if (gameState.connection && gameState.connection.open) {
    gameState.connection.send({
      type: "player_update",
      player: playerNum,
      distancia: player.distancia,
      velocidad: player.velocidad,
      position: player.position,
    })
  }

  updateGameDisplay()

  if (player.distancia >= gameState.raceDistance) {
    endGame(playerNum)
  }
    // 🔥 ENVIAR ESTADO A FIREBASE (MULTIJUGADOR REAL)
  if (typeof sendOnlineState === "function") {
    sendOnlineState()
  }

}

function calculateSpeed(interval) {
  if (interval < 200) return 45
  if (interval < 500) return 35
  if (interval < 1000) return 25
  return 15
}

function updateGameDisplay() {
  const p1 = gameState.player1
  const p2 = gameState.player2

  const p1Container = document.getElementById("player1Container")
  const p2Container = document.getElementById("player2Container")

  if (p1Container) {
    p1Container.style.bottom = `${5 + p1.position * 0.9}%`
  }
  if (p2Container) {
    p2Container.style.bottom = `${5 + p2.position * 0.9}%`
  }

  document.getElementById("player1Stats").innerHTML = `
        <span class="bg-white/80 px-2 py-1 rounded">${Math.round(p1.velocidad)} km/h</span>
        <span class="bg-white/80 px-2 py-1 rounded ml-1">${Math.round(p1.distancia)}m</span>
    `
  document.getElementById("player2Stats").innerHTML = `
        <span class="bg-white/80 px-2 py-1 rounded">${Math.round(p2.velocidad)} km/h</span>
        <span class="bg-white/80 px-2 py-1 rounded ml-1">${Math.round(p2.distancia)}m</span>
    `

  document.getElementById("player1Progress").textContent = `${Math.round(p1.position)}%`
  document.getElementById("player1ProgressBar").style.width = `${p1.position}%`
  document.getElementById("player2Progress").textContent = `${Math.round(p2.position)}%`
  document.getElementById("player2ProgressBar").style.width = `${p2.position}%`
}

function startGame(mode) {
  gameState.gameActive = true
  gameState.gameMode = mode
  gameState.timeLeft = 60

  gameState.player1 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.player2 = { velocidad: 0, distancia: 0, clickCount: 0, position: 0 }
  gameState.lastSensorTime = Date.now()

  showPage("juegoCarrera")

  const modoElement = document.getElementById("modoJuego")
  if (modoElement) {
    if (mode === "single") modoElement.textContent = "Individual"
    else if (mode === "multi") modoElement.textContent = "Multijugador"
    else if (mode.startsWith("online")) modoElement.textContent = "Online"
  }

  // Notificar inicio al jugador remoto
  if (gameState.connection && gameState.connection.open) {
    gameState.connection.send({
      type: "game_start",
      mode: mode,
    })
  }

  gameState.gameTimer = setInterval(() => {
    gameState.timeLeft--
    document.getElementById("tiempoRestante").textContent = gameState.timeLeft

    if (gameState.timeLeft <= 0) {
      endGame(null)
    }
  }, 1000)

  const velocityDecay = setInterval(() => {
    if (gameState.gameActive) {
      gameState.player1.velocidad = Math.max(0, gameState.player1.velocidad * 0.95)
      gameState.player2.velocidad = Math.max(0, gameState.player2.velocidad * 0.95)
      updateGameDisplay()
    } else {
      clearInterval(velocityDecay)
    }
  }, 1000)
}

function endGame(winnerNum) {
  gameState.gameActive = false
  if (gameState.gameTimer) clearInterval(gameState.gameTimer)

  // Notificar fin al jugador remoto
  if (gameState.connection && gameState.connection.open) {
    gameState.connection.send({
      type: "game_end",
      winner: winnerNum,
    })
  }

  setTimeout(() => {
    showPage("resultados")
    updateResultsDisplay(winnerNum)
  }, 1000)
}

function updateResultsDisplay(winnerNum) {
  const p1 = gameState.player1
  const p2 = gameState.player2

  document.getElementById("distanciaPlayer1").textContent = `${Math.round(p1.distancia)}m`
  document.getElementById("velocidadPlayer1").textContent = `${Math.round(p1.velocidad)} km/h`
  document.getElementById("distanciaPlayer2").textContent = `${Math.round(p2.distancia)}m`
  document.getElementById("velocidadPlayer2").textContent = `${Math.round(p2.velocidad)} km/h`

  const winnerMsg = document.getElementById("winnerMessage")
  if (winnerNum === 1) {
    winnerMsg.innerHTML = '<span class="text-blue-600">🏆 ¡Jugador 1 GANÓ!</span>'
  } else if (winnerNum === 2) {
    winnerMsg.innerHTML = '<span class="text-red-600">🏆 ¡Jugador 2 GANÓ!</span>'
  } else {
    if (p1.distancia > p2.distancia) {
      winnerMsg.innerHTML = '<span class="text-blue-600">🏆 ¡Jugador 1 GANÓ!</span>'
    } else if (p2.distancia > p1.distancia) {
      winnerMsg.innerHTML = '<span class="text-red-600">🏆 ¡Jugador 2 GANÓ!</span>'
    } else {
      winnerMsg.innerHTML = '<span class="text-purple-600">🤝 ¡EMPATE!</span>'
    }
  }
}

// ===== MULTIJUGADOR ONLINE CON PEERJS =====
function initializePeer() {
  const Peer = window.Peer // Declare Peer variable before using it
  if (typeof Peer === "undefined") {
    console.error("PeerJS no está cargado")
    alert("Error: PeerJS no disponible. Verifica tu conexión a internet.")
    return null
  }

  // Crear instancia de Peer con configuración pública
  const peer = new Peer({
    config: {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:global.stun.twilio.com:3478" }],
    },
  })

  peer.on("open", (id) => {
    addConnectionLog(`✅ PeerJS conectado. ID: ${id}`)
    const myPeerIdElement = document.getElementById("myPeerId")
    if (myPeerIdElement) {
      myPeerIdElement.textContent = id.substring(0, 8) + "..."
    }
  })

  peer.on("error", (err) => {
    console.error("Error de PeerJS:", err)
    addConnectionLog(`❌ Error P2P: ${err.type}`)
  })

  return peer
}

function setupOnlineHost() {
  gameState.peer = initializePeer()
  if (!gameState.peer) return

  gameState.isHost = true

  gameState.peer.on("open", (id) => {
    gameState.roomCode = id.substring(0, 4).toUpperCase()
    document.getElementById("roomCode").textContent = gameState.roomCode
    document.getElementById("crearSala").classList.remove("hidden")
    document.getElementById("unirseASala").classList.add("hidden")

    addConnectionLog(`🏠 Sala creada: ${gameState.roomCode}`)
    addConnectionLog(`📡 ID completo: ${id}`)

    document.getElementById("player1Status").textContent = "✅ Listo (Host)"
  })

  // Escuchar conexiones entrantes
  gameState.peer.on("connection", (conn) => {
    gameState.connection = conn
    addConnectionLog("👥 Jugador 2 conectándose...")

    conn.on("open", () => {
      addConnectionLog("✅ Jugador 2 conectado!")
      document.getElementById("crearSala").classList.add("hidden")
      document.getElementById("estadoOnline").classList.remove("hidden")
      document.getElementById("player2Status").textContent = "✅ Conectado"
      document.getElementById("readyToStart").classList.remove("hidden")
      document.getElementById("connectionInfo").textContent = "Conexión P2P establecida ✅"
      document.getElementById("deployInfo").classList.remove("hidden")

      gameState.isOnlineReady = true
    })

    conn.on("data", (data) => {
      handleRemoteData(data)
    })

    conn.on("close", () => {
      addConnectionLog("❌ Jugador 2 desconectado")
      alert("El otro jugador se desconectó")
    })
  })
}

function setupOnlineJoin() {
  document.getElementById("crearSala").classList.add("hidden")
  document.getElementById("unirseASala").classList.remove("hidden")
}

function joinRoom(hostPeerId) {
  gameState.peer = initializePeer()
  if (!gameState.peer) return

  gameState.isHost = false

  gameState.peer.on("open", (id) => {
    addConnectionLog(`✅ PeerJS listo. Conectando a: ${hostPeerId}`)

    // Intentar conectar al host
    const conn = gameState.peer.connect(hostPeerId, {
      reliable: true,
    })

    gameState.connection = conn

    conn.on("open", () => {
      addConnectionLog("✅ Conectado al host!")
      document.getElementById("unirseASala").classList.add("hidden")
      document.getElementById("estadoOnline").classList.remove("hidden")
      document.getElementById("player1Status").textContent = "✅ Conectado (Host)"
      document.getElementById("player2Status").textContent = "✅ Listo"
      document.getElementById("readyToStart").classList.remove("hidden")
      document.getElementById("connectionInfo").textContent = "Conexión P2P establecida ✅"
      document.getElementById("deployInfo").classList.remove("hidden")

      gameState.isOnlineReady = true
    })

    conn.on("data", (data) => {
      handleRemoteData(data)
    })

    conn.on("error", (err) => {
      console.error("Error de conexión:", err)
      addConnectionLog(`❌ Error conectando: ${err}`)
      alert("Error al conectar con el host. Verifica el código.")
    })

    conn.on("close", () => {
      addConnectionLog("❌ Host desconectado")
      alert("El host se desconectó")
    })
  })
}

function handleRemoteData(data) {
  if (data.type === "player_update") {
    // Actualizar el jugador remoto
    const remotePlayer = data.player === 1 ? gameState.player1 : gameState.player2
    remotePlayer.distancia = data.distancia
    remotePlayer.velocidad = data.velocidad
    remotePlayer.position = data.position

    updateGameDisplay()

    if (remotePlayer.distancia >= gameState.raceDistance) {
      endGame(data.player)
    }
  } else if (data.type === "game_start") {
    addConnectionLog("🎮 El host inició el juego")
    // El guest también inicia
    if (!gameState.gameActive) {
      startGame(data.mode)
    }
  } else if (data.type === "game_end") {
    addConnectionLog("🏁 El juego terminó")
    if (gameState.gameActive) {
      endGame(data.winner)
    }
  }
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
  addConnectionLog("🚀 INICIANDO V16 ONLINE CON PEERJS")
  checkSerialSupport()

  // Verificar disponibilidad de PeerJS
  if (typeof window.Peer === "undefined") {
    // Use window.Peer to check availability
    console.warn("⚠️ PeerJS no está disponible. El modo online no funcionará.")
  } else {
    addConnectionLog("✅ PeerJS disponible")
  }

  document.getElementById("detectarNodeMCU")?.addEventListener("click", connectToNodeMCU)
  document.getElementById("testSensor")?.addEventListener("click", testSensor)

  document.getElementById("btnLocal")?.addEventListener("click", () => {
    gameState.connectionMethod = gameState.connectionMethod || "manual"
    showPage("seleccionModo")
  })

document.getElementById("btnOnline")?.addEventListener("click", () => {
  showPage("juegoCarrera")
  startOnlineGame()   // 🔥 FIREBASE MATCHMAKING
  startGame("online")
})


  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const mode = this.dataset.mode

      if (mode === "online-host") {
        setupOnlineHost()
      } else if (mode === "online-join") {
        setupOnlineJoin()
      } else {
        startGame(mode)
      }
    })
  })

  document.getElementById("btnUnirse")?.addEventListener("click", () => {
    const code = document.getElementById("inputRoomCode").value.trim()
    if (code.length >= 4) {
      // Necesitamos el ID completo del peer, no solo el código corto
      // En producción, usarías un servidor para mapear códigos cortos a IDs completos
      // Por ahora, asumimos que el usuario ingresa el ID completo

      // Buscar peers con ese prefijo
      addConnectionLog(`🔍 Intentando conectar con código: ${code}`)
      alert(
        "⚠️ IMPORTANTE:\n\nEn esta versión de demostración, el Jugador 2 debe ingresar el ID COMPLETO del Peer (no solo el código de 4 dígitos).\n\nEl Jugador 1 debe compartir su ID completo que aparece en la consola del navegador (F12).",
      )

      joinRoom(code)
    } else {
      alert("Por favor ingresa un código válido")
    }
  })

  document.getElementById("iniciarCarreraOnline")?.addEventListener("click", () => {
    if (gameState.isOnlineReady) {
      startGame(gameState.isHost ? "online-host" : "online-join")
    } else {
      alert("Espera a que ambos jugadores estén conectados")
    }
  })

  document.getElementById("cancelarSala")?.addEventListener("click", () => {
    if (gameState.peer) {
      gameState.peer.destroy()
    }
    showPage("seleccionModo")
  })

  document.getElementById("cancelarUnion")?.addEventListener("click", () => {
    showPage("seleccionModo")
  })

  document.getElementById("btnPedalear")?.addEventListener("click", () => {
    if (gameState.connectionMethod === "manual" || !gameState.isConnected) {
      handlePlayerInput(1, "click")
    }
  })

  document.getElementById("volverInicio")?.addEventListener("click", () => {
    if (gameState.peer) {
      gameState.peer.destroy()
    }
    showPage("inicio")
  })

  document.getElementById("revancha")?.addEventListener("click", () => {
    startGame(gameState.gameMode)
  })

  document.addEventListener("keydown", (e) => {
    if (!gameState.gameActive) return

    if (e.code === "Space") {
      e.preventDefault()
      if (gameState.gameMode === "multi") {
        handlePlayerInput(2, "keyboard")
      } else if (gameState.gameMode.startsWith("online") && !gameState.isHost) {
        // El guest (jugador 2) controla con espacio
        handlePlayerInput(2, "keyboard")
      } else if (gameState.connectionMethod === "manual") {
        handlePlayerInput(1, "click")
      }
    }
  })
})
// ===== LOOP DE RENDER CONTINUO (NECESARIO PARA ONLINE) =====
function renderLoop() {
  if (gameState.gameActive) {
    updateGameDisplay()
  }
  requestAnimationFrame(renderLoop)
}

renderLoop()


console.log("🚀 BIKE RACE GAME V16 ONLINE - LISTA PARA JUGAR P2P")
