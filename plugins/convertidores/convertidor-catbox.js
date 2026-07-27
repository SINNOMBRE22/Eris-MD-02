/* ERIS-MD CATBOX UPLOADER - NAME FIX */

import fetch from "node-fetch"
import crypto from "crypto"
import { FormData, Blob } from "formdata-node"
import { fileTypeFromBuffer } from "file-type"
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
        return conn.reply(m.chat, `🌸 *Formato incorrecto.*\n\nResponde a una imagen o video con el comando:\n> *${usedPrefix + command}*`, m)
    }

    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    // --- EXTRACCIÓN DE NOMBRE (TU MÉTODO) ---
    const name = await conn.getName(m.sender) || m.pushName || "Usuario"

    try {
        await m.react('🕓')
        
        let media = await q.download()
        let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime)
        
        let link = await catbox(media)

        let caption = `╭─── [ ☁️ *CLOUD UPLOADER* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 📦 *Peso:* ${formatBytes(media.length)}\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🔗 *Enlace Directo:*\n${link}\n\n`
        caption += `⏳ *Expiración:* ${isTele ? 'Permanente' : 'Desconocida'}\n`
        caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        
        caption += `> 🌸 *Servidor Catbox - Eris Service*`

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
        console.error('Error Catbox:', error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error al subir el archivo.* El servidor podría estar saturado.`, m)
    }
}

handler.help = ['catbox (responder a media)']
handler.tags = ['convertidores']
handler.command = ['catbox']
handler.register = false

export default handler

function formatBytes(bytes) {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / 1024 ** i).toFixed(2)} ${sizes[i]}`
}

async function catbox(content) {
    const { ext, mime } = (await fileTypeFromBuffer(content)) || { ext: 'bin', mime: 'application/octet-stream' }
    const blob = new Blob([content], { type: mime })
    const formData = new FormData()
    const randomBytes = crypto.randomBytes(5).toString("hex")
    
    formData.append("reqtype", "fileupload")
    formData.append("fileToUpload", blob, randomBytes + "." + ext)

    const response = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: formData,
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
    })

    return await response.text()
}
