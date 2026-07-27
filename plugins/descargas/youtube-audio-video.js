/* ERIS-MD YOUTUBE ALL-IN-ONE (AUDIO & VIDEO) */

import axios from 'axios'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const API_BASE = 'https://rest.apicausas.xyz/api/v1/descargas/youtube'
const API_KEY = 'causa-ee5ee31dcfc79da4'
const SIZE_LIMIT_MB = 100

const handler = async (m, { conn, args, usedPrefix, command }) => {
    let url = args[0]

    // Validación de que sea un enlace de YouTube
    if (!url || !url.match(/youtu\.be|youtube\.com/i)) {
        return conn.reply(m.chat, `🌸 *Enlace requerido.*\n\nPor favor, ingresa un link válido de YouTube.\n> *Ejemplo audio:* ${usedPrefix}yt3 https://youtu.be/ejemplo\n> *Ejemplo video:* ${usedPrefix}yt4 https://youtu.be/ejemplo`, m)
    }

    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender)) || m.sender.split('@')[0] || "Usuario"
    
    // Motor inteligente: Detecta si el comando fue yt4 (video) o yt3 (audio)
    const isVideo = command === 'yt4'
    const typeApi = isVideo ? 'video' : 'audio'

    try {
        await m.react('🕓')

        // Petición dinámica a la API de Causas
        const response = await axios.get(`${API_BASE}?url=${encodeURIComponent(url)}&type=${typeApi}&apikey=${API_KEY}`)
        const res = response.data

        if (!res.status || !res.data?.download?.url) {
            throw new Error("La API no devolvió un enlace de descarga válido.")
        }

        const title = res.data.title || 'Descarga_YouTube'
        const downloadUrl = res.data.download.url

        let fileSizeMb = 0
        try {
            const checkHeader = await axios.head(downloadUrl)
            fileSizeMb = (checkHeader.headers['content-length'] || 0) / (1024 * 1024)
        } catch (err) {
            fileSizeMb = 0 
        }

        // Diseño elegante dinámico
        let caption = `╭─── [ ${isVideo ? '🎥' : '🎵'} *YOUTUBE ${isVideo ? 'MP4' : 'MP3'}* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ ${isVideo ? '🎬' : '🎧'} *Título:* ${title}\n`
        if (fileSizeMb > 0) caption += `│ 📦 *Peso:* ${fileSizeMb.toFixed(2)} MB\n`
        caption += `╰─────────────────────────···\n\n`
        
        if (fileSizeMb > SIZE_LIMIT_MB) {
            caption += `🌸 *Aviso:* El archivo supera los ${SIZE_LIMIT_MB}MB, se enviará como documento para no perder calidad.\n\n`
        }
        caption += `> 🌸 *Servidor de Medios - Eris Service*`

        const externalAd = {
            title: `🌸 ERIS SERVICE - YT ${isVideo ? 'MP4' : 'MP3'} 🌸`,
            body: `Procesando: ${title.substring(0, 25)}...`,
            thumbnail: thumb, 
            mediaType: 1, 
            renderLargerThumbnail: false,
            sourceUrl: redes
        }

        const contextInfo = {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
            externalAdReply: externalAd
        }

        if (!isVideo) {
            // --- MODO AUDIO (YT3) ---
            let confirmMsg = await conn.sendMessage(m.chat, { text: caption.trim(), contextInfo }, { quoted: m })
            
            if (fileSizeMb > SIZE_LIMIT_MB) {
                await conn.sendMessage(m.chat, { document: { url: downloadUrl }, fileName: `${title}.mp3`, mimetype: 'audio/mpeg' }, { quoted: confirmMsg })
            } else {
                await conn.sendMessage(m.chat, { audio: { url: downloadUrl }, mimetype: 'audio/mpeg', fileName: `${title}.mp3`, ptt: false }, { quoted: confirmMsg })
            }
        } else {
            // --- MODO VIDEO (YT4) ---
            if (fileSizeMb > SIZE_LIMIT_MB) {
                await conn.reply(m.chat, caption.trim(), m)
                await conn.sendMessage(m.chat, { document: { url: downloadUrl }, fileName: `${title}.mp4`, mimetype: 'video/mp4' }, { quoted: m })
            } else {
                await conn.sendMessage(m.chat, { video: { url: downloadUrl }, caption: caption.trim(), mimetype: 'video/mp4', contextInfo }, { quoted: m })
            }
        }

        await m.react('✅')

    } catch (error) {
        console.error("Error YT DL:", error.message || error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de descarga.*\nNo pude obtener el archivo. El video podría tener restricciones de edad o la API falló.`, m)
    }
}

handler.help = ['yt3 (para audio)', 'yt4 (para video)']
handler.tags = ['descargas']
handler.command = ['yt3', 'yt4']
handler.register = false

export default handler
