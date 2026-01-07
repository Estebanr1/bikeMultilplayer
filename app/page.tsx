"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface Player {
  id: string
  name: string
  velocidad: number
  distancia: number
  clickCount: number
  inputMethod: "sensor" | "click" | "bot"
  position: number
  color: string
  isConnected: boolean
}

interface GameState {
  gameActive: boolean
  timeLeft: number
  players: Player[]
  gameMode: "local" | "online" | "bot"
  raceDistance: number
  winner: string | null
}

export default function BikeRaceMultiplayerV14FIXED() {
  const [currentPage, setCurrentPage] = useState("inicio")
  const [gameState, setGameState] = useState<GameState>({
    gameActive: false,
    timeLeft: 60,
    players: [],
    gameMode: "local",
    raceDistance: 1000,
    winner: null,
  })

  // Estados de conexión
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("🚀 VERSIÓN 14 FIXED - Writer SIN liberar NUNCA")
  const [serialSupported, setSerialSupported] = useState(false)
  const [connectionLog, setConnectionLog] = useState<string[]>([])
  const [sensorData, setSensorData] = useState("")
  const [totalClicks, setTotalClicks] = useState(0)
  const [rawSerialData, setRawSerialData] = useState<string[]>([])
  const [ledStatus, setLedStatus] = useState(false)
  const [sensorStatus, setSensorStatus] = useState("Esperando...")
  const [lastClickTime, setLastClickTime] = useState<string>("")
  const [isDetecting, setIsDetecting] = useState(false)
  const [writerReady, setWriterReady] = useState(false)

  // Referencias
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const botTimerRef = useRef<NodeJS.Timeout | null>(null)
  const serialPortRef = useRef<any>(null)
  const writerRef = useRef<any>(null)
  const readerRef = useRef<any>(null)
  const readingActiveRef = useRef(false)

  const addConnectionLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setConnectionLog((prev) => [...prev.slice(-4), `${timestamp}: ${message}`])
    console.log(`V14 FIXED: ${timestamp}: ${message}`)
  }

  useEffect(() => {
    checkSerialSupport()
    addConnectionLog("🚀 INICIANDO VERSIÓN 14 FIXED - Writer NUNCA se libera")
    console.log("🚀 BIKE RACE MULTIPLAYER V14 FIXED CARGADA")
  }, [])

  const checkSerialSupport = async () => {
    try {
      if (!("serial" in navigator)) {
        setSerialSupported(false)
        setConnectionStatus("❌ Web Serial API no disponible. Usa Chrome/Edge.")
        addConnectionLog("Web Serial API no disponible - V14 FIXED")
        return false
      }

      if (window.self !== window.top) {
        setSerialSupported(false)
        setConnectionStatus("⚠️ Web Serial API bloqueada en iframe.")
        addConnectionLog("Detectado iframe - V14 FIXED")
        return false
      }

      setSerialSupported(true)
      setConnectionStatus("✅ Web Serial API disponible. Listo para conectar NodeMCU V14 FIXED.")
      addConnectionLog("Web Serial API disponible - V14 FIXED lista")
      return true
    } catch (error) {
      console.error("Error verificando soporte V14 FIXED:", error)
      setSerialSupported(false)
      setConnectionStatus("❌ Error verificando compatibilidad.")
      addConnectionLog(`Error V14 FIXED: ${error}`)
      return false
    }
  }

  const connectToNodeMCU = async () => {
    const supported = await checkSerialSupport()

    if (!supported) {
      setConnectionStatus("⚠️ Web Serial API no disponible. Usando modo simulado V14 FIXED.")
      addConnectionLog("Fallback a modo simulado V14 FIXED")
      startSimulatedConnection()
      return
    }

    setIsDetecting(true)
    setConnectionStatus("🔌 Selecciona el puerto del NodeMCU...")
    addConnectionLog("Solicitando puerto serie V14 FIXED...")

    try {
      await cleanupConnection()

      const port = await (navigator as any).serial.requestPort()
      addConnectionLog("Puerto seleccionado V14 FIXED, abriendo conexión...")

      await port.open({
        baudRate: 115200,
        dataBits: 8,
        stopBits: 1,
        parity: "none",
        flowControl: "none",
      })

      addConnectionLog("✅ Puerto abierto exitosamente V14 FIXED")
      serialPortRef.current = port
      setIsDetecting(false)
      setConnectionStatus("🎉 ¡NodeMCU V14 FIXED conectado! Configurando writer...")

      // CONFIGURAR WRITER SIN LIBERAR NUNCA
      await setupWriterNoRelease(port)

      // CONFIGURAR READER
      await setupReaderDirect(port)

      setIsConnected(true)
      setConnectionStatus("🚀 ¡NodeMCU V14 FIXED listo! Writer PERMANENTE configurado.")
      addConnectionLog("✅ Writer PERMANENTE y Reader configurados correctamente V14 FIXED")

      // NO ENVIAR INIT AUTOMÁTICAMENTE - Evita perder el writer
      addConnectionLog("✅ Sistema listo - Writer guardado y NO liberado")
    } catch (error: any) {
      console.error("Error conectando V14 FIXED:", error)
      addConnectionLog(`Error V14 FIXED: ${error.message}`)
      setIsDetecting(false)

      if (error.name === "NotFoundError") {
        setConnectionStatus("❌ No se seleccionó ningún dispositivo.")
      } else {
        setConnectionStatus("❌ Error de conexión. Usando modo simulado.")
        setTimeout(() => {
          startSimulatedConnection()
        }, 2000)
      }
    }
  }

  // CONFIGURAR WRITER SIN LIBERARLO NUNCA
  const setupWriterNoRelease = async (port: any) => {
    try {
      addConnectionLog("🔧 Configurando Writer PERMANENTE V14 FIXED...")

      if (!port.writable) {
        throw new Error("Puerto no escribible")
      }

      // Obtener writer directo
      const writer = port.writable.getWriter()

      // CRÍTICO: Guardar INMEDIATAMENTE
      writerRef.current = writer

      addConnectionLog("✅ Writer obtenido y guardado V14 FIXED")

      // Verificación inmediata
      if (!writerRef.current) {
        throw new Error("Writer se perdió inmediatamente")
      }

      addConnectionLog("✅ Verificación 1: Writer EXISTE")

      // Esperar un momento para estabilidad
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Verificación después de espera
      if (!writerRef.current) {
        throw new Error("Writer se perdió después de espera")
      }

      addConnectionLog("✅ Verificación 2: Writer PERSISTE")

      // Marcar como ready SIN hacer test que podría liberar el writer
      setWriterReady(true)
      addConnectionLog("✅ Writer marcado como READY sin test (evita liberación)")
      addConnectionLog("🔒 Writer BLOQUEADO - NO se liberará automáticamente")
    } catch (error) {
      addConnectionLog(`❌ Error configurando Writer PERMANENTE V14 FIXED: ${error}`)
      setWriterReady(false)
      writerRef.current = null
      throw error
    }
  }

  const setupReaderDirect = async (port: any) => {
    try {
      addConnectionLog("🔧 Configurando Reader V14 FIXED...")

      if (!port.readable) {
        throw new Error("Puerto no legible")
      }

      startDirectReading(port)
      addConnectionLog("✅ Reader configurado exitosamente V14 FIXED")
    } catch (error) {
      addConnectionLog(`❌ Error configurando Reader V14 FIXED: ${error}`)
      throw error
    }
  }

  const startDirectReading = async (port: any) => {
    if (readingActiveRef.current) {
      addConnectionLog("⚠️ Lectura ya activa V14 FIXED")
      return
    }

    readingActiveRef.current = true
    addConnectionLog("🔍 Iniciando lectura V14 FIXED...")
    setSensorStatus("Escuchando sensor V14 FIXED...")

    const readLoop = async () => {
      let buffer = ""
      let reader: any = null

      try {
        reader = port.readable.getReader()
        readerRef.current = reader

        addConnectionLog("✅ Reader obtenido V14 FIXED")

        while (port.readable && readingActiveRef.current && isConnected) {
          try {
            const { value, done } = await reader.read()

            if (done) {
              addConnectionLog("Lectura terminada V14 FIXED")
              break
            }

            if (value) {
              const decoder = new TextDecoder()
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
          } catch (readError) {
            console.error("Error en lectura V14 FIXED:", readError)
            addConnectionLog(`Error en lectura V14 FIXED: ${readError}`)
            break
          }

          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      } catch (error) {
        console.error("Error en loop de lectura V14 FIXED:", error)
        addConnectionLog(`Error en loop de lectura V14 FIXED: ${error}`)
      } finally {
        if (reader) {
          try {
            reader.releaseLock()
            addConnectionLog("✅ Reader liberado V14 FIXED")
          } catch (e) {
            addConnectionLog(`⚠️ Error liberando reader: ${e}`)
          }
        }
        readerRef.current = null
        readingActiveRef.current = false
      }
    }

    readLoop()
  }

  const processSerialData = (data: string) => {
    setRawSerialData((prev) => [...prev.slice(-9), data])
    setSensorData(data)
    addConnectionLog(`📡 V14 FIXED Recibido: "${data}"`)

    const lowerData = data.toLowerCase()

    if (lowerData === "click" || lowerData === "sensor_activated" || data === "1") {
      addConnectionLog("🚴‍♂️ ¡SENSOR FÍSICO V14 FIXED ACTIVADO!")
      setSensorStatus("¡Sensor V14 FIXED activado!")
      setLastClickTime(new Date().toLocaleTimeString())
      setLedStatus(true)
      setTimeout(() => {
        setLedStatus(false)
        setSensorStatus("Esperando sensor V14 FIXED...")
      }, 300)

      setTotalClicks((prev) => prev + 1)
      handlePlayerInput("player1", "sensor")
    } else if (lowerData.includes("listo") || lowerData.includes("ready") || lowerData.includes("inicializado")) {
      addConnectionLog("✅ NodeMCU V14 FIXED inicializado correctamente")
      setConnectionStatus("🎉 ¡NodeMCU V14 FIXED listo! Sensor funcionando.")
      setSensorStatus("Sensor V14 FIXED listo")
    } else if (lowerData.includes("prueba") || lowerData.includes("test") || lowerData.includes("completada")) {
      addConnectionLog("🧪 Comando de prueba V14 FIXED recibido por NodeMCU")
      setSensorStatus("Prueba V14 FIXED completada")
    } else if (lowerData.includes("pong")) {
      addConnectionLog("🏓 PONG recibido de NodeMCU V14 FIXED")
    }
  }

  // ENVÍO DE COMANDOS - SIN LIBERAR WRITER
  const sendCommandDirect = async (command: string) => {
    addConnectionLog(`🔍 Verificando writer antes de enviar ${command}...`)
    addConnectionLog(`🔍 writerRef.current: ${writerRef.current ? "EXISTE" : "NULL"}`)
    addConnectionLog(`🔍 writerReady: ${writerReady}`)

    if (!writerRef.current) {
      addConnectionLog(`❌ V14 FIXED Writer es NULL para comando: ${command}`)
      addConnectionLog("🔧 Intentando recuperar writer...")

      // Intentar recuperar writer
      if (serialPortRef.current && serialPortRef.current.writable) {
        try {
          const writer = serialPortRef.current.writable.getWriter()
          writerRef.current = writer
          setWriterReady(true)
          addConnectionLog("✅ Writer recuperado exitosamente")
        } catch (recoverError) {
          addConnectionLog(`❌ No se pudo recuperar writer: ${recoverError}`)
          return false
        }
      } else {
        addConnectionLog("❌ Puerto no disponible para recuperar writer")
        return false
      }
    }

    if (!writerReady) {
      addConnectionLog(`❌ V14 FIXED Writer no está READY para comando: ${command}`)
      return false
    }

    try {
      addConnectionLog(`📤 Intentando enviar comando: ${command}`)

      const encoder = new TextEncoder()
      const data = encoder.encode(`${command}\n`)

      addConnectionLog(`📦 Datos codificados: ${data.length} bytes`)

      await writerRef.current.write(data)

      addConnectionLog(`✅ V14 FIXED Comando enviado EXITOSAMENTE: ${command}`)

      // Verificar que el writer sigue existiendo después del envío
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (writerRef.current) {
        addConnectionLog("✅ Writer PERSISTE después del envío")
      } else {
        addConnectionLog("⚠️ Writer se PERDIÓ después del envío - recuperando...")
        const writer = serialPortRef.current.writable.getWriter()
        writerRef.current = writer
      }

      return true
    } catch (error) {
      addConnectionLog(`❌ V14 FIXED Error enviando comando ${command}: ${error}`)
      return false
    }
  }

  const testSensor = async () => {
    addConnectionLog("🧪 V14 FIXED Iniciando prueba del sensor...")
    addConnectionLog(`🔍 Writer disponible: ${writerRef.current ? "SÍ" : "NO"}, Ready: ${writerReady}`)

    const success = await sendCommandDirect("TEST_SENSOR")
    if (success) {
      setSensorStatus("Enviando prueba V14 FIXED...")
    } else {
      addConnectionLog("❌ V14 FIXED Falló el envío del comando de prueba")
    }
  }

  const requestSensorStatus = async () => {
    addConnectionLog("📊 V14 FIXED Solicitando estado del sensor...")
    await sendCommandDirect("STATUS")
  }

  // LIMPIEZA - SOLO AL DESCONECTAR COMPLETAMENTE
  const cleanupConnection = async () => {
    try {
      addConnectionLog("🧹 Limpiando conexión V14 FIXED...")

      readingActiveRef.current = false

      if (readerRef.current) {
        try {
          await readerRef.current.cancel()
          readerRef.current.releaseLock()
        } catch (e) {
          // Ignorar
        }
        readerRef.current = null
      }

      // CRÍTICO: Solo liberar writer al desconectar COMPLETAMENTE
      if (writerRef.current) {
        try {
          writerRef.current.releaseLock()
          addConnectionLog("✅ Writer liberado (desconexión completa)")
        } catch (e) {
          addConnectionLog(`⚠️ Error liberando writer: ${e}`)
        }
        writerRef.current = null
        setWriterReady(false)
      }

      if (serialPortRef.current) {
        try {
          await serialPortRef.current.close()
        } catch (e) {
          // Ignorar
        }
        serialPortRef.current = null
      }

      addConnectionLog("✅ Limpieza completada V14 FIXED")
    } catch (error) {
      addConnectionLog(`⚠️ Error en limpieza V14 FIXED: ${error}`)
    }
  }

  const disconnectNodeMCU = async () => {
    setIsConnected(false)
    await cleanupConnection()
    setConnectionStatus("🔌 NodeMCU V14 FIXED desconectado")
    setRawSerialData([])
    setSensorData("")
    setLedStatus(false)
    setSensorStatus("V14 FIXED Desconectado")
    addConnectionLog("🔌 Desconexión completada V14 FIXED")
  }

  const startSimulatedConnection = () => {
    setConnectionStatus("🎮 Modo simulado V14 FIXED activado")
    setIsConnected(true)
    setWriterReady(true)
    addConnectionLog("Modo simulado V14 FIXED iniciado")
  }

  const handlePlayerInput = (playerId: string, inputType: "sensor" | "click") => {
    if (!gameState.gameActive) {
      addConnectionLog(`🎮 V14 FIXED Input recibido pero juego no activo: ${playerId} - ${inputType}`)
      return
    }

    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((player) => {
        if (player.id === playerId) {
          const newVelocidad = calculateSpeed(200)
          const distanceIncrement = 5 + newVelocidad / 10
          const newDistancia = Math.min(prev.raceDistance, player.distancia + distanceIncrement)

          if (newDistancia >= prev.raceDistance && !prev.winner) {
            endGame(playerId)
          }

          addConnectionLog(
            `🏃‍♂️ V14 FIXED ${player.name} avanzó ${Math.round(distanceIncrement)}m - Total: ${Math.round(newDistancia)}m`,
          )

          return {
            ...player,
            velocidad: newVelocidad,
            distancia: newDistancia,
            clickCount: player.clickCount + 1,
            position: (newDistancia / prev.raceDistance) * 100,
          }
        }
        return player
      }),
    }))
  }

  const calculateSpeed = (interval: number) => {
    if (interval < 200) return 45
    if (interval < 500) return 35
    if (interval < 1000) return 25
    return 15
  }

  const createPlayer = (id: string, name: string, inputMethod: "sensor" | "click" | "bot", color: string): Player => ({
    id,
    name,
    velocidad: 0,
    distancia: 0,
    clickCount: 0,
    inputMethod,
    position: 0,
    color,
    isConnected: inputMethod === "sensor" ? isConnected : true,
  })

  const startLocalMultiplayer = () => {
    const players = [
      createPlayer("player1", "Jugador 1", isConnected ? "sensor" : "click", "blue"),
      createPlayer("player2", "Jugador 2", "click", "red"),
    ]

    setGameState((prev) => ({
      ...prev,
      gameActive: true,
      players,
      gameMode: "local",
      timeLeft: 120,
      winner: null,
    }))

    setCurrentPage("raceTrack")
    startGameTimer()
    addConnectionLog("🎮 V14 FIXED MULTIJUGADOR LOCAL INICIADO")
  }

  const startBotRace = () => {
    const players = [
      createPlayer("player1", "Tú", isConnected ? "sensor" : "click", "blue"),
      createPlayer("bot1", "Bot Rápido", "bot", "red"),
      createPlayer("bot2", "Bot Medio", "bot", "green"),
    ]

    setGameState((prev) => ({
      ...prev,
      gameActive: true,
      players,
      gameMode: "bot",
      timeLeft: 90,
      winner: null,
    }))

    setCurrentPage("raceTrack")
    startGameTimer()
    startBotBehavior()
    addConnectionLog("🤖 V14 FIXED CARRERA CON BOTS INICIADA")
  }

  const startGameTimer = () => {
    gameTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 1) {
          endGame(null)
          return { ...prev, timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)
  }

  const startBotBehavior = () => {
    botTimerRef.current = setInterval(
      () => {
        setGameState((prev) => {
          if (!prev.gameActive) return prev

          return {
            ...prev,
            players: prev.players.map((player) => {
              if (player.inputMethod === "bot") {
                const randomFactor = Math.random()
                const speedMultiplier = player.id === "bot1" ? 1.2 : 0.8

                if (randomFactor > 0.3) {
                  const botSpeed = calculateSpeed(300) * speedMultiplier
                  const distanceIncrement = 4 + botSpeed / 12
                  const newDistancia = Math.min(prev.raceDistance, player.distancia + distanceIncrement)

                  if (newDistancia >= prev.raceDistance && !prev.winner) {
                    endGame(player.id)
                  }

                  return {
                    ...player,
                    velocidad: botSpeed,
                    distancia: newDistancia,
                    clickCount: player.clickCount + 1,
                    position: (newDistancia / prev.raceDistance) * 100,
                  }
                }
              }
              return player
            }),
          }
        })
      },
      800 + Math.random() * 400,
    )
  }

  const endGame = (winnerId: string | null) => {
    setGameState((prev) => ({ ...prev, gameActive: false, winner: winnerId }))
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (botTimerRef.current) clearInterval(botTimerRef.current)

    setTimeout(() => {
      setCurrentPage("resultados")
    }, 2000)

    addConnectionLog(`🏁 V14 FIXED Juego terminado - Ganador: ${winnerId || "Tiempo agotado"}`)
  }

  useEffect(() => {
    let velocityDecay: NodeJS.Timeout

    if (gameState.gameActive) {
      velocityDecay = setInterval(() => {
        setGameState((prev) => ({
          ...prev,
          players: prev.players.map((player) => ({
            ...player,
            velocidad: Math.max(0, player.velocidad * 0.92),
          })),
        }))
      }, 1000)
    }

    return () => {
      if (velocityDecay) clearInterval(velocityDecay)
    }
  }, [gameState.gameActive])

  const renderInicio = () => (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-white drop-shadow-lg flex items-center justify-center gap-4">
            🚴‍♂️ BIKE RACE V14 FIXED 🚴‍♀️
          </h1>
          <h2 className="text-2xl font-bold text-white/90">WRITER NUNCA SE LIBERA</h2>
          <Badge className="text-lg p-3 bg-green-500 hover:bg-green-600 text-white border-0">
            ✅ VERSIÓN 14 FIXED - Writer Bloqueado • Auto-recuperación • Sin Liberación
          </Badge>
        </div>

        <Card className="bg-white/95 backdrop-blur">
          <CardContent className="p-8 space-y-6">
            <div
              className={`p-4 rounded-lg border ${
                isConnected
                  ? "bg-green-50 border-green-200"
                  : serialSupported
                    ? "bg-blue-50 border-blue-200"
                    : "bg-red-50 border-red-200"
              }`}
            >
              <div className={isDetecting ? "animate-pulse" : ""}>
                <span
                  className={`${isConnected ? "text-green-800" : serialSupported ? "text-blue-800" : "text-red-800"}`}
                >
                  {isConnected ? "✅" : serialSupported ? "🔌" : "❌"} {connectionStatus}
                </span>
              </div>
            </div>

            {isConnected && (
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-3 rounded-lg border ${writerReady ? "bg-green-100 border-green-300" : "bg-red-100 border-red-300"}`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔒</div>
                    <div className="text-sm font-medium">Writer V14 FIXED</div>
                    <div className="text-xs">
                      {writerRef.current ? "✅ Bloqueado" : "❌ Null"} | {writerReady ? "✅ Ready" : "❌ Not Ready"}
                    </div>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-lg border ${
                    sensorStatus.includes("activado") ? "bg-green-100 border-green-300" : "bg-blue-100 border-blue-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">🔍</div>
                    <div className="text-sm font-medium">Sensor V14 FIXED</div>
                    <div className="text-xs">{sensorStatus}</div>
                  </div>
                </div>
              </div>
            )}

            {totalClicks > 0 && (
              <div className="p-4 bg-blue-100 rounded-lg">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-800 mb-1">{totalClicks}</div>
                  <div className="text-sm text-blue-600">Total Clicks Detectados V14 FIXED</div>
                  {lastClickTime && <div className="text-xs text-blue-500">Último: {lastClickTime}</div>}
                </div>
              </div>
            )}

            {sensorData && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-600">Último dato del sensor V14 FIXED:</p>
                <code
                  className={`text-sm font-mono font-bold ${
                    sensorData.toLowerCase() === "click" ? "text-green-600 animate-pulse" : "text-gray-600"
                  }`}
                >
                  {sensorData}
                </code>
              </div>
            )}

            {rawSerialData.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                <p className="text-xs text-gray-500 mb-2">Datos serie V14 FIXED recibidos:</p>
                {rawSerialData.map((data, index) => (
                  <div key={index} className="text-xs font-mono">
                    <span className="text-gray-400">{index + 1}:</span>{" "}
                    <span className={data.toLowerCase() === "click" ? "text-green-600 font-bold" : "text-gray-600"}>
                      {data}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <Button onClick={connectToNodeMCU} className="w-full text-lg py-6" disabled={isDetecting || isConnected}>
                🔌{" "}
                {isDetecting
                  ? "Conectando V14 FIXED..."
                  : isConnected
                    ? "NodeMCU V14 FIXED Conectado"
                    : "Conectar NodeMCU V14 FIXED"}
              </Button>

              {isConnected && (
                <div className="grid grid-cols-3 gap-2">
                  <Button onClick={testSensor} variant="outline" size="sm">
                    🧪 Probar V14 FIXED
                  </Button>
                  <Button onClick={requestSensorStatus} variant="outline" size="sm">
                    📊 Estado V14 FIXED
                  </Button>
                  <Button onClick={disconnectNodeMCU} variant="outline" size="sm">
                    🔌 Desconectar V14 FIXED
                  </Button>
                </div>
              )}

              <div className="text-sm text-gray-600 text-center">
                <p>
                  💡 <strong>NodeMCU es opcional</strong> - Puedes jugar con clicks también
                </p>
              </div>
            </div>

            {connectionLog.length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-xs text-blue-600 mb-2">Log de conexión V14 FIXED:</p>
                {connectionLog.map((log, index) => (
                  <div key={index} className="text-xs text-blue-800 mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}

            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
              <p className="text-sm font-bold text-gray-800 mb-3">
                📊 <strong>Estado Actual V14 FIXED:</strong>
              </p>
              <ul className="text-left space-y-2 text-sm">
                <li
                  className={`flex items-center gap-2 ${isConnected ? "text-green-700 font-semibold" : "text-gray-600"}`}
                >
                  {isConnected ? "✅" : "❌"}
                  <span className="font-medium">Conexión:</span>
                  {isConnected ? "OK - Puerto abierto" : "No conectado"}
                </li>
                <li
                  className={`flex items-center gap-2 ${writerReady ? "text-green-700 font-semibold" : "text-gray-600"}`}
                >
                  {writerReady ? "✅" : "❌"}
                  <span className="font-medium">Writer:</span>
                  {writerReady ? "BLOQUEADO (no se libera)" : "NO DISPONIBLE"}
                </li>
                <li
                  className={`flex items-center gap-2 ${totalClicks > 0 ? "text-green-700 font-semibold" : "text-gray-600"}`}
                >
                  {totalClicks > 0 ? "✅" : "🔍"}
                  <span className="font-medium">Recepción de "click":</span>
                  {totalClicks > 0 ? `OK V14 FIXED (${totalClicks} clicks)` : "Verificar sensor"}
                </li>
                <li className="flex items-center gap-2 text-blue-600">
                  📡 <span className="font-medium">Sensor HW-511 en D2:</span> Debe enviar "click" al activarse
                </li>
                {isConnected && (
                  <li className="flex items-center gap-2 text-purple-600 mt-2 pt-2 border-t border-purple-200">
                    🔧 <span className="font-medium">Diagnóstico V14 FIXED:</span>
                    Writer {writerRef.current ? "presente y bloqueado" : "ausente"}, Ready: {writerReady ? "sí" : "no"}
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
            onClick={startLocalMultiplayer}
          >
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">👥</div>
              <CardTitle className="text-xl">Multijugador Local</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-gray-600">2 jugadores en el mismo dispositivo</p>
              <div className="text-sm space-y-1">
                <p>
                  🔵 <strong>Jugador 1:</strong> {isConnected ? "Sensor NodeMCU V14 FIXED" : "Click izquierdo"}
                </p>
                <p>
                  🔴 <strong>Jugador 2:</strong> Tecla ESPACIO
                </p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">¡Competir Ahora!</Button>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-xl transition-all cursor-pointer transform hover:scale-105"
            onClick={startBotRace}
          >
            <CardHeader className="text-center pb-4">
              <div className="text-6xl mb-4">🤖</div>
              <CardTitle className="text-xl">Carrera con Bots</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-3">
              <p className="text-gray-600">Compite contra IA inteligente</p>
              <div className="text-sm space-y-1">
                <p>
                  🔵 <strong>Tú:</strong> {isConnected ? "Sensor NodeMCU V14 FIXED" : "Click/Espacio"}
                </p>
                <p>
                  🔴 <strong>Bot Rápido:</strong> IA Agresiva
                </p>
                <p>
                  🟢 <strong>Bot Medio:</strong> IA Equilibrada
                </p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">¡Desafiar Bots!</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  const renderRaceTrack = () => {
    const player1 = gameState.players.find((p) => p.id === "player1") || gameState.players[0]

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-400 via-green-300 to-yellow-300 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-400 to-blue-300">
          <div className="absolute top-10 left-10 text-4xl animate-bounce">☁️</div>
          <div className="absolute top-16 right-20 text-3xl animate-pulse">☁️</div>
          <div className="absolute top-8 left-1/2 text-5xl">☀️</div>
        </div>

        <div className="absolute top-4 left-0 right-0 z-20">
          <div className="flex justify-between items-center px-6">
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              <div className="text-2xl font-bold">
                ⏱️ {Math.floor(gameState.timeLeft / 60)}:{(gameState.timeLeft % 60).toString().padStart(2, "0")}
              </div>
            </div>
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              <div className="text-lg">🏁 Meta: {gameState.raceDistance}m</div>
            </div>
            <div className="bg-black/80 text-white px-4 py-2 rounded-lg">
              <div className="text-lg">🎮 V14 FIXED</div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-2/3">
          <div className="absolute inset-0 bg-gray-600">
            <div className="absolute left-1/3 top-0 bottom-0 w-1 bg-white opacity-80"></div>
            <div className="absolute left-2/3 top-0 bottom-0 w-1 bg-white opacity-80"></div>

            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-8 bg-yellow-300 opacity-60 animate-pulse"
                style={{
                  left: `${10 + (i % 3) * 30}%`,
                  top: `${(i * 5) % 100}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              ></div>
            ))}
          </div>

          <div className="absolute inset-0 grid grid-cols-3 gap-0">
            {gameState.players.map((player, index) => (
              <div key={player.id} className="relative h-full border-x border-white/30">
                <div
                  className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-300 text-6xl"
                  style={{
                    bottom: `${Math.max(10, player.position)}%`,
                    filter: player.velocidad > 20 ? "drop-shadow(0 0 10px rgba(59, 130, 246, 0.8))" : "none",
                    transform: `translateX(-50%) ${player.velocidad > 15 ? "scale(1.1)" : "scale(1)"}`,
                  }}
                >
                  {player.inputMethod === "bot" ? "🤖" : "🚴‍♂️"}
                </div>

                <div className="absolute top-4 left-2 right-2">
                  <div className={`bg-${player.color}-600 text-white p-2 rounded-lg text-center`}>
                    <div className="text-lg font-bold">{player.name}</div>
                    <div className="text-sm">{Math.round(player.velocidad)} km/h</div>
                    <div className="text-xs">{Math.round(player.distancia)}m</div>
                    <div className="text-xs">Clicks: {player.clickCount}</div>
                    {player.inputMethod === "sensor" && <div className="text-xs">📡 Sensor V14 FIXED</div>}
                  </div>
                  <Progress value={player.position} className="mt-2 h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 z-20">
          <div className="flex justify-center space-x-4">
            {player1?.inputMethod === "click" && (
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl"
                onClick={() => handlePlayerInput("player1", "click")}
              >
                🚴‍♂️ PEDALEAR (Click)
              </Button>
            )}

            {gameState.gameMode === "local" && (
              <div className="text-white bg-black/80 px-4 py-2 rounded-lg text-center">
                <div className="text-sm">Jugador 2: Presiona ESPACIO</div>
              </div>
            )}

            {isConnected && (
              <div className="text-white bg-green-600/80 px-4 py-2 rounded-lg text-center">
                <div className="text-sm">📡 NodeMCU V14 FIXED Conectado</div>
                <div className="text-xs">
                  Writer: {writerReady ? "🔒 BLOQUEADO" : "❌ NO LISTO"} | Clicks: {totalClicks}
                </div>
              </div>
            )}
          </div>
        </div>

        {gameState.winner && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
            <div className="bg-white p-8 rounded-lg text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-3xl font-bold mb-4">
                ¡{gameState.players.find((p) => p.id === gameState.winner)?.name} GANÓ!
              </h2>
              <p className="text-lg text-gray-600">Preparando resultados...</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderResultados = () => {
    const winner = gameState.players.find((p) => p.id === gameState.winner)
    const sortedPlayers = [...gameState.players].sort((a, b) => b.distancia - a.distancia)

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-5xl font-bold text-white drop-shadow-lg">🏁 RESULTADOS V14 FIXED</h1>

          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-8 space-y-6">
              {winner && (
                <div className="text-center mb-8">
                  <div className="text-8xl mb-4">🏆</div>
                  <h2 className="text-4xl font-bold text-yellow-600 mb-2">¡{winner.name} CAMPEÓN!</h2>
                  <p className="text-xl text-gray-600">
                    Distancia: {Math.round(winner.distancia)}m • Clicks: {winner.clickCount}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-2xl font-bold">🏅 Clasificación Final</h3>
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      index === 0
                        ? "bg-yellow-100 border-2 border-yellow-400"
                        : index === 1
                          ? "bg-gray-100 border-2 border-gray-400"
                          : index === 2
                            ? "bg-orange-100 border-2 border-orange-400"
                            : "bg-blue-50 border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">
                        {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}°`}
                      </div>
                      <div>
                        <div className="font-bold text-lg">{player.name}</div>
                        <div className="text-sm text-gray-600">
                          {player.inputMethod === "sensor"
                            ? "📡 Sensor NodeMCU V14 FIXED"
                            : player.inputMethod === "bot"
                              ? "🤖 Bot IA"
                              : "👆 Clicks"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl">{Math.round(player.distancia)}m</div>
                      <div className="text-sm text-gray-600">
                        {Math.round(player.velocidad)} km/h • {player.clickCount} clicks
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800 mb-2">{totalClicks}</div>
                <p className="text-blue-600">Total de clicks V14 FIXED detectados</p>
                {isConnected && (
                  <p className="text-xs text-blue-500">📡 Conexión NodeMCU V14 FIXED: Writer BLOQUEADO</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Button
                  onClick={() => {
                    setCurrentPage("inicio")
                    setGameState((prev) => ({ ...prev, gameActive: false, players: [], winner: null }))
                  }}
                  className="w-full text-lg py-4"
                >
                  🏠 Volver al Inicio
                </Button>
                <Button
                  onClick={() => {
                    setGameState((prev) => ({
                      ...prev,
                      gameActive: true,
                      timeLeft: prev.gameMode === "local" ? 120 : 90,
                      winner: null,
                      players: prev.players.map((p) => ({
                        ...p,
                        velocidad: 0,
                        distancia: 0,
                        clickCount: 0,
                        position: 0,
                      })),
                    }))
                    setCurrentPage("raceTrack")
                    startGameTimer()
                    if (gameState.gameMode === "bot") startBotBehavior()
                  }}
                  variant="outline"
                  className="w-full text-lg py-4"
                >
                  🔄 Revancha
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameState.gameActive) return

      if (e.code === "Space") {
        e.preventDefault()
        if (gameState.gameMode === "local") {
          handlePlayerInput("player2", "click")
        } else {
          handlePlayerInput("player1", "click")
        }
      }
    }

    document.addEventListener("keydown", handleKeyPress)
    return () => document.removeEventListener("keydown", handleKeyPress)
  }, [gameState.gameActive, gameState.gameMode])

  useEffect(() => {
    return () => {
      cleanupConnection()
    }
  }, [])

  return (
    <div className="min-h-screen">
      {currentPage === "inicio" && renderInicio()}
      {currentPage === "raceTrack" && renderRaceTrack()}
      {currentPage === "resultados" && renderResultados()}
    </div>
  )
}
