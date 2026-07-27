/* ERIS-MD TO-VIDEO/GIF CONVERTER - STICKER ONLY */

import { webp2mp4 } from '../../lib/webp2mp4.js'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q || q.msg).mimetype || q.mediaType || ''

    // Solo aceptamos stickers (webp)
    if (!/webp/.test(mime)) {
        return conn.reply(m.chat, `🌸 *Formato incorrecto.*\n\nPor favor, responde a un *Sticker animado* con el comando:\n> *${usedPrefix + command}*`, m)
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

        const media = await q.download()
        if (!media) throw new Error('No se pudo descargar el medio')

        let isGif = command.includes('gif')

        // Conversión exclusiva de Sticker a MP4
        let out = await webp2mp4(media)

        if (!out) throw new Error('Fallo general en la conversión')

        let caption = `╭─── [ 🎥 *STICKER TO VIDEO* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ ⚙️ *Estado:* Conversión exitosa\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Servidor de Medios - Eris Service*`

        const videoData = typeof out === 'string' ? { url: out } : out

        await conn.sendMessage(m.chat, {
            video: videoData,
            gifPlayback: isGif, // Si usó .togif, lo envía como GIF de WhatsApp
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
                    title: `🌸 ERIS SERVICE - MP4 🌸`,
                    body: `Procesado para: ${name}`,
                    thumbnail: thumb, 
                    mediaType: 1, 
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Error al convertir a MP4/GIF:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de procesamiento.*\nNo pude convertir este sticker. Podría ser un sticker estático o estar corrupto.`, m)
    }
}

handler.help = ['tovideo (responder a sticker animado)']
handler.tags = ['convertidores'] 
handler.command = ['tovideo', 'tomp4', 'mp4', 'togif']
handler.group = false 
handler.register = false

export default handler
