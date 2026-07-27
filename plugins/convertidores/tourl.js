/* ERIS-MD MEDIA UPLOADER (TO-URL) - ELEGANT VERSION */

import uploadFile from '../../lib/uploadFile.js'
import uploadImage from '../../lib/uploadImage.js'
import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, usedPrefix, command }) => {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || ''
    
    if (!mime) {
        return conn.reply(m.chat, `🌸 *Formato incorrecto.*\n\nPor favor, responde a una imagen o video con el comando:\n> *${usedPrefix + command}*`, m)
    }

    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender)) || m.sender.split('@')[0] || "Usuario"

    try {
        await m.react('🕓')
        
        let media = await q.download()
        let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        
        // Subimos el archivo a Telegra.ph (o equivalente) usando tus librerías locales
        let link = await (isTele ? uploadImage : uploadFile)(media)
        let shortLink = await shortUrl(link)

        let caption = `╭─── [ ☁️ *TO-URL UPLOADER* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 📦 *Peso:* ${formatBytes(media.length)}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔗 *Enlace Original:*\n${link}\n\n`
        caption += `🚀 *Enlace Acortado:*\n${shortLink}\n\n`
        caption += `⏳ *Expiración:* ${isTele ? 'Permanente' : 'Desconocida'}\n`
        caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        
        caption += `> 🌸 *Servidor Telegra.ph - Eris Service*`

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
                    title: `🌸 ERIS SERVICE - UPLOADER 🌸`,
                    body: `Archivo subido con éxito`,
                    thumbnail: thumb, 
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error('Error ToUrl:', error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error al subir el archivo.* El servidor podría estar saturado o la librería falló.`, m)
    }
}

handler.help = ['tourl (responder a media)']
handler.tags = ['convertidores'] // Ajustado a la categoría solicitada
handler.command = ['tourl', 'upload']
handler.register = false

export default handler

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function shortUrl(url) {
    try {
        let res = await fetch(`https://tinyurl.com/api-create.php?url=${url}`)
        return await res.text()
    } catch (e) {
        return url // Si TinyURL falla, entrega el link largo para que el usuario no pierda su archivo
    }
}
