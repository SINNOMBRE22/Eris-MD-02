/* ERIS-MD XVIDEOS SEARCHER (NSFW) - ELEGANT VERSION */

import axios from 'axios'
import cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { conn, text, usedPrefix, command, isGroup }) => {
    // Verificación estricta de contenido NSFW
    let chat = global.db.data.chats[m.chat] || {}
    if (isGroup && !chat.nsfw) {
        return conn.reply(m.chat, `🌸 *Contenido NSFW Desactivado.*\n\nUn administrador debe activarlo con el comando:\n> *${usedPrefix}nsfw on*`, m)
    }

    if (!text) {
        return conn.reply(m.chat, `🌸 *Por favor, ingresa la búsqueda.*\n\n*Ejemplo:* ${usedPrefix + command} amateur`, m)
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

        // Realizar la búsqueda usando el scraper
        const results = await xvideosSearch(text)

        if (!results || results.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados para esa búsqueda.*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 🔞 *XVIDEOS SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔥 *Resultados Localizados (Top 10):*\n\n`

        // Mostrar hasta 10 resultados máximos
        let limit = Math.min(results.length, 10)
        for (let i = 0; i < limit; i++) {
            let v = results[i]
            caption += `*${i + 1}. ${v.title}*\n`
            caption += `🕒 *Duración:* ${v.duration} | 🎞️ *Calidad:* ${v.quality}\n`
            caption += `🔗 *Link:* ${v.url}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }

        caption += `> 🌸 *Servicio Privado de Eris*`

        // Enviar el mensaje con la identidad visual
        await conn.sendMessage(m.chat, {
            text: caption.trim(),
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
                    title: `🌸 ERIS SERVICE - NSFW 🌸`,
                    body: `Búsqueda exitosa para: ${name}`,
                    thumbnail: thumb, // Miniatura pequeña local
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Error Xvideos:', e)
        await m.react('❌')
        return conn.reply(m.chat, `🌸 *Ocurrió un error de conexión con el servidor.*`, m)
    }
}

handler.help = ['xv (xvideos)']
handler.tags = ['nsfw']
handler.command = ['xv']
handler.register = false // Eliminado el requisito obligatorio de registro

export default handler

// --- FUNCIÓN DE SCRAPING OPTIMIZADA ---
async function xvideosSearch(query) {
    try {
        const url = `https://www.xvideos.com/?k=${encodeURIComponent(query)}`
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        })
        const $ = cheerio.load(response.data)

        const results = []
        $("div.mozaique > div").each((index, element) => {
            const title = $(element).find("p.title a").attr("title")
            const href = $(element).find("p.title a").attr("href")
            const duration = $(element).find("span.duration").text().trim() || 'Desconocida'
            const quality = $(element).find("span.video-hd-mark").text().trim() || 'SD'

            // Filtramos resultados válidos
            if (title && href && href.startsWith('/video')) {
                const videoUrl = "https://www.xvideos.com" + href
                results.push({ title, url: videoUrl, duration, quality })
            }
        })

        return results
    } catch (error) {
        console.error('Error scraping Xvideos:', error.message)
        return []
    }
}
