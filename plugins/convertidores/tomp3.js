/* ERIS-MD VIDEO/VOICE TO MP3 CONVERTER - SPLIT METHOD */

import { toAudio } from '../../lib/converter.js'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q || q.msg).mimetype || q.mediaType || ''

    if (!/video|audio/.test(mime)) {
        return conn.reply(m.chat, `🌸 *Formato incorrecto.*\n\nPor favor, responde a un video o nota de voz con el comando:\n> *${usedPrefix + command}*`, m)
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

        const audio = await toAudio(media, 'mp4')
        if (!audio.data) throw new Error('Fallo al convertir los datos a MP3')

        // 1. Enviamos el mensaje elegante con la miniatura (Separado)
        let caption = `╭─── [ 🎵 *MP3 CONVERTER* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ ⚙️ *Estado:* Conversión exitosa\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Enviando archivo de audio...*`

        let confirmMsg = await conn.sendMessage(m.chat, {
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
                    title: `🌸 ERIS SERVICE - MP3 🌸`,
                    body: `Archivo procesado correctamente`,
                    thumbnail: thumb, 
                    mediaType: 1, 
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        // 2. Enviamos el audio completamente limpio para forzar el reproductor
        await conn.sendMessage(m.chat, {
            audio: audio.data, 
            fileName: 'Eris_Music.mp3', 
            mimetype: 'audio/mpeg',
            ptt: false 
        }, { quoted: confirmMsg }) // Citamos el mensaje de arriba para que se vea ordenado

        await m.react('✅')

    } catch (e) {
        console.error('Error al convertir a MP3:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error interno.* No pude convertir el archivo a MP3. El formato podría estar corrupto.`, m)
    }
}

handler.help = ['tomp3 (responder a video/audio)']
handler.tags = ['convertidores']
handler.command = ['tomp3', 'toaudio', 'mp3']
handler.group = false 
handler.register = false

export default handler
