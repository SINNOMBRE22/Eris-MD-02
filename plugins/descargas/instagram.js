/* ERIS-MD INSTAGRAM DOWNLOADER - ALL-IN-ONE */

import axios from 'axios'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { args, conn, usedPrefix, command }) => {
  
  // Miniatura de Eris
  let thumb
  try {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
    thumb = fs.readFileSync(imgPath)
  } catch {
    thumb = Buffer.alloc(0)
  }

  const name = m.pushName || (await conn.getName(m.sender)) || "Usuario"

  // --- MENSAJE DE AYUDA CON MINIATURA ---
  if (!args[0]) {
    const helpText = `🌸 *Enlace requerido, ${name}.*\n\nNecesito la URL de un post o Reel de Instagram.\n> *Ejemplo:* ${usedPrefix + command} https://www.instagram.com/reel/C4...`
    
    return conn.sendMessage(m.chat, {
      text: helpText,
      contextInfo: {
        mentionedJid: [m.sender],
        isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
        externalAdReply: {
          title: `🌸 ERIS SERVICE - INSTAGRAM 🌸`,
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
  if (!url.match(/instagram\.com|instagr\.am/)) {
    return conn.reply(m.chat, `🌸 *Enlace inválido.* El link no parece ser de Instagram.`, m)
  }

  await m.react('🕓')

  try {
    // Petición a la API de Causas
    const { data: res } = await axios.get('https://rest.apicausas.xyz/api/v1/descargas/instagram', {
      params: { url, apikey: 'causa-ee5ee31dcfc79da4' },
      timeout: 30000
    })

    if (!res?.status || !res?.data) {
      throw new Error('API falló')
    }

    const { data } = res
    const mediaCount = data.media_count || 1
    
    // Tarjeta informativa de éxito
    let infoCaption = `╭─── [ 📸 *INSTAGRAM DL* ] ──···\n`
    infoCaption += `│ 👤 *Usuario:* ${data.user || 'N/A'}\n`
    infoCaption += `│ 📝 *Título:* ${data.title ? data.title.substring(0, 50) + '...' : 'Contenido de IG'}\n`
    infoCaption += `│ 🎞️ *Archivos:* ${mediaCount}\n`
    infoCaption += `╰─────────────────────────···\n\n`
    infoCaption += `> 🌸 *Enviando contenido visual...*`

    await conn.sendMessage(m.chat, {
      text: infoCaption,
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          title: `🌸 ERIS SERVICE - SUCCESS 🌸`,
          body: `Post de ${data.user || 'Instagram'}`,
          thumbnail: thumb, // O podrías usar data.thumbnail si prefieres la del post
          mediaType: 1,
          sourceUrl: url
        }
      }
    }, { quoted: m })

    // PROCESAMIENTO DE MULTIMEDIA (CARRUSELES O SIMPLE)
    const mediaList = Array.isArray(data.download) ? data.download : [data.download]

    for (const item of mediaList) {
      const isVideo = item.type?.includes('video') || item.url?.endsWith('.mp4')
      
      if (isVideo) {
        await conn.sendMessage(m.chat, {
          video: { url: item.url },
          caption: `📹 *Video/Reel*\n👤 ${data.user || ''}`,
          mimetype: 'video/mp4'
        }, { quoted: m })
      } else {
        await conn.sendMessage(m.chat, {
          image: { url: item.url || item },
          caption: `🖼️ *Imagen*\n👤 ${data.user || ''}`,
          mimetype: 'image/jpeg'
        }, { quoted: m })
      }
    }

    await m.react('✅')

  } catch (e) {
    console.error("Error Instagram DL:", e)
    await m.react('❌')
    conn.reply(m.chat, `🌸 *Error:* No pude obtener el contenido. Asegúrate de que la cuenta sea pública.`, m)
  }
}

handler.command = ['instagram', 'ig', 'instadl']
handler.tags = ['descargas']
handler.help = ['ig <url>']
handler.register = false

export default handler
