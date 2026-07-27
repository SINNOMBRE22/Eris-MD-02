/* ERIS-MD PORNHUB SEARCHER (NSFW) - ANTI-DUPLICADOS */

import cheerio from 'cheerio'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, command, usedPrefix, isGroup }) => {
    let chat = global.db.data.chats[m.chat] || {}
    if (isGroup && !chat.nsfw) {
        return conn.reply(m.chat, `🌸 *Contenido NSFW Desactivado.*\n\nUn administrador debe activarlo con el comando:\n> *${usedPrefix}nsfw on*`, m)
    }

    if (!text) {
        return conn.reply(m.chat, `🌸 *Por favor, ingresa la búsqueda.*\n\n*Ejemplo:* ${usedPrefix + command} amateur`, m)
    }

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
        
        let searchResults = await searchPornhub(text)

        if (!searchResults.result || searchResults.result.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados para esa búsqueda.*`, m)
        }

        let caption = `╭─── [ 🔞 *PORNHUB SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔥 *Top Resultados Localizados:*\n\n`

        let limit = Math.min(searchResults.result.length, 10)
        for (let i = 0; i < limit; i++) {
            let v = searchResults.result[i]
            caption += `*${i + 1}. ${v.title}*\n`
            caption += `🕒 *Duración:* ${v.duration || 'N/A'} | 👀 *Vistas:* ${v.views || 'N/A'}\n`
            caption += `🔗 *Link:* ${v.url}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }

        caption += `> 🌸 *Servicio Privado de Eris*`

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
                    thumbnail: thumb, 
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Error PH:', e)
        await m.react('❌')
        return conn.reply(m.chat, `🌸 *Ocurrió un error interno en el servidor.*`, m)
    }
}

handler.tags = ['nsfw']
handler.help = ['ph (pornohub)']
handler.command = ['ph']
handler.register = false

export default handler

async function searchPornhub(search) {
    try {
        const query = encodeURIComponent(search)
        const response = await axios.get(`https://www.pornhub.com/video/search?search=${query}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        })
        const html = response.data
        const $ = cheerio.load(html)
        const result = []
        const urlsVistas = new Set() // <-- FILTRO ANTI-DUPLICADOS (Nuevo)

        $('ul#videoSearchResult > li.pcVideoListItem').each(function(a, b) {
            const _title = $(b).find('a').attr('title')
            const _duration = $(b).find('var.duration').text().trim()
            const _views = $(b).find('var.views').text().trim()
            const href = $(b).find('a').attr('href')
            
            if (_title && href && href.includes('viewkey')) {
                const _url = 'https://www.pornhub.com' + href
                // Solo agrega el resultado si el URL no ha sido registrado antes
                if (!urlsVistas.has(_url)) {
                    urlsVistas.add(_url)
                    result.push({ title: _title, duration: _duration, views: _views, url: _url })
                }
            }
        })

        return { result }
    } catch (error) {
        console.error(`Error al buscar en Pornhub:`, error.message)
        return { result: [] }
    }
}
