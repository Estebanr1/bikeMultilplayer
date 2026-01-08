"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface Player {
  id: string
  name: string
  velocidad: number
  distancia: number
  clickCount: number
  position: number
  color: string
}

interface GameState {
  gameActive: boolean
  timeLeft: number
  players: Player[]
  gameMode: "single" | "multi" | "online-host" | "online-join"
  raceDistance: number
  winner: string | null
}

export default function BikeRaceV16() {
  const [currentPage, setCurrentPage] = useState("inicio")
  const [gameState, setGameState] = useState<GameState>({
    gameActive: false,
    timeLeft: 60,
    players: [],
    gameMode: "single",
    raceDistance: 1000,
    winner: null,
  })

  // Connection states
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState("V16 COMPLETE - Verificando compatibilidad...")
  const [serialSupported, setSerialSupported] = useState(false)
  const [connectionLog, setConnectionLog] = useState<string[]>([])
  const [totalClicks, setTotalClicks] = useState(0)
  const [ledStatus, setLedStatus] = useState(false)
  const [sensorStatus, setSensorStatus] = useState("Esperando...")
  const [lastClickTime, setLastClickTime] = useState<string>("")

  // Online states
  const [roomCode, setRoomCode] = useState("")
  const [inputRoomCode, setInputRoomCode] = useState("")
  const [isHost, setIsHost] = useState(false)
  const [isOnlineConnected, setIsOnlineConnected] = useState(false)
  const [onlineMode, setOnlineMode] = useState<"create" | "join" | null>(null)

  // Refs
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const velocityDecayRef = useRef<NodeJS.Timeout | null>(null)
  const serialPortRef = useRef<any>(null)
  const writerRef = useRef<any>(null)
  const readingActiveRef = useRef(false)
  const lastSensorTimeRef = useRef(Date.now())

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    console.log(`V16: ${timestamp}: ${message}`)
    setConnectionLog((prev) => [...prev.slice(-4), `${timestamp}: ${message}`])
  }, [])

  useEffect(() => {
    checkSerialSupport()
    addLog("V16 COMPLETE iniciada")
  }, [addLog])

  const checkSerialSupport = async () => {
    try {
      if (!("serial" in navigator)) {
        setSerialSupported(false)
        setConnectionStatus("Web Serial API no disponible. Usa Chrome/Edge.")
        return false
      }
      setSerialSupported(true)
      setConnectionStatus("Web Serial API disponible. Listo para conectar.")
      return true
    } catch {
      setSerialSupported(false)
      setConnectionStatus("Error verificando compatibilidad.")
      return false
    }
  }

  const connectToNodeMCU = async () => {
    const supported = await checkSerialSupport()
    if (!supported) {
      startManualMode()
      return
    }

    try {
      const port = await (navigator as any).serial.requestPort()
      await port.open({ baudRate: 115200 })

      serialPortRef.current = port
      setIsConnected(true)
      setConnectionStatus("Sensor conectado!")
      addLog("Sensor HW-511 conectado")

      const writer = port.writable.getWriter()
      writerRef.current = writer

      startReading(port)
    } catch (error: any) {
      if (error.name !== "NotFoundError") {
        startManualMode()
      }
    }
  }

  const startReading = async (port: any) => {
    if (readingActiveRef.current) return
    readingActiveRef.current = true

    let buffer = ""
    const readLoop = async () => {
      try {
        const reader = port.readable.getReader()
        while (port.readable && readingActiveRef.current) {
          try {
            const { value, done } = await reader.read()
            if (done) break
            if (value) {
              const text = new TextDecoder().decode(value, { stream: true })
              buffer += text
              const lines = buffer.split(/[\r\n]+/)
              buffer = lines.pop() || ""
              for (const line of lines) {
                const cleanLine = line.trim()
                if (cleanLine) processSerialData(cleanLine)
              }
            }
          } catch {
            break
          }
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
        reader.releaseLock()
      } catch {
        readingActiveRef.current = false
      }
    }
    readLoop()
  }

  const processSerialData = (data: string) => {
    const lowerData = data.toLowerCase()
    if (lowerData === "click" || lowerData === "sensor_activated" || data === "1") {
      addLog("SENSOR ACTIVADO!")
      setLedStatus(true)
      setTimeout(() => setLedStatus(false), 300)
      setTotalClicks((prev) => prev + 1)
      setLastClickTime(new Date().toLocaleTimeString())
      setSensorStatus("Sensor activado!")
      handlePlayerInput(1)
    }
  }

  const startManualMode = () => {
    setConnectionStatus("Modo manual activado")
    setIsConnected(true)
    addLog("Modo manual iniciado")
  }

  const handlePlayerInput = useCallback((playerNum: number) => {
    setGameState((prev) => {
      if (!prev.gameActive) return prev

      const currentTime = Date.now()
      const timeDiff = currentTime - lastSensorTimeRef.current
      lastSensorTimeRef.current = currentTime

      const speed = timeDiff < 200 ? 45 : timeDiff < 500 ? 35 : timeDiff < 1000 ? 25 : 15
      const distanceIncrement = 3 + speed / 8

      return {
        ...prev,
        players: prev.players.map((player, index) => {
          if (index === playerNum - 1) {
            const newDistancia = Math.min(prev.raceDistance, player.distancia + distanceIncrement)
            const newPosition = (newDistancia / prev.raceDistance) * 100

            if (newDistancia >= prev.raceDistance && !prev.winner) {
              setTimeout(() => endGame(player.id), 100)
            }

            return {
              ...player,
              velocidad: speed,
              distancia: newDistancia,
              clickCount: player.clickCount + 1,
              position: newPosition,
            }
          }
          return player
        }),
      }
    })
  }, [])

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && gameState.gameActive) {
        e.preventDefault()
        handlePlayerInput(2)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameState.gameActive, handlePlayerInput])

  const createPlayer = (id: string, name: string, color: string): Player => ({
    id,
    name,
    velocidad: 0,
    distancia: 0,
    clickCount: 0,
    position: 0,
    color,
  })

  const startGame = (mode: "single" | "multi" | "online-host" | "online-join") => {
    const players =
      mode === "single"
        ? [createPlayer("player1", "Jugador 1", "blue")]
        : [createPlayer("player1", "Jugador 1", "blue"), createPlayer("player2", "Jugador 2", "red")]

    setGameState({
      gameActive: true,
      players,
      gameMode: mode,
      timeLeft: 60,
      raceDistance: 1000,
      winner: null,
    })

    lastSensorTimeRef.current = Date.now()
    setCurrentPage("race")

    gameTimerRef.current = setInterval(() => {
      setGameState((prev) => {
        if (prev.timeLeft <= 1) {
          endGame(null)
          return { ...prev, timeLeft: 0 }
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 }
      })
    }, 1000)

    velocityDecayRef.current = setInterval(() => {
      setGameState((prev) => {
        if (!prev.gameActive) return prev
        return {
          ...prev,
          players: prev.players.map((p) => ({
            ...p,
            velocidad: Math.max(0, p.velocidad * 0.95),
          })),
        }
      })
    }, 1000)

    addLog(`Carrera iniciada - Modo: ${mode}`)
  }

  const endGame = (winnerId: string | null) => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (velocityDecayRef.current) clearInterval(velocityDecayRef.current)

    setGameState((prev) => {
      let winner = winnerId
      if (!winner && prev.players.length > 1) {
        const sorted = [...prev.players].sort((a, b) => b.distancia - a.distancia)
        winner = sorted[0].distancia > sorted[1].distancia ? sorted[0].id : null
      } else if (!winner && prev.players.length === 1) {
        winner = prev.players[0].distancia >= prev.raceDistance ? prev.players[0].id : null
      }
      return { ...prev, gameActive: false, winner }
    })

    setTimeout(() => setCurrentPage("results"), 500)
  }

  // Online functions
  const createRoom = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase()
    setRoomCode(code)
    setIsHost(true)
    setOnlineMode("create")
    addLog(`Sala creada: ${code}`)
  }

  const joinRoom = () => {
    setOnlineMode("join")
  }

  const connectToRoom = () => {
    if (inputRoomCode.length >= 4) {
      setRoomCode(inputRoomCode.toUpperCase())
      setIsOnlineConnected(true)
      setOnlineMode(null)
      addLog(`Conectado a sala: ${inputRoomCode}`)
    }
  }

  const resetGame = () => {
    setCurrentPage("inicio")
    setGameState({
      gameActive: false,
      timeLeft: 60,
      players: [],
      gameMode: "single",
      raceDistance: 1000,
      winner: null,
    })
    setRoomCode("")
    setInputRoomCode("")
    setIsHost(false)
    setIsOnlineConnected(false)
    setOnlineMode(null)
  }

  // Page: Inicio
  if (currentPage === "inicio") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Bike Race Game</h1>
            <Badge className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2">
              V16 COMPLETE - Vista de Arriba + Online
            </Badge>
          </div>

          {/* Sensor Connection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Conexion del Sensor</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`p-4 rounded-lg mb-4 ${isConnected ? "bg-green-100 border-green-300" : "bg-blue-100 border-blue-300"} border`}
              >
                <span className={isConnected ? "text-green-800" : "text-blue-800"}>{connectionStatus}</span>
              </div>

              {isConnected && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg border bg-blue-50">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🔍</div>
                      <div className="text-sm font-medium">Sensor HW-511</div>
                      <div className="text-xs">{sensorStatus}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <div className="text-center">
                      <div
                        className={`w-4 h-4 rounded-full mx-auto mb-1 ${ledStatus ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                      />
                      <div className="text-sm font-medium">LED NodeMCU</div>
                      <div className="text-xs">{ledStatus ? "ON" : "OFF"}</div>
                    </div>
                  </div>
                </div>
              )}

              {totalClicks > 0 && (
                <div className="p-4 bg-blue-100 rounded-lg mb-4 text-center">
                  <div className="text-3xl font-bold text-blue-800">{totalClicks}</div>
                  <div className="text-sm text-blue-600">Total Clicks</div>
                  {lastClickTime && <div className="text-xs text-blue-500">Ultimo: {lastClickTime}</div>}
                </div>
              )}

              <Button onClick={connectToNodeMCU} className="w-full" disabled={isConnected}>
                {isConnected ? "Sensor Conectado" : "Conectar Sensor USB"}
              </Button>
            </CardContent>
          </Card>

          {/* Connection Methods */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
              onClick={() => setCurrentPage("modeSelect")}
            >
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4">🔌</div>
                <h3 className="text-xl font-bold mb-2">Jugar Local</h3>
                <p className="text-gray-600 mb-4">Sensor fisico o clicks manuales</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Jugar Local</Button>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
              onClick={() => setCurrentPage("online")}
            >
              <CardContent className="p-6 text-center">
                <div className="text-5xl mb-4">🌐</div>
                <h3 className="text-xl font-bold mb-2">Multijugador Online</h3>
                <p className="text-gray-600 mb-4">Compite con jugadores remotos</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Jugar Online</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Page: Mode Select
  if (currentPage === "modeSelect") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Selecciona el Modo de Juego</h1>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👤</div>
                <h3 className="text-xl font-semibold mb-4">Individual</h3>
                <p className="text-gray-600 mb-6">Compite contra el tiempo</p>
                <Button onClick={() => startGame("single")} className="w-full bg-blue-600 hover:bg-blue-700">
                  Comenzar
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-xl transition-shadow">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-xl font-semibold mb-4">Multijugador Local</h3>
                <p className="text-gray-600 mb-6">2 jugadores: Sensor + Espacio</p>
                <Button onClick={() => startGame("multi")} className="w-full bg-green-600 hover:bg-green-700">
                  Competir
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" onClick={() => setCurrentPage("inicio")}>
              Volver
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Page: Online
  if (currentPage === "online") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                <span className="text-purple-600">🌐</span> Sala Multijugador Online
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!onlineMode && !isOnlineConnected && (
                <div className="grid grid-cols-2 gap-4">
                  <Button onClick={createRoom} className="h-24 bg-purple-600 hover:bg-purple-700">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🏠</div>
                      <div>Crear Sala</div>
                    </div>
                  </Button>
                  <Button onClick={joinRoom} className="h-24 bg-blue-600 hover:bg-blue-700">
                    <div className="text-center">
                      <div className="text-2xl mb-1">🚪</div>
                      <div>Unirse a Sala</div>
                    </div>
                  </Button>
                </div>
              )}

              {onlineMode === "create" && (
                <div className="text-center">
                  <h3 className="text-xl font-bold mb-4">Codigo de Sala</h3>
                  <div className="bg-purple-100 border-2 border-purple-300 rounded-lg p-6 mb-4">
                    <div className="text-5xl font-mono font-bold text-purple-600 mb-2">{roomCode}</div>
                    <p className="text-sm text-gray-600">Comparte este codigo con tu rival</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm">Esperando jugador 2...</p>
                    <p className="text-xs text-gray-600 mt-2">
                      El otro jugador debe ingresar este codigo para conectarse
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        setIsOnlineConnected(true)
                        setOnlineMode(null)
                      }}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Simular Conexion (Demo)
                    </Button>
                    <Button variant="outline" onClick={() => setOnlineMode(null)} className="w-full">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {onlineMode === "join" && (
                <div>
                  <label className="block text-sm font-bold mb-2">Codigo de Sala:</label>
                  <Input
                    type="text"
                    placeholder="Ingresa el codigo de 4 digitos"
                    maxLength={4}
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    className="text-2xl font-mono text-center mb-4"
                  />
                  <div className="space-y-2">
                    <Button onClick={connectToRoom} className="w-full bg-purple-600 hover:bg-purple-700">
                      Unirse a la Sala
                    </Button>
                    <Button variant="outline" onClick={() => setOnlineMode(null)} className="w-full">
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {isOnlineConnected && (
                <div className="text-center">
                  <div className="text-6xl mb-4 animate-pulse">📡</div>
                  <h3 className="text-2xl font-bold text-green-600 mb-2">Conectado!</h3>
                  <p className="text-gray-600 mb-4">Sala: {roomCode}</p>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-4">
                      <div className="text-3xl mb-2">👤</div>
                      <div className="font-bold">Jugador 1</div>
                      <div className="text-xs text-green-600">{isHost ? "Tu (Host)" : "Conectado"}</div>
                    </div>
                    <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
                      <div className="text-3xl mb-2">👤</div>
                      <div className="font-bold">Jugador 2</div>
                      <div className="text-xs text-green-600">{isHost ? "Conectado" : "Tu"}</div>
                    </div>
                  </div>

                  <Button
                    onClick={() => startGame(isHost ? "online-host" : "online-join")}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Iniciar Carrera
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-4">
            <Button variant="outline" onClick={() => setCurrentPage("inicio")}>
              Volver
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Page: Race (Vista de Arriba)
  if (currentPage === "race") {
    const player1 = gameState.players[0]
    const player2 = gameState.players[1]

    return (
      <div className="min-h-screen bg-gradient-to-b from-green-400 to-green-600 p-4">
        <div className="max-w-4xl mx-auto">
          {/* HUD */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Tiempo</div>
                  <div className="text-3xl font-bold text-red-600">{gameState.timeLeft}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Meta</div>
                  <div className="text-xl font-bold text-green-600">{gameState.raceDistance}m</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Modo</div>
                  <div className="text-xl font-bold text-purple-600">
                    {gameState.gameMode === "single"
                      ? "Individual"
                      : gameState.gameMode === "multi"
                        ? "Multijugador"
                        : "Online"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Race Track - Vista de Arriba */}
          <Card className="overflow-hidden" style={{ height: "500px" }}>
            <div className="relative h-full bg-gradient-to-b from-green-500 to-green-700">
              {/* Road lines animation */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0px, transparent 20px, #fbbf24 20px, #fbbf24 40px, transparent 40px, transparent 60px)`,
                  animation: "roadScroll 1s linear infinite",
                }}
              />

              {/* Finish Line */}
              <div
                className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center"
                style={{
                  background: `repeating-linear-gradient(45deg, #000, #000 20px, #fff 20px, #fff 40px)`,
                }}
              >
                <span className="text-white font-bold text-xs bg-black/50 px-2 py-1 rounded">META 🏁</span>
              </div>

              {/* Lanes */}
              <div className="absolute inset-0 flex">
                {/* Lane 1 */}
                <div className="flex-1 relative bg-gray-600 border-x-4 border-yellow-400">
                  {player1 && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
                      style={{ bottom: `${5 + player1.position * 0.85}%` }}
                    >
                      <div className="text-center">
                        <div className="text-5xl">🚴‍♂️</div>
                        <Badge className="mt-1 bg-blue-600">Jugador 1</Badge>
                        <div className="text-xs mt-1 space-x-1">
                          <span className="bg-white/80 px-2 py-1 rounded">{Math.round(player1.velocidad)} km/h</span>
                          <span className="bg-white/80 px-2 py-1 rounded">{Math.round(player1.distancia)}m</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Lane 2 */}
                {player2 && (
                  <div className="flex-1 relative bg-gray-600 border-x-4 border-yellow-400">
                    <div
                      className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
                      style={{ bottom: `${5 + player2.position * 0.85}%` }}
                    >
                      <div className="text-center">
                        <div className="text-5xl">🚴</div>
                        <Badge className="mt-1 bg-red-600">Jugador 2</Badge>
                        <div className="text-xs mt-1 space-x-1">
                          <span className="bg-white/80 px-2 py-1 rounded">{Math.round(player2.velocidad)} km/h</span>
                          <span className="bg-white/80 px-2 py-1 rounded">{Math.round(player2.distancia)}m</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Progress Bars */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <div className="space-y-4">
                {player1 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-blue-600">Jugador 1</span>
                      <span>{Math.round(player1.position)}%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${player1.position}%` }}
                      />
                    </div>
                  </div>
                )}
                {player2 && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-bold text-red-600">Jugador 2</span>
                      <span>{Math.round(player2.position)}%</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${player2.position}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Button
              onClick={() => handlePlayerInput(1)}
              className="h-20 text-xl bg-blue-600 hover:bg-blue-700"
              disabled={!gameState.gameActive}
            >
              🚴‍♂️ Jugador 1 (Click/Sensor)
            </Button>
            {player2 && (
              <Button
                onClick={() => handlePlayerInput(2)}
                className="h-20 text-xl bg-red-600 hover:bg-red-700"
                disabled={!gameState.gameActive}
              >
                🚴 Jugador 2 (Espacio)
              </Button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes roadScroll {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 0 60px;
            }
          }
        `}</style>
      </div>
    )
  }

  // Page: Results
  if (currentPage === "results") {
    const winner = gameState.players.find((p) => p.id === gameState.winner)
    const sorted = [...gameState.players].sort((a, b) => b.distancia - a.distancia)

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-3xl">Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-8">
                {winner ? (
                  <>
                    <div className="text-6xl mb-4">🏆</div>
                    <h2
                      className="text-2xl font-bold"
                      style={{ color: winner.color === "blue" ? "#2563eb" : "#dc2626" }}
                    >
                      {winner.name} GANO!
                    </h2>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🤝</div>
                    <h2 className="text-2xl font-bold text-purple-600">EMPATE!</h2>
                  </>
                )}
              </div>

              <div className="space-y-4">
                {sorted.map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg border-2 ${index === 0 ? "bg-yellow-100 border-yellow-400" : "bg-gray-100 border-gray-300"}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</span>
                        <span className="font-bold">{player.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{Math.round(player.distancia)}m</div>
                        <div className="text-sm text-gray-600">{player.clickCount} clicks</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 space-y-2">
                <Button
                  onClick={() => startGame(gameState.gameMode)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Jugar de Nuevo
                </Button>
                <Button variant="outline" onClick={resetGame} className="w-full bg-transparent">
                  Volver al Inicio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}
