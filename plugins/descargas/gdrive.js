/* ERIS-MD GOOGLE DRIVE DOWNLOADER - BUFFER FIX */

import fg from 'api-dylux'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario"

    if (!args[0]) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Enlace requerido, ${name}.*\n\nNecesito un link de Google Drive.\n> *Ejemplo:* ${usedPrefix + command} https://drive.google.com/file/d/123...`,
            contextInfo: {
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - GDRIVE 🌸`,
                    body: `Hola ${name}, te falta el enlace.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    await m.react('🕓')

    try {
        // Obtenemos los datos de la descarga
        let res = await fg.GDriveDl(args[0])
        const formattedSize = formatBytes(res.fileSizeB)

        // Verificamos que tengamos una URL válida
        if (!res.downloadUrl) throw new Error('No se obtuvo URL de descarga')

        let caption = `╭─── [ 📦 *GOOGLE DRIVE* ] ──···\n`
        caption += `│ 📄 *Archivo:* ${res.fileName}\n`
        caption += `│ 📏 *Tamaño:* ${formattedSize}\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Procesando envío de datos...*`

        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - DOWNLOAD 🌸`,
                    body: res.fileName,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        // Usamos fetch para obtener el Buffer (más compatible con archivos pequeños/medianos)
        const response = await fetch(res.downloadUrl)
        if (!response.ok) throw new Error(`Error al descargar: ${response.statusText}`)
        const buffer = await response.buffer()

        await conn.sendMessage(m.chat, {
            document: buffer, 
            fileName: res.fileName || 'archivo_eris.zip',
            mimetype: res.mimetype || 'application/octet-stream',
            caption: `> 🌸 *Archivo entregado con éxito.*`
        }, { quoted: m })
        
        await m.react('✅')

    } catch (error) {
        console.error("Error Google Drive:", error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Fallo en la carga:* El servidor de Google rechazó la conexión o el archivo es privado.`, m)
    }
}

handler.help = ['gdrive <url>']
handler.tags = ['descargas']
handler.command = ['gdrive', 'drive']
handler.register = false

export default handler

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
