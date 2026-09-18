/* ERIS-MD FACEBOOK DOWNLOADER - ALL-IN-ONE (OPTIMIZADO PRO) */

import { igdl } from 'ruhend-scraper'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// Límite prudente para enviar como "video" (WhatsApp suele fallar el envío de videos
// muy pesados enviados así; por encima de esto, igual se intenta con la calidad más liviana)
const MAX_VIDEO_MB = 90

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return 'Desconocido'
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// HEAD rápido para saber si la URL responde y qué tamaño tiene, sin descargar el archivo entero.
// Si el CDN de Facebook bloquea HEAD, no lo tratamos como fallo fatal.
const probeUrl = async (url, timeoutMs = 6000) => {
  try {
    const res = await axios.head(url, { timeout: timeoutMs, maxRedirects: 5 })
    const len = parseInt(res.headers['content-length'] || '0', 10)
    return { ok: res.status < 400, size: len }
  } catch {
    return { ok: true, size: 0 }
  }
}

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

  // Extracción con 1 reintento ante fallos de red (no ante timeout, ya que ahí ya se gastaron los 20s)
  const extractWithRetry = async (targetUrl, attempts = 2) => {
    let lastErr
    for (let i = 0; i < attempts; i++) {
      try {
        const scraperPromise = igdl(targetUrl)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_SCRAPER')), 20000)
        )
        return await Promise.race([scraperPromise, timeoutPromise])
      } catch (err) {
        lastErr = err
        if (err.message === 'TIMEOUT_SCRAPER') throw err
        await new Promise(r => setTimeout(r, 1200))
      }
    }
    throw lastErr
  }

  try {
    const res = await extractWithRetry(url)
    const result = res?.data

    if (!result || result.length === 0) throw new Error('NO_RESULTS')

    // Orden de prioridad: SD primero (liviano, envío rápido) → HD → cualquier otro video disponible
    const candidates = [
      result.find(i => i.resolution === "360p (SD)"),
      result.find(i => i.resolution === "720p (HD)"),
      ...result.filter(i => i.url && i.type === 'video')
    ].filter(Boolean)

    if (candidates.length === 0) throw new Error('NO_URL')

    // Probamos candidatos en orden hasta hallar uno accesible y dentro del límite de tamaño
    let chosen = null
    let sizeBytes = 0
    for (const candidate of candidates) {
      const probe = await probeUrl(candidate.url)
      if (!probe.ok) continue
      if (probe.size && probe.size > MAX_VIDEO_MB * 1024 * 1024) continue
      chosen = candidate
      sizeBytes = probe.size
      break
    }

    // Si todos superan el límite (o el probe no pudo confirmar tamaño), usamos el más liviano igual
    if (!chosen) chosen = candidates[0]

    let infoCaption = `╭─── [ 📹 *FACEBOOK DL* ] ──···\n`
    infoCaption += `│ 👤 *Solicitado por:* ${name}\n`
    infoCaption += `│ ⚙️ *Resolución:* ${chosen.resolution || 'Óptima disponible'}\n`
    infoCaption += `│ 📦 *Tamaño:* ${formatBytes(sizeBytes)}\n`
    infoCaption += `╰─────────────────────────···\n\n`
    infoCaption += `> 🌸 *Transmitiendo video optimizado...*`

    // Envío como VIDEO (no documento): se reproduce directo en el chat con su reproductor nativo
    await conn.sendMessage(m.chat, {
      video: { url: chosen.url },
      caption: infoCaption,
      mimetype: 'video/mp4',
      gifPlayback: false,
      contextInfo: {
        externalAdReply: {
          title: `🌸 ERIS FACEBOOK ARCHIVE 🌸`,
          body: `Contenido procesado.`,
          thumbnail: thumb,
          mediaType: 1,
          sourceUrl: redes
        }
      }
    }, { quoted: m, options: { timeout: 90000 } })

    await m.react('✅')

  } catch (e) {
    console.error("Error Facebook DL:", e)
    await m.react('❌')

    if (e.message === 'TIMEOUT_SCRAPER') {
      return conn.reply(m.chat, `⚠️ *Tiempo de espera agotado.* Los servidores de Facebook están respondiendo muy lento ahora mismo. Intenta de nuevo.`, m)
    }

    if (e.message === 'NO_RESULTS' || e.message === 'NO_URL') {
      return conn.reply(m.chat, `🌸 *No se encontró video.* Verifica que el enlace sea público y contenga un video válido.`, m)
    }

    conn.reply(m.chat, `🌸 *Error:* No pude procesar el video. Asegúrate de que el enlace sea público o intenta de nuevo más tarde.`, m)
  }
}

handler.command = ['facebook', 'fb', 'fbdl']
handler.tags = ['descargas']
handler.help = ['fb <url>']
handler.register = false

export default handler
