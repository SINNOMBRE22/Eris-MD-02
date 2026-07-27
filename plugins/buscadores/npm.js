/* ERIS-MD NPMJS SEARCHER - ELEGANT VERSION */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Verificación de input
    if (!text) return conn.reply(m.chat, `🌸 *Ingresa el nombre del paquete o módulo que buscas.*\n\n*Ejemplo:* ${usedPrefix + command} yt-search`, m)

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

        // Usamos la API oficial de NPMJS (limitando a 10 resultados para no saturar la RAM)
        let res = await fetch(`https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(text)}&size=10`)
        let json = await res.json()

        if (!json.objects || json.objects.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Lo siento, ${name}. No encontré ningún módulo llamado: ${text}*`, m)
        }

        // Estructura elegante del encabezado
        let caption = `╭─── [ 📦 *NPMJS SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `💻 *Módulos Encontrados (Top 10):*\n\n`

        // Recorremos los resultados (máximo 10)
        let limit = Math.min(json.objects.length, 10)
        for (let i = 0; i < limit; i++) {
            let pkg = json.objects[i].package
            caption += `*${i + 1}. ${pkg.name}* (v${pkg.version})\n`
            caption += `📝 *Desc:* ${pkg.description ? pkg.description.slice(0, 150) + '...' : 'Sin descripción.'}\n`
            caption += `🔗 *Link:* ${pkg.links.npm}\n`
            caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        }

        caption += `> 🌸 *Buscador para Desarrolladores - Eris*`

        // Enviamos el mensaje estilizado
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
                    title: `🌸 ERIS SERVICE - NPMJS 🌸`,
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
        console.error(error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de conexión.* El registro de NPM no respondió correctamente.`, m)
    }
}

handler.help = ['npmjs <texto>']
handler.command = ['npmjs', 'npmsearch', 'npm']
handler.tags = ['buscadores']
handler.register = false // Eliminado el registro obligatorio

export default handler
