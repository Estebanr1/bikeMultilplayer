# 🌐 Guía de Despliegue - Bike Race Game V16

## 🚀 Opciones para Subir a Internet

### **Opción 1: GitHub Pages (GRATIS y FÁCIL)** ⭐ RECOMENDADO

#### Pasos:

1. **Crear cuenta en GitHub** (si no tienes):
   - Ve a [github.com](https://github.com)
   - Crea una cuenta gratis

2. **Crear repositorio:**
   - Click en "New repository"
   - Nombre: `bike-race-game`
   - Público ✅
   - Click en "Create repository"

3. **Subir archivos:**
   - Arrastra `index.html`, `game.js`, y todos los archivos
   - O usa GitHub Desktop
   - Commit: "Initial commit"

4. **Activar GitHub Pages:**
   - Ve a Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/root`
   - Click en "Save"

5. **¡Listo! Tu URL será:**
   \`\`\`
   https://tu-usuario.github.io/bike-race-game
   \`\`\`

**Ventajas:**
- ✅ 100% GRATIS
- ✅ HTTPS automático (necesario para Web Serial API)
- ✅ Fácil de actualizar
- ✅ PeerJS funciona perfectamente

---

### **Opción 2: Netlify (GRATIS)** 

#### Pasos:

1. **Ir a [netlify.com](https://netlify.com)**
2. **Sign up gratis**
3. **Drag & Drop:**
   - Arrastra la carpeta con tus archivos
   - O conecta tu repo de GitHub
4. **¡Listo! URL automática:**
   \`\`\`
   https://tu-proyecto.netlify.app
   \`\`\`

**Ventajas:**
- ✅ GRATIS
- ✅ Deploy instantáneo
- ✅ HTTPS automático
- ✅ Dominio personalizado gratis

---

### **Opción 3: Vercel (GRATIS)**

#### Pasos:

1. **Ir a [vercel.com](https://vercel.com)**
2. **Sign up con GitHub**
3. **Import Project:**
   - Conecta tu repositorio
   - Click en "Deploy"
4. **URL:**
   \`\`\`
   https://tu-proyecto.vercel.app
   \`\`\`

---

### **Opción 4: Servidor Propio**

Si tienes hosting web (cPanel, etc):

1. Sube los archivos por FTP
2. Asegúrate de tener HTTPS (necesario para Web Serial)
3. Listo

---

## 🔧 Configuración Post-Deploy

### **Para que el Multijugador Online funcione:**

1. ✅ **Debe estar en HTTPS** (GitHub Pages, Netlify y Vercel lo dan automático)
2. ✅ **PeerJS debe cargar** (está en el CDN, funciona automático)
3. ✅ **Ambos jugadores deben abrir la MISMA URL**

### **Ejemplo de uso:**

**Jugador 1:**
1. Abre: `https://tu-usuario.github.io/bike-race-game`
2. Click en "Jugar Online"
3. Click en "Crear Sala"
4. Obtiene código: `AB12`
5. Comparte la URL Y el código con Jugador 2

**Jugador 2:**
1. Abre: `https://tu-usuario.github.io/bike-race-game`
2. Click en "Jugar Online"
3. Click en "Unirse a Sala"
4. Ingresa: `AB12`
5. ¡Conectados!

---

## 🐛 Solución de Problemas

### ❌ "PeerJS no disponible"
- Verifica tu conexión a internet
- Abre la consola del navegador (F12)
- Recarga la página

### ❌ "No se puede conectar"
- Ambos jugadores deben estar en la MISMA URL
- Verifica que sea HTTPS
- Intenta en modo incógnito

### ❌ "El sensor no funciona en la web"
- Normal: Web Serial API solo funciona en archivos descargados
- Opción 1: Descarga el juego para usar sensor
- Opción 2: Juega online con clicks manuales

---

## 📱 Compartir con Amigos

Envía esto:

\`\`\`
🚴‍♂️ ¡Juguemos Bike Race!

1. Entra a: https://tu-usuario.github.io/bike-race-game
2. Click en "Jugar Online"
3. Click en "Unirse a Sala"
4. Ingresa el código: [TU_CODIGO]
5. ¡A competir! 🏁
\`\`\`

---

## 🎯 Checklist Final

Antes de jugar online:

- [ ] Juego subido a GitHub Pages / Netlify / Vercel
- [ ] URL en HTTPS
- [ ] Ambos jugadores en la misma URL
- [ ] PeerJS cargando (ver consola)
- [ ] Código de sala compartido
- [ ] ¡Listo para competir! 🏆

---

## 💡 Tips

1. **Para jugar con sensor:** Descarga los archivos y abre localmente
2. **Para jugar online:** Sube a GitHub Pages y comparte la URL
3. **Lo mejor de ambos:** Jugador 1 con sensor local, Jugador 2 online con clicks

---

## 📞 Comandos Git Básicos

Si usas terminal:

\`\`\`bash
# Primera vez
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/bike-race-game.git
git push -u origin main

# Actualizaciones
git add .
git commit -m "Update game"
git push
\`\`\`

---

**Versión:** V16 ONLINE con PeerJS
**Fecha:** 2025-01-05
