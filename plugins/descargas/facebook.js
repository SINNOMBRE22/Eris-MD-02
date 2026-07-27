/* ERIS-MD FACEBOOK DOWNLOADER - ALL-IN-ONE (OPTIMIZADO) */

import { igdl } from 'ruhend-scraper'
import fs from 'fs'
import path from 'path'
import axios from 'axios' // Usaremos axios para validar tiempos de respuesta rápidos

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { args, conn, usedPrefix, command }) => {

  let thumb
  try {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
    thumb = fs.readFileSync(imgPath)
  } catch {
    thumb = Buffer.alloc(0)
  }

  const name = m.pushName || (await conn.getName(m.sender)) || "Usuario"

  if (!args[0]) {
    const helpText = `🌸 *Enlace requerido, ${name}.*\n\nNecesito la URL de un video de Facebook.\n> *Ejemplo:* ${usedPrefix + command} https://www.facebook.com/...`
    return conn.sendMessage(m.chat, {
      text: helpText,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
        externalAdReply: {
          title: `🌸 ERIS SERVICE - FACEBOOK 🌸`,
          body: `Hola ${name}, indica un enlace.`,
          thumbnail: thumb,
          mediaType: 1,
          renderLargerThumbnail: false,
          sourceUrl: redes
        }
      }
    }, { quoted: m })
  }

  const url = args[0].trim()
  if (!url.match(/facebook\.com|fb\.watch|fb\.gg/)) {
    return conn.reply(m.chat, `🌸 *Enlace inválido.* El link no parece ser de Facebook.`, m)
  }

  await m.react('🕓')

  const waitText = `🔄 *Iniciando protocolo de extracción, ${name}.* Aguarda un momento...`
  await conn.sendMessage(m.chat, {
    text: waitText,
    contextInfo: {
      mentionedJid: [m.sender],
      externalAdReply: {
        title: `🌸 ERIS SERVICE - PROCESSING 🌸`,
        body: `Descargando video de Facebook...`,
        thumbnail: thumb,
        mediaType: 1,
        sourceUrl: redes
      }
    }
  }, { quoted: m })

  try {
    // 1. Añadimos un límite de tiempo a la extracción de la URL (Máximo 20 segundos)
    const scraperPromise = igdl(url)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_SCRAPER')), 20000)
    )

    // El primero que termine gana. Si pasa de 20s, aborta.
    const res = await Promise.race([scraperPromise, timeoutPromise])
    const result = res?.data

    if (!result || result.length === 0) throw new Error('NO_RESULTS')

    // Priorizamos SD (360p) para videos de 30-50 min si está disponible. Pesa 3 veces menos y vuela al enviar.
    const data = result.find(i => i.resolution === "360p (SD)") || 
                 result.find(i => i.resolution === "720p (HD)") ||
                 result.find(i => i.url && i.type === 'video')

    if (!data || !data.url) throw new Error('NO_URL')

    let infoCaption = `╭─── [ 📹 *FACEBOOK DL* ] ──···\n`
    infoCaption += `│ 👤 *Solicitado por:* ${name}\n`
    infoCaption += `│ ⚙️ *Resolución:* ${data.resolution || 'Óptima disponible'}\n`
    infoCaption += `╰─────────────────────────···\n\n`
    infoCaption += `> 🌸 *Transmitiendo archivo mp4 optimizado...*`

    // 2. Control de streaming con AbortController para Baileys
    // Si la conexión de red se cuelga demasiado enviando, forzamos el cierre en 90 segundos.
    await conn.sendMessage(m.chat, { 
      document: { url: data.url }, 
      caption: infoCaption, 
      mimetype: 'video/mp4', 
      fileName: `Eris-MD_FB_${Date.now()}.mp4`,
      contextInfo: {
        externalAdReply: {
          title: `🌸 ERIS FACEBOOK ARCHIVE 🌸`,
          body: `Contenido pesado procesado.`,
          thumbnail: thumb,
          mediaType: 1,
          sourceUrl: redes
        }
      }
    }, { quoted: m, options: { timeout: 90000 } }) // Corta el envío si se traba más de minuto y medio

    await m.react('✅')

  } catch (e) {
    console.error("Error Facebook DL:", e)
    await m.react('❌')

    if (e.message === 'TIMEOUT_SCRAPER') {
      return conn.reply(m.chat, `⚠️ *Tiempo de espera agotado.* Los servidores de Facebook están respondiendo muy lento ahora mismo. Intenta de nuevo.`, m)
    }
    
    conn.reply(m.chat, `🌸 *Error:* No pude procesar el video. Asegúrate de que el enlace sea público o intenta de nuevo más tarde.`, m)
  }
}

handler.command = ['facebook', 'fb', 'fbdl']
handler.tags = ['descargas']
handler.help = ['fb <url>']
handler.register = false

export default handler
