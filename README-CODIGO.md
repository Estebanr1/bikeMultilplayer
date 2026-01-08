# 🔧 Instrucciones de Instalación del Código NodeMCU

## ⚠️ SOLUCIÓN AL PROBLEMA DEL "?"

El símbolo "?" aparece cuando hay problemas de comunicación serial. Aquí está la solución:

### 📋 Pasos CRÍTICOS:

#### 1️⃣ **Configuración del Arduino IDE:**

\`\`\`
Herramientas → Placa → ESP8266 Boards → NodeMCU 1.0 (ESP-12E Module)
Herramientas → Upload Speed → 115200
Herramientas → CPU Frequency → 80 MHz
Herramientas → Flash Size → 4MB (FS:2MB OTA:~1019KB)
Herramientas → Puerto → [Selecciona tu puerto COM]
\`\`\`

#### 2️⃣ **Configuración del Monitor Serie:**

\`\`\`
⚙️ Velocidad (baudios): 115200
📝 Final de línea: "Ambos NL & CR"
\`\`\`

**IMPORTANTE:** Si ves "?" es porque:
- ❌ Baudrate incorrecto (debe ser 115200)
- ❌ Final de línea mal configurado
- ❌ Cable USB de mala calidad (usa uno de datos)

#### 3️⃣ **Subir el Código:**

1. Copia el código `nodemcu-sensor-hw511.ino`
2. Pégalo en Arduino IDE
3. Presiona **Verificar** (✓) para compilar
4. Presiona **Subir** (→) para cargar al NodeMCU
5. Espera el mensaje "Done uploading"

#### 4️⃣ **Verificar Funcionamiento:**

Abre el Monitor Serie y deberías ver:

\`\`\`
=================================
BIKE RACE GAME V15 STABLE
NodeMCU + Sensor HW-511
=================================

Sistema listo para detectar sensor
Esperando activacion...
\`\`\`

Luego, al pasar tu mano frente al sensor:

\`\`\`
click
click
click
\`\`\`

## 🔍 Diagnóstico de Problemas

### ❌ Problema: Sigo viendo "?" 

**Solución:**

1. **Verifica baudrate:**
   - Arduino IDE: `Serial.begin(115200);` ✅
   - Monitor Serie: `115200` ✅

2. **Prueba diferentes baudrates:**
   \`\`\`cpp
   // Prueba con estos en orden:
   Serial.begin(115200); // Primero
   Serial.begin(9600);   // Si falla
   Serial.begin(57600);  // Si falla
   \`\`\`

3. **Reinicia el NodeMCU:**
   - Presiona el botón RST del NodeMCU
   - O desconecta y reconecta el USB

### ❌ Problema: No veo nada en Monitor Serie

**Solución:**

1. Verifica que seleccionaste el puerto correcto
2. Presiona el botón RST del NodeMCU
3. Cierra y abre el Monitor Serie
4. Prueba otro cable USB

### ❌ Problema: Veo mensajes pero no "click"

**Solución:**

1. Verifica conexiones físicas:
   \`\`\`
   HW-511 VCC → NodeMCU 3.3V ✅
   HW-511 GND → NodeMCU GND ✅
   HW-511 OUT → NodeMCU D2  ✅
   \`\`\`

2. El sensor HW-511 tiene un LED que debería encenderse al detectar
3. Ajusta el potenciómetro del sensor (sensibilidad)
4. Prueba a diferentes distancias (5-30cm)

## ✅ Qué Deberías Ver

### Al Iniciar:
\`\`\`
=================================
BIKE RACE GAME V15 STABLE
NodeMCU + Sensor HW-511
=================================

Sistema listo para detectar sensor
Esperando activacion...
\`\`\`

### Al Activar Sensor:
\`\`\`
click
click
click
\`\`\`

### Al Enviar "STATUS":
\`\`\`
=== ESTADO DEL SISTEMA ===
Sensor: HIGH (sin objeto)
LED: OFF
Uptime: 45 segundos
==========================
\`\`\`

## 🎮 Comandos Disponibles

Puedes escribir estos comandos en el Monitor Serie:

| Comando | Descripción |
|---------|-------------|
| `TEST_SENSOR` | Simula activación del sensor |
| `STATUS` | Muestra estado completo del sistema |
| `INIT` | Reinicializa el sistema |
| `PING` | Verifica comunicación (responde "PONG") |

## 🔧 Si NADA Funciona

**Plan B - Código Minimalista:**

\`\`\`cpp
void setup() {
  Serial.begin(115200);
  pinMode(D2, INPUT_PULLUP);
  pinMode(LED_BUILTIN, OUTPUT);
  delay(2000);
  Serial.println("INICIO");
}

void loop() {
  if (digitalRead(D2) == LOW) {
    Serial.println("click");
    digitalWrite(LED_BUILTIN, LOW);
    delay(100);
    digitalWrite(LED_BUILTIN, HIGH);
    delay(300);
  }
  delay(10);
}
\`\`\`

Este código es ultra simple y debería funcionar siempre.

## 📞 Checklist Final

- [ ] Arduino IDE instalado con soporte ESP8266
- [ ] Placa seleccionada: NodeMCU 1.0
- [ ] Baudrate: 115200 en código Y en Monitor Serie
- [ ] Cable USB de DATOS (no solo carga)
- [ ] Conexiones físicas verificadas
- [ ] LED del sensor se enciende al detectar
- [ ] Monitor Serie muestra "Sistema listo..."
- [ ] Al activar sensor veo "click"

## 🎯 Siguiente Paso

Una vez que veas "click" en el Monitor Serie:

1. ✅ **CIERRA el Monitor Serie**
2. 🌐 Abre `index.html` en Chrome/Edge
3. 🔌 Click en "Conectar NodeMCU"
4. 🎮 ¡A jugar!

---

**Versión:** 15 STABLE - Código probado y funcionando
**Fecha:** 2025-01-03
