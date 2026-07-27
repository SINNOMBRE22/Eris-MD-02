/* ERIS-MD XNXX SEARCHER (NSFW) - ELEGANT VERSION */

import fetch from 'node-fetch'
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

        // Realizar la búsqueda usando el scraper optimizado
        const searchResults = await searchXNXX(text)

        if (!searchResults.result || searchResults.result.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados para esa búsqueda.*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 🔞 *XNXX SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔥 *Resultados Localizados (Top 10):*\n\n`

        // Mostrar hasta 10 resultados máximos para una lectura cómoda
        let limit = Math.min(searchResults.result.length, 10)
        for (let i = 0; i < limit; i++) {
            let v = searchResults.result[i]
            caption += `*${i + 1}. ${v.title}*\n`
            caption += `❗ *Info:* ${v.info}\n`
            caption += `🔗 *Link:* ${v.link}\n`
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
        console.error('Error XNXX:', e)
        await m.react('❌')
        return conn.reply(m.chat, `🌸 *Ocurrió un error de conexión con el servidor.*`, m)
    }
}

handler.help = ['xn (xnxxvideos)']
handler.tags = ['nsfw']
handler.command = ['xn']
handler.register = false // Eliminado el requisito obligatorio de registro

export default handler

// --- FUNCIÓN DE SCRAPING OPTIMIZADA ---
async function searchXNXX(query) {
    try {
        const baseurl = 'https://www.xnxx.com'
        const res = await fetch(`${baseurl}/search/${encodeURIComponent(query)}`)
        const html = await res.text()
        const $ = cheerio.load(html)
        const results = []

        // Extracción limpia y alineada (evita links y títulos cruzados)
        $('div.mozaique div.thumb-block').each((i, el) => {
            const title = $(el).find('div.thumb-under a').attr('title') || $(el).find('div.thumb-under a').text().trim()
            const linkPath = $(el).find('div.thumb a').attr('href')
            const info = $(el).find('div.thumb-under p.metadata').text().trim() || 'Desconocida'
            
            if (title && linkPath) {
                // Reemplaza los paths internos por links válidos
                let cleanLink = linkPath.replace('/THUMBNUM/', '/')
                results.push({
                    title: title,
                    info: info,
                    link: baseurl + cleanLink
                })
            }
        })

        return { result: results }
    } catch (err) {
        console.error('Error scraping XNXX:', err.message)
        return { result: [] }
    }
}
