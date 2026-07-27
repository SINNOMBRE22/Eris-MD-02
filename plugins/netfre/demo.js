import { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = promisify(_exec)

// ==========================================
// FUNCIÓN AUXILIAR: EL MENÚ PRINCIPAL
// ==========================================
// Separamos el menú en una función para poder llamarlo desde cualquier parte
const sendMainMenu = async (conn, m, splitName) => {
    const sections = [
        {
            title: "🚀 INICIO RÁPIDO",
            rows: [
                { title: "1️⃣ Prueba Gratuita ⏳", rowId: `demo_auto`, description: "Genera acceso de 3 días" },
                { title: "2️⃣ Descargar App 📦", rowId: `link_app`, description: "Obtén nuestra aplicación oficial" }
            ]
        },
        {
            title: "🛠️ GESTIÓN DE CUENTA",
            rows: [
                { title: "3️⃣ Mi Tiempo Restante 🕒", rowId: `tiempo_restante`, description: "Verifica tu vigencia" },
                { title: "4️⃣ Menú de Ayuda ℹ️", rowId: `ayuda_vps`, description: "Soporte técnico y tutoriales" }
            ]
        },
        {
            title: "💎 PLANES PREMIUM",
            rows: [
                { title: "5️⃣ Ver Precios y Planes 💲", rowId: `precios_vps`, description: "Conoce nuestras tarifas VIP" }
            ]
        }
    ]

    const listMessage = {
        text: `*【 👑 SinNombre VPN 】*\n\nHola @${splitName} 👋. Bienvenido al panel de autogestión.\n\n` +
              `*Información del Servicio:*\n` +
              `🟢 Estado: Servidores activos 24/7 en México 🇲🇽.\n` +
              `🔥 Promo actual: 30 DÍAS por $50 MXN (Acceso completo, sin caídas y máxima velocidad).\n\n` +
              `_Selecciona una opción del menú para comenzar:_`,
        footer: "© SinNombre Digital Services",
        buttonText: "📋 ABRIR MENÚ",
        sections
    }
    return conn.sendMessage(m.chat, listMessage, { quoted: m })
}

// ==========================================
// 1. COMANDOS PRINCIPALES
// ==========================================
let handler = async (m, { conn, text, command, usedPrefix }) => {
  if (!m.sender || typeof m.sender !== 'string' || !m.sender.endsWith('@s.whatsapp.net')) return
  if (m.isGroup) return m.reply('❌ *Error:* El panel VPS solo funciona en Chat Privado.')

  const rawOwner = String(global.owner[0][0]).replace(/\D/g, '').slice(-10)
  const rawSender = m.sender.replace(/\D/g, '').slice(-10)
  const isOwner = rawSender === rawOwner || m.fromMe
  const splitName = m.sender.split('@')[0]

  let txt = text ? text.trim() : ''

  // 👑 MODO ADMINISTRADOR (PREMIUM ILIMITADO)
  if (isOwner) {
    if (!txt) return m.reply(`*👑 MODO DIOS ACTIVO*\n\nUsa: \`${usedPrefix + command} Usuario/Clave/Dias\``)

    let [user, pass, days] = txt.split('/')
    if (!user || !pass || !days) return m.reply(`⚠️ Formato: Nombre/Clave/Dias\nEjemplo: ${usedPrefix + command} Cliente1/123/30`)

    user = user.replace(/[^a-zA-Z0-9]/g, '') 
    await m.reply(`🚀 *Iniciando creación VIP en el servidor...*`)

    try {
        const { stdout } = await exec(`demo ${user} ${pass} ${days}`)
        const result = `─── //【 ☬ PREMIUM VPS ☬ 】// ───\n\n${stdout}`
        return await conn.sendMessage(m.chat, { text: result }, { quoted: m })
    } catch (e) {
        return m.reply(`❌ Error interno del VPS: ${e.message}`)
    }
  } 
  
  // 👤 MODO USUARIOS (ENVIAR EL MENÚ)
  else {
      return await sendMainMenu(conn, m, splitName)
  }
}

handler.help = ['vps']
handler.tags = ['netfree']
handler.command = /^(vps|demo)$/i
handler.private = true 

// ==========================================
// 2. RADAR SILENCIOSO (Menú Navegable)
// ==========================================
handler.before = async function (m, { conn }) {
  if (!m.sender || m.isGroup) return

  let rawMessage = m.message || m.msg || {};
  let buttonResponse = rawMessage.listResponseMessage?.singleSelectReply?.selectedRowId || '';

  if (!buttonResponse) return

  const ownerJid = global.owner[0][0] + '@s.whatsapp.net'
  const splitName = m.sender.split('@')[0]

  // Función para adjuntar el botón de "Volver" a las respuestas
  const sendReplyWithBackButton = async (textResponse) => {
      const sections = [{
          title: "NAVEGACIÓN",
          rows: [{ title: "🔙 Volver al Menú Principal", rowId: `volver_menu` }]
      }]
      
      const msg = {
          text: textResponse,
          footer: "© SinNombre VPN",
          buttonText: "Opciones",
          sections
      }
      await conn.sendMessage(m.chat, msg, { quoted: m })
  }

  // 🎯 RESPUESTAS A CADA BOTÓN DEL MENÚ
  switch (buttonResponse) {

    // --- BOTÓN: VOLVER AL MENÚ PRINCIPAL ---
    case 'volver_menu':
        await sendMainMenu(conn, m, splitName)
        return !0

    // --- BOTÓN 1: CREAR DEMO (Este NO tiene botón de volver, como pediste) ---
    case 'demo_auto':
      if (!global.db.data) global.db.data = {}
      if (!global.db.data.users) global.db.data.users = {}
      if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = { lastusuario: 0 }

      const COOLDOWN = 3 * 24 * 60 * 60 * 1000 
      if (Date.now() - (global.db.data.users[m.sender].lastusuario || 0) < COOLDOWN) {
          await m.reply(`⏱️ *Aviso:* Ya tienes una cuenta de prueba reciente. Debes esperar 3 días o adquirir un plan Premium.`)
          return !0 
      }

      const userRand = 'sn' + Math.floor(Math.random() * 899 + 100)
      const passRand = Math.floor(Math.random() * 8999) + 1000
      await m.reply('⏳ *Conectando al servidor...* Generando tu cuenta de prueba.')
      
      try {
          const { stdout } = await exec(`demo ${userRand} ${passRand} 3`)
          global.db.data.users[m.sender].lastusuario = Date.now()
          try { await global.db.write() } catch (e) { }

          await conn.sendMessage(ownerJid, { text: `🔔 *NUEVA DEMO*\nUsuario: @${splitName}\nCuenta: ${userRand}`, mentions: [m.sender] })
          await m.reply(`─── //【 ☬ PRUEBA GENERADA ☬ 】// ───\n\n${stdout}`)
      } catch (e) {
          await m.reply(`❌ *Error:* Los servidores están saturados. Intenta en unos minutos.`)
      }
      return !0

    // --- BOTÓN 2: DESCARGAR APP ---
    case 'link_app':
      await sendReplyWithBackButton(`📦 *DESCARGA DE APLICACIÓN*\n\nDescarga nuestra app oficial desde el siguiente enlace:\n\n🔗 *Link:* https://tu-link-aqui.com\n\n_Una vez descargada, importa tus datos de conexión._`)
      return !0

    // --- BOTÓN 3: TIEMPO RESTANTE ---
    case 'tiempo_restante':
      await sendReplyWithBackButton(`🕒 *ESTADO DE TU CUENTA*\n\nPara verificar el tiempo restante de tu cuenta, revisa la fecha de expiración que se te entregó al generar el usuario, o contacta a soporte.`)
      return !0

    // --- BOTÓN 4: AYUDA ---
    case 'ayuda_vps':
      await sendReplyWithBackButton(`ℹ️ *SOPORTE TÉCNICO*\n\n¿Tienes problemas para conectarte? Contáctame directamente:\n\n📱 *WhatsApp:* wa.me/525629885039\n💬 *Grupo Oficial:* https://chat.whatsapp.com/tu-grupo`)
      return !0

    // --- BOTÓN 5: PRECIOS ---
    case 'precios_vps':
      await sendReplyWithBackButton(`💎 *PLANES PREMIUM - SinNombre VPN*\n\nDisfruta de internet sin límites:\n\n🥉 *Plan 15 Días:* $30 MXN\n🥇 *Plan 30 Días:* $50 MXN\n👑 *Plan 2 Meses:* $90 MXN\n\n✅ _Incluye soporte y máxima velocidad._\n\nMándame un mensaje para contratar.`)
      return !0
  }
}

export default handler
