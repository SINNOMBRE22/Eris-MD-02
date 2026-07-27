/* ERIS-MD GITHUB SEARCHER - TOP 10 RESULTS */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `🌸 *Ingresa el nombre de un repositorio de GitHub.*\n\n*Ejemplo:* ${usedPrefix + command} Eris-MD`, m)

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

        // Pedimos 10 resultados a la API Oficial de GitHub
        let res = await fetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(text)}&per_page=10`)
        let json = await res.json()

        if (!json.items || json.items.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré ningún repositorio con ese nombre.*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 🐙 *GITHUB SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `📦 *TOP RESULTADOS LOCALIZADOS:*\n\n`

        // Recorremos hasta 10 resultados y los agregamos al texto
        let limit = Math.min(json.items.length, 10)
        for (let i = 0; i < limit; i++) {
            let repo = json.items[i]
            caption += `*${i + 1}. ${repo.name}*\n`
            caption += `👑 *Creador:* ${repo.owner.login} | 🌟 *Stars:* ${repo.stargazers_count}\n`
            caption += `🔗 *Link:* ${repo.html_url}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }
        
        caption += `> 🌸 *Buscador Inteligente de Eris*`

        // Enviamos la foto del top 1 como imagen principal
        await conn.sendMessage(m.chat, {
            image: { url: json.items[0].owner.avatar_url },
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
                    title: `🌸 ERIS SERVICE - GITHUB 🌸`,
                    body: `Top ${limit} resultados para: ${name}`,
                    thumbnail: thumb, // Miniatura pequeña local
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error(error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de conexión.* GitHub no respondió correctamente, intenta de nuevo.`, m)
    }
}

handler.help = ['githubsearch <texto>']
handler.command = ['githubsearch', 'gbsearch', 'github']
handler.tags = ['buscadores']
handler.register = false

export default handler
