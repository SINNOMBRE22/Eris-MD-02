<p align="center">
  <img src="./src/imagenes/perfil001.gif" alt="Eris-MD" width="350"/>
</p>

<h1 align="center"> 🌸 Ｅｒｉｓ － ＭＤ 🌸 </h1>
<p align="center">
  <b>Bot de WhatsApp Multi-Device rápido, optimizado y con estilo anime. ✨</b>
</p>

<p align="center">
  <a href="https://github.com/SINNOMBRE22/Eris-MD-02/stargazers"><img src="https://img.shields.io/github/stars/SINNOMBRE22/Eris-MD-02?color=ff69b4&style=for-the-badge&logo=github" alt="Stars"></a>
  <a href="https://github.com/SINNOMBRE22/Eris-MD-02/network/members"><img src="https://img.shields.io/github/forks/SINNOMBRE22/Eris-MD-02?color=ff69b4&style=for-the-badge&logo=github" alt="Forks"></a>
  <a href="#"><img src="https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=for-the-badge&logo=react" alt="Maintained"></a>
</p>

---

## 🚀 Instalación Automática (VPS / Linux)

Solo **3 pasos**. El instalador se encarga de Node.js, FFmpeg, dependencias y permisos.

### 1️⃣ Clonar el repositorio
```bash
git clone https://github.com/SINNOMBRE22/Eris-MD-02.git && cd Eris-MD-02
```

### 2️⃣ Ejecutar el instalador
```bash
bash install.sh
```
> Instala **todo** automáticamente. Al terminar te muestra los comandos para iniciar.

### 3️⃣ Configurar tus datos
Edita **`settings.js`** con tu número de owner (ver sección de abajo).

---

## ▶️ Iniciar el Bot

**Modo normal** (para probar / escanear código):
```bash
node index.js
```

**Modo 24/7 con PM2** (recomendado en VPS):
```bash
bash pm2-bot.sh
```

Cuando inicies te pedirá el método de conexión:
- **Opción 1** → Escanear código QR
- **Opción 2** → Código de 8 dígitos (ingresa tu número **sin el `1`**, ej. `525629885039`)

---

## 🔧 Comandos PM2 útiles

| Comando | Descripción |
|---|---|
| `pm2 logs eris-bot` | Ver la consola (aquí sale el QR o el código) |
| `pm2 restart eris-bot` | Reiniciar el bot |
| `pm2 stop eris-bot` | Detener el bot |
| `pm2 delete eris-bot` | Eliminar el proceso |
| `pm2 list` | Ver todos los procesos |

---

## ⚙️ Configuración (`settings.js`)

Edita tus datos en **`settings.js`** (no existe `config.js`):

```js
// Números owner: [ 'numero', 'nombre', true ]
global.owner = [
  ['525629885039', 'SinNombre', true],
]

global.packname = 'Eris'
global.author   = 'SinNombre'
global.namebot  = 'Eris Bot'
```

> El **prefijo** se define en `index.js` como expresión regular y por defecto
> acepta `#`, `/`, `!` y `.` :
> ```js
> global.prefix = new RegExp('^[#/!.]')
> ```

---

## 🩺 Solución de problemas

- **"No se pudo vincular el dispositivo"** → El número debe ir **sin el `1`** de México (ej. `525629885039`, no `5215629885039`) y ser exactamente el de la cuenta de WhatsApp donde metes el código.
- **El código expira** → Tienes ~60 segundos. Ve rápido a WhatsApp → Dispositivos vinculados → Vincular con número de teléfono.
- **Error de dependencias en `npm install`** → El instalador ya usa `--legacy-peer-deps`. Si instalas a mano, usa `npm install --legacy-peer-deps`.

---

## 🤝 Soporte y Contacto

<p align="center">
  <a href="https://wa.me/525629885039">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp">
  </a>
</p>

<p align="center">
  Desarrollado con ❤️ por <a href="https://github.com/SINNOMBRE22">SINNOMBRE22</a>.<br>
  <i>¡No olvides dejar tu ⭐ si te sirvió el bot!</i>
</p>
