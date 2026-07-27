/* ERIS-MD HENTAI SEARCHER (NSFW) */

import cheerio from 'cheerio'
import axios from 'axios'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command, isGroup }) => {
    // Verificación de seguridad NSFW (Solo funciona si el grupo lo permite)
    let chat = global.db.data.chats[m.chat] || {}
    if (isGroup && !chat.nsfw) {
        return conn.reply(m.chat, `🌸 *Contenido NSFW Desactivado.*\n\nUn administrador debe activarlo con el comando:\n> *${usedPrefix}nsfw on*`, m)
    }

    if (!text) return conn.reply(m.chat, `🌸 *Ingresa el nombre para buscar.*\n\n*Ejemplo:* ${usedPrefix + command} overflow`, m)

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
        const searchResults = await searchHentai(text)

        if (!searchResults.result || searchResults.result.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré resultados para esa búsqueda.*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 🔞 *NSFW SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔥 *Resultados Localizados:*\n\n`

        // Mostrar hasta 10 resultados máximos
        let limit = Math.min(searchResults.result.length, 10)
        for (let i = 0; i < limit; i++) {
            let v = searchResults.result[i]
            caption += `*${i + 1}. ${v.title}*\n`
            caption += `👀 *Vistas:* ${v.views || 'Desconocido'}\n`
            caption += `🔗 *Link:* ${v.url}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }

        caption += `> 🌸 *Servicio Privado de Eris*`

        // Usamos la miniatura del primer resultado o una de error si no carga
        let mainImage = searchResults.result[0].thumbnail || 'https://pictures.hentai-foundry.com/e/Error-Dot/577798/Error-Dot-577798-Zero_Two.png'

        await conn.sendMessage(m.chat, {
            image: { url: mainImage },
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
                    title: `🌸 ERIS SERVICE - NSFW 🌸`,
                    body: `Búsqueda para: ${name}`,
                    thumbnail: thumb, // Miniatura pequeña local de Eris
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Error en búsqueda NSFW:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de conexión.* El servidor no responde en este momento.`, m)
    }
}

handler.help = ['ht (hentai)']
handler.command = ['ht']
handler.tags = ['nsfw']
handler.register = false

export default handler

// --- FUNCIÓN DE SCRAPING OPTIMIZADA ---
async function searchHentai(search) {
    return new Promise((resolve, reject) => {
        axios.get('https://hentai.tv/?s=' + encodeURIComponent(search)).then(({ data }) => {
            const $ = cheerio.load(data)
            const res = []
            
            // Usamos un selector múltiple por si la página actualiza su diseño
            let items = $('div.flex > div.crsl-slde')
            if (items.length === 0) items = $('.search-post, .post-item, article')

            items.each(function(a, b) {
                const _thumbnail = $(b).find('img').attr('src')
                const _title = $(b).find('a').text().trim() || $(b).find('h2').text().trim()
                const _views = $(b).find('p').text().trim() || $(b).find('.views').text().trim()
                const _url = $(b).find('a').attr('href')
                
                if (_title && _url) {
                    res.push({ thumbnail: _thumbnail, title: _title, views: _views, url: _url })
                }
            })
            resolve({ result: res })
        }).catch((err) => {
            reject(err)
        })
    })
}
