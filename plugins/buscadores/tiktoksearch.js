/* ERIS-MD TIKTOK SEARCHER - ELEGANT & STABLE */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `🌸 *Ingresa lo que deseas buscar en TikTok.*\n\n*Ejemplo:* ${usedPrefix + command} bailes en tendencia`, m)

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

        // Usar API de búsqueda de TikTok
        let res = await fetch(`https://apis-starlights-team.koyeb.app/starlight/tiktoksearch?text=${encodeURIComponent(text)}`)
        let json = await res.json()

        if (!json.data || json.data.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados para esa búsqueda.*`, m)
        }

        // Tomamos solo el PRIMER resultado para no saturar el servidor
        let video = json.data[0]

        // Estructura elegante del mensaje
        let caption = `╭─── [ 🎵 *TIKTOK SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `📝 *Título:* ${video.title || 'Video de TikTok'}\n`
        caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        
        caption += `> 🌸 *Buscador Inteligente de Eris*`

        // Enviamos el video directamente
        await conn.sendMessage(m.chat, {
            video: { url: video.nowm }, // nowm = No Watermark (Sin marca de agua)
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
                    title: `🌸 ERIS SERVICE - TIKTOK 🌸`,
                    body: `Búsqueda para: ${name}`,
                    thumbnail: thumb, // Miniatura pequeña local
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error('Error TikTok Search:', error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de conexión.* La API de TikTok no respondió correctamente.`, m)
    }
}

handler.help = ['tiktoksearch <texto>']
handler.command = ['tiktoksearch'] // Solo dejamos un comando, como pediste
handler.tags = ['buscadores']
handler.register = false // Libre de registro

export default handler
