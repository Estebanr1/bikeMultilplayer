/*
 * ===================================================================
 * BIKE RACE GAME - NodeMCU + Sensor HW-511
 * VERSIÓN 15 STABLE - Código Corregido para problema "?"
 * ===================================================================
 * 
 * CONEXIONES:
 * - Sensor HW-511 VCC → NodeMCU 3.3V
 * - Sensor HW-511 GND → NodeMCU GND
 * - Sensor HW-511 OUT → NodeMCU D2
 * 
 * CONFIGURACIÓN MONITOR SERIE:
 * - Velocidad: 115200 baudios
 * - Final de línea: "Ambos NL & CR"
 * 
 */

const int sensorPin = D2;        // Pin del sensor infrarrojo
const int ledPin = LED_BUILTIN;  // LED integrado del NodeMCU

// Variables de estado
bool lastState = HIGH;
unsigned long lastTime = 0;
const unsigned long DEBOUNCE_DELAY = 300; // Anti-rebote en milisegundos

void setup() {
  // Inicializar comunicación serial con baudrate correcto
  Serial.begin(115200);
  
  // IMPORTANTE: Esperar a que el serial esté listo
  while (!Serial) {
    ; // Esperar conexión serial
  }
  
  // Pequeño delay adicional para estabilización
  delay(1000);
  
  // Configurar pines
  pinMode(sensorPin, INPUT_PULLUP);
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH); // LED apagado (en NodeMCU HIGH = apagado)
  
  // Mensajes de inicialización
  Serial.println();
  Serial.println("=================================");
  Serial.println("BIKE RACE GAME V15 STABLE");
  Serial.println("NodeMCU + Sensor HW-511");
  Serial.println("=================================");
  Serial.println();
  Serial.println("Sistema listo para detectar sensor");
  Serial.println("Esperando activacion...");
  Serial.println();
  
  // Parpadeo de confirmación
  for (int i = 0; i < 3; i++) {
    digitalWrite(ledPin, LOW);
    delay(200);
    digitalWrite(ledPin, HIGH);
    delay(200);
  }
}

void loop() {
  // Leer estado actual del sensor
  bool currentState = digitalRead(sensorPin);
  
  // Detectar flanco descendente (HIGH → LOW = objeto detectado)
  if (currentState == LOW && lastState == HIGH) {
    unsigned long currentTime = millis();
    
    // Anti-rebote: solo procesar si pasó suficiente tiempo
    if (currentTime - lastTime > DEBOUNCE_DELAY) {
      // ENVIAR MENSAJE SIMPLE Y CLARO
      Serial.println("click");
      
      // Feedback visual con LED
      digitalWrite(ledPin, LOW);  // Encender LED
      delay(100);
      digitalWrite(ledPin, HIGH); // Apagar LED
      
      // Actualizar tiempo del último click
      lastTime = currentTime;
    }
  }
  
  // Guardar estado para próxima iteración
  lastState = currentState;
  
  // Procesar comandos desde la aplicación web
  if (Serial.available() > 0) {
    String comando = Serial.readStringUntil('\n');
    comando.trim(); // Eliminar espacios y saltos de línea
    
    procesarComando(comando);
  }
  
  // Delay pequeño para estabilidad
  delay(10);
}

void procesarComando(String cmd) {
  if (cmd == "TEST_SENSOR") {
    // Comando de prueba - simular activación
    Serial.println("click");
    
    // Parpadeo largo de confirmación
    digitalWrite(ledPin, LOW);
    delay(200);
    digitalWrite(ledPin, HIGH);
    
    Serial.println("Prueba completada");
  }
  else if (cmd == "STATUS") {
    // Reportar estado actual del sistema
    Serial.println("=== ESTADO DEL SISTEMA ===");
    Serial.print("Sensor: ");
    Serial.println(digitalRead(sensorPin) == HIGH ? "HIGH (sin objeto)" : "LOW (objeto detectado)");
    Serial.print("LED: ");
    Serial.println(digitalRead(ledPin) == HIGH ? "OFF" : "ON");
    Serial.print("Uptime: ");
    Serial.print(millis() / 1000);
    Serial.println(" segundos");
    Serial.println("==========================");
  }
  else if (cmd == "INIT") {
    // Comando de inicialización desde la app
    Serial.println("NodeMCU inicializado correctamente");
    
    // Parpadeo de confirmación
    for (int i = 0; i < 3; i++) {
      digitalWrite(ledPin, LOW);
      delay(100);
      digitalWrite(ledPin, HIGH);
      delay(100);
    }
  }
  else if (cmd == "PING") {
    // Comando ping-pong para verificar comunicación
    Serial.println("PONG");
  }
  else if (cmd != "") {
    // Comando no reconocido
    Serial.print("Comando no reconocido: ");
    Serial.println(cmd);
  }
}
