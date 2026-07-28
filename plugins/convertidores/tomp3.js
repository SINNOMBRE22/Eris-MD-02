/* ERIS-MD VIDEO/VOICE TO MP3 CONVERTER */

import { ffmpeg } from '../../lib/converter.js'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// Convertir cualquier audio/video a MP3 real (libmp3lame)
async function convertirMp3(buffer, ext) {
    const salida = await ffmpeg(
        buffer,
        [
            '-vn',                  // sin video
            '-c:a', 'libmp3lame',   // codec MP3 real
            '-b:a', '128k',         // bitrate
            '-ar', '44100'          // sample rate estándar
        ],
        ext,
        'mp3'
    )
    return salida
}

const handler = async (m, { conn, usedPrefix, command }) => {
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || q.mediaType || ''

    if (!/video|audio/.test(mime)) {
        return conn.reply(m.chat, `🌸 *Formato incorrecto.*\n\nResponde a un video o nota de voz con:\n> *${usedPrefix + command}*`, m)
    }

    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender).catch(() => null)) || m.sender.split('@')[0] || 'Usuario'

    let audio
    try {
        await m.react('🕓')

        const media = await q.download()
        if (!media) throw new Error('No se pudo descargar el medio')

        // Detectar extensión de entrada según el mime
        const ext = /audio/.test(mime) ? 'mp3' : 'mp4'

        audio = await convertirMp3(media, ext)
        if (!audio || !audio.data) throw new Error('Fallo al convertir a MP3')

        // 1. Mensaje elegante con miniatura
        let caption = `╭─── [ 🎵 *MP3 CONVERTER* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ ⚙️ *Estado:* Conversión exitosa\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Enviando archivo de audio...*`

        const confirmMsg = await conn.sendMessage(m.chat, {
            text: caption.trim(),
            contextInfo: {
                mentionedJid: [m.sender],
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

        // 2. Enviar el audio MP3
        await conn.sendMessage(m.chat, {
            audio: audio.data,
            fileName: 'Eris_Music.mp3',
            mimetype: 'audio/mpeg',
            ptt: false
        }, { quoted: confirmMsg })

        await m.react('✅')

    } catch (e) {
        console.error('Error al convertir a MP3:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error interno.* No pude convertir el archivo a MP3. El formato podría estar corrupto.`, m)
    } finally {
        // Borrar el temporal de salida si se creó
        if (audio && typeof audio.delete === 'function') {
            audio.delete().catch(() => {})
        }
    }
}

handler.help = ['tomp3 (responder a video/audio)']
handler.tags = ['convertidores']
handler.command = ['tomp3', 'toaudio', 'mp3']
handler.group = false
handler.register = false

export default handler
