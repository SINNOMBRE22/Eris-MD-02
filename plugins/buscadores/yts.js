/* ERIS-MD YOUTUBE SEARCHER - ELEGANT VERSION */

import yts from 'yt-search'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.reply(m.chat, `🌸 *¿Qué deseas buscar en YouTube?*\n\n*Ejemplo:* ${usedPrefix + command} música electrónica`, m)
    }

    // Leer miniatura local perfil2.jpeg
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = await conn.getName(m.sender)

    try {
        await m.react('🕓')

        // Realizamos la búsqueda en YouTube
        let results = await yts(text)
        let videos = results.videos

        if (!videos || videos.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados en YouTube para esa búsqueda.*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 🔴 *YOUTUBE SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `📹 *Top Resultados Localizados:*\n\n`

        // Mostrar solo los primeros 10 resultados para no saturar el chat
        let limit = Math.min(videos.length, 10)
        for (let i = 0; i < limit; i++) {
            let v = videos[i]
            caption += `*${i + 1}. ${v.title}*\n`
            caption += `👤 *Canal:* ${v.author.name} | ⏱️ *Duración:* ${v.timestamp}\n`
            caption += `👁️ *Vistas:* ${v.views.toLocaleString('es-MX')} | 🗓️ *Publicado:* ${v.ago}\n`
            caption += `🔗 *Link:* ${v.url}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }

        caption += `> 🌸 *Buscador Inteligente de Eris*`

        // Enviamos el mensaje usando la miniatura del primer video como imagen principal
        await conn.sendMessage(m.chat, {
            image: { url: videos[0].thumbnail },
            caption: caption.trim(),
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid,
                    newsletterName,
                    serverMessageId: -1
                },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - YOUTUBE 🌸`,
                    body: `Búsqueda exitosa para: ${name}`,
                    thumbnail: thumb, // Miniatura pequeña local
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error('Error YouTube Search:', error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de conexión.* YouTube no respondió correctamente, intenta de nuevo.`, m)
    }
}

handler.help = ['ytsearch <texto>']
handler.tags = ['buscadores']
handler.command = ['ytbuscar', 'ytsearch', 'yts']
handler.register = false // Eliminado el registro obligatorio

export default handler
