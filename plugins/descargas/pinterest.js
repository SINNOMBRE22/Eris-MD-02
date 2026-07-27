/* ERIS-MD PINTEREST DOWNLOADER - VIDEO FIX */

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const handler = async (m, { conn, args, usedPrefix, command }) => {
    let url = args[0]
    
    if (!url || !url.match(/pinterest\.com|pin\.it/i)) {
        return conn.reply(m.chat, `🌸 *Enlace requerido.*\n\nPor favor, ingresa un link válido de Pinterest.\n> *Ejemplo:* ${usedPrefix + command} https://pin.it/ejemplo`, m)
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
        
        // Resolvemos el link corto (pin.it -> pinterest.com)
        const finalUrl = await resolvePinterestLink(url.trim())
        if (!finalUrl.includes('pinterest.com')) throw new Error('Enlace no válido')

        // Extraemos el código fuente de Pinterest camuflando al bot
        const { data } = await axios.get(finalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://www.pinterest.com/'
            }
        })

        // NÚCLEO REPARADO: Prioridad estricta al MP4
        const mediaUrl = extractMediaUrl(data)
        if (!mediaUrl) throw new Error('No se encontró contenido multimedia')

        const isVideo = /\.(mp4|mov|webm)/i.test(mediaUrl)

        let caption = `╭─── [ 📌 *PINTEREST DOWNLOADER* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 📂 *Tipo:* ${isVideo ? 'Video' : 'Imagen'}\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Servidor de Medios - Eris Service*`

        const payload = isVideo ? { video: { url: mediaUrl } } : { image: { url: mediaUrl } }

        // Enviamos el archivo con la tarjeta visual
        await conn.sendMessage(m.chat, {
            ...payload,
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
                    title: `🌸 ERIS SERVICE - PINTEREST 🌸`,
                    body: `Descargado para: ${name}`,
                    thumbnail: thumb, 
                    mediaType: 1, 
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (e) {
        console.error('Error Pinterest Scraper:', e.message || e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error de extracción.*\nNo pude obtener el archivo. Asegúrate de que el pin sea público.`, m)
    }
}

// --- FUNCIONES DE SCRAPING OPTIMIZADAS ---
const resolvePinterestLink = async (url) => {
    try {
        const { request } = await axios.get(url, { maxRedirects: 5 })
        return request.res.responseUrl || url
    } catch {
        return url
    }
}

const extractMediaUrl = (html) => {
    const $ = cheerio.load(html)

    // 1. PRIORIDAD MÁXIMA: Cazador de MP4. Buscamos el servidor de video de Pinterest
    const videoRegex = /"([^"]*v\.pinimg\.com\/videos\/[^"]*\.mp4)"/i;
    const match = html.match(videoRegex);
    if (match && match[1]) {
        // Limpiamos la URL (Pinterest a veces le pone diagonales raras como \/)
        return match[1].replace(/\\\//g, '/');
    }

    // 2. Segunda opción de video: Las meta etiquetas
    const ogVideo = $('meta[property="og:video:secure_url"]').attr('content')
    if (ogVideo && ogVideo.endsWith('.mp4')) return ogVideo

    // 3. ÚLTIMO RECURSO: Si definitivamente no hay video en la página, toma la imagen
    return $('meta[property="og:image"]').attr('content')
}

handler.command = ['pindl']
handler.register = false 
handler.help = ['pindl (link)']
handler.tags = ['descargas']

export default handler
