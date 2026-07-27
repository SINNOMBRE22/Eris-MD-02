/* ERIS-MD ANIME DOWNLOADER - v10 (Multi-Language Ready)
   Busca anime en múltiples idiomas usando parámetros (--latino / --castellano)
   Uso: .animedl konosuba 1 --latino
        .animedl konosuba 1                     */

import fs        from 'fs'
import path      from 'path'
import https     from 'https'
import http      from 'http'

const newsletterJid  = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes          = 'https://github.com/SINNOMBRE22/Eris-MD'

// ── CONFIGURACIÓN DE LA API ──────────────────────────────────────────
const API_BASE_URL = 'http://127.0.0.1:3000/api/v1/anime' 

function fetchJson(url, opts = {}) {
  return fetchBuffer(url, opts).then(buf => JSON.parse(buf.toString()))
}

function fetchBuffer(url, opts = {}, redir = 8) {
  return new Promise((resolve, reject) => {
    if (!redir) return reject(new Error('Demasiados redirects'))
    try {
      const parsed  = new URL(url)
      const mod     = parsed.protocol === 'https:' ? https : http
      const options = {
        hostname: parsed.hostname,
        port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path:     parsed.pathname + parsed.search,
        method:   opts.method || 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', ...opts.headers },
        timeout: 300000 
      }
      const req = mod.request(options, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const next = res.headers.location.startsWith('http') ? res.headers.location : `${parsed.protocol}//${parsed.host}${res.headers.location}`
          return fetchBuffer(next, opts, redir - 1).then(resolve).catch(reject)
        }
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} → ${url}`))
        const chunks = []
        res.on('data',  c => chunks.push(c))
        res.on('end',   () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      })
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout remoto.')) })
      req.on('error', reject)
      if (opts.body) req.write(opts.body)
      req.end()
    } catch (e) { reject(e) }
  })
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  let textInput = args.join(' ').trim()
  
  let thumb = Buffer.alloc(0)
  try { thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')) } catch {}
  const name = m.pushName || (await conn.getName(m.sender)) || 'Usuario'

  if (!textInput) {
    return conn.sendMessage(m.chat, {
      text: [
        `╭─── [ 🎌 *ANIME MULTI-IDIOMA v10* ] ──···`,
        `│`,
        `│ 📌 *Uso general:*`,
        `│ ${usedPrefix + command} <nombre> <capítulo> [idioma]`,
        `│`,
        `│ 🎌 *Opciones de Idioma:*`,
        `│ • _Por defecto:_ Subtitulado al Español`,
        `│ • \`--latino\` : Audio Latino`,
        `│ • \`--castellano\` : Audio Castellano`,
        `│`,
        `│ 📖 *Ejemplos:*`,
        `│ • ${usedPrefix + command} konosuba 1`,
        `│ • ${usedPrefix + command} konosuba 1 --latino`,
        `│ • ${usedPrefix + command} naruto 12 --castellano`,
        `╰─────────────────────────────────···`
      ].join('\n'),
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
        externalAdReply: {
          title: `🌸 ERIS MULTI-LANG ANIME 🌸`,
          body: `Hola ${name}, elige tu serie e idioma preferido.`,
          thumbnail: thumb, mediaType: 1, renderLargerThumbnail: false, sourceUrl: redes
        }
      }
    }, { quoted: m })
  }

  // Detectar y extraer banderas de idioma
  let targetLang = 'sub' 
  let langLabel = 'Español Subtitulado'

  if (textInput.includes('--latino')) {
    targetLang = 'latino'
    langLabel = 'Audio Latino'
    textInput = textInput.replace('--latino', '').trim()
  } else if (textInput.includes('--castellano')) {
    targetLang = 'castellano'
    langLabel = 'Audio Castellano'
    textInput = textInput.replace('--castellano', '').trim()
  }

  const matchEpisode = textInput.match(/\d+$/)
  if (!matchEpisode) {
    return conn.reply(m.chat, `❌ *No especificaste el número del capítulo.*\nEjemplo: \`${usedPrefix + command} konosuba 1 --latino\``, m)
  }
  
  const episode = matchEpisode[0]
  const animeQuery = textInput.replace(episode, '').replace(/\b(capitulo|capítulo|temporada|episodio|cap|ep)\b/gi, '').replace(/\s+/g, ' ').trim()

  if (!animeQuery) return conn.reply(m.chat, `❌ *Falta el nombre del anime.*`, m)

  await m.react('🔍')

  try {
    // 1. Buscar el anime en la API (Agregamos parámetro de idioma a la búsqueda si tu API lo requiere en el futuro)
    const searchRes = await fetchJson(`${API_BASE_URL}/search?q=${encodeURIComponent(animeQuery)}&lang=${targetLang}`)
    const searchResults = searchRes.data?.results || searchRes.results || (Array.isArray(searchRes) ? searchRes : null)

    if (!searchResults || searchResults.length === 0) throw new Error(`No se encontró ningún anime con ese nombre en la base de datos de ${langLabel}.`)

    const animeSelected = searchResults[0] 
    const animeUrl = animeSelected.url 
    const animeTitle = animeSelected.title || animeQuery

    await conn.sendMessage(m.chat, {
      text: [
        `╭─── [ 🎌 *ANIME DOWNLOADER* ] ──···`,
        `│ 🔍 *Buscando:* ${animeQuery} - Cap ${episode}`,
        `│ 🎬 *Encontrado:* ${animeTitle}`,
        `│ 🔊 *Idioma:* ${langLabel}`,
        `│ ⏳ *Analizando servidores...*`,
        `╰─────────────────────────────────···`
      ].join('\n')
    }, { quoted: m })

    await m.react('⏳')

    let targetEpisodeUrl = animeUrl.endsWith('/') ? `${animeUrl}${episode}/` : `${animeUrl}/${episode}/`

    // 2. Consultar endpoint enviando el idioma seleccionado
    const episodeRes = await fetchJson(`${API_BASE_URL}/episode?url=${encodeURIComponent(targetEpisodeUrl)}&lang=${targetLang}`)
    
    // El bot busca dinámicamente en la propiedad del idioma solicitado: data.servers.latino, data.servers.sub, etc.
    let videoServers = episodeRes.data?.servers?.[targetLang] || episodeRes.data?.servers?.sub || episodeRes.servers?.[targetLang] || null

    if (!videoServers && episodeRes.data?.servers && Array.isArray(episodeRes.data.servers)) {
      videoServers = episodeRes.data.servers
    }

    if (!Array.isArray(videoServers) || videoServers.length === 0) {
      throw new Error(`La API no devolvió servidores activos para el idioma ${langLabel} en el capítulo ${episode}.`)
    }

    let directUrl = null
    let serverName = 'Desconocido'
    let streamingFallbackUrl = null
    let streamingServerName = 'Reproductores Web'

    const blacklistedServers = ['jkplayer', 'jkv2', 'embed', 'player', 'visualizador']
    const preferredServers = ['fireload', 'gocdn', 'mp4upload', 'sw', 'zippyshare', 'mega', 'fembed', 'mixdrop']
    
    for (const pref of preferredServers) {
      const found = videoServers.find(s => {
        const nameStr = String(s.server || s.name || s.title || '').toLowerCase().trim()
        return nameStr.includes(pref) && !blacklistedServers.some(b => nameStr.includes(b)) && (s.url || s.code || s.link)
      })
      if (found) {
        directUrl = found.url || found.code || found.link
        serverName = found.server || found.name || found.title
        break
      }
    }

    if (!directUrl) {
      const fallback = videoServers.find(s => {
        const nameStr = String(s.server || s.name || s.title || '').toLowerCase().trim()
        return !blacklistedServers.some(b => nameStr.includes(b)) && (s.url || s.code || s.link)
      })
      if (fallback) {
        directUrl = fallback.url || fallback.code || fallback.link
        serverName = fallback.server || fallback.name || fallback.title
      }
    }

    const playerServer = videoServers.find(s => s.url || s.code || s.link)
    if (playerServer) {
      streamingFallbackUrl = playerServer.url || playerServer.code || playerServer.link
      streamingServerName = playerServer.server || playerServer.name || playerServer.title
    }

    // MODO 1: Enviar archivo de descarga directa si existe
    if (directUrl) {
      const videoBuffer = await fetchBuffer(directUrl)

      if (videoBuffer && videoBuffer.length > 500000) {
        const sizeMB = (videoBuffer.length / 1024 / 1024).toFixed(1)
        const finalFileName = `${animeTitle.slice(0, 40).replace(/[^\w\s\-]/g, '')}_Cap_${episode}_(${targetLang}).mp4`

        const caption = [
          `╭─── [ 🎌 *ANIME DOWNLOADER* ] ──···`,
          `│ 👤 *Usuario:* ${name}`,
          `│ 🎬 *Anime:* ${animeTitle}`,
          `│ 🎞️ *Capítulo:* ${episode}`,
          `│ 🔊 *Audio:* ${langLabel}`,
          `│ 📦 *Tamaño:* ${sizeMB} MB`,
          `│ 🌐 *Servidor:* ${serverName}`,
          `╰─────────────────────────────────···`
        ].join('\n')

        await conn.sendMessage(m.chat, {
          document: videoBuffer,
          caption,
          fileName: finalFileName,
          mimetype: 'video/mp4',
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999, isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
            externalAdReply: {
              title: `🌸 DOWNLOAD: ${animeTitle.toUpperCase()}`,
              body: `Capítulo ${episode} en ${langLabel}`,
              thumbnail: thumb, mediaType: 1, renderLargerThumbnail: false, sourceUrl: redes
            }
          }
        }, { quoted: m })

        return await m.react('✅')
      }
    }

    // MODO 2: Enviar enlace si solo hay reproductores
    if (streamingFallbackUrl) {
      const liveLink = streamingFallbackUrl.startsWith('http') ? streamingFallbackUrl : targetEpisodeUrl

      await conn.sendMessage(m.chat, {
        text: [
          `╭─── [ 🎌 *ANIME STREAMING* ] ──···`,
          `│ 🎬 *Anime:* ${animeTitle}`,
          `│ 🎞️ *Capítulo:* ${episode}`,
          `│ 🔊 *Audio:* ${langLabel}`,
          `│ 🌐 *Servidor:* ${streamingServerName}`,
          `├─────────────────────────────────···`,
          `│ ⚠️ _No hay enlaces de descarga directa_`,
          `│ _disponibles para este idioma en este servidor._`,
          `╰─────────────────────────────────···`,
          ``,
          `🔗 *Enlace para reproducir / descargar:*`,
          `${liveLink}`
        ].join('\n'),
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999, isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
          externalAdReply: {
            title: `📺 REPRODUCTOR: ${animeTitle.toUpperCase()}`,
            body: `Ver episodio ${episode} en ${langLabel}`,
            thumbnail: thumb, mediaType: 1, renderLargerThumbnail: false, sourceUrl: liveLink
          }
        }
      }, { quoted: m })

      return await m.react('📺')
    }

    throw new Error('No se encontraron opciones de reproducción para este idioma.')

  } catch (e) {
    console.error('[ANIMEDL-API] Error:', e.message)
    await m.react('❌')
    conn.reply(m.chat, `🌸 *Error de procesamiento.*\n\n📋 *Detalle:* ${e.message}`, m)
  }
}

handler.help     = ['animedl <nombre> <capitulo> [--latino/--castellano]']
handler.tags     = ['descargas']
handler.command  = ['animedl', 'anime', 'animex']
handler.register = false

export default handler
