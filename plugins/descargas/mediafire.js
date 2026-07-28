/* ERIS-MD MEDIAFIRE DOWNLOADER - STREAMING A DISCO (SIN RAM) */

import axios from 'axios'
import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// Subcarpeta propia: el limpiador de tmp borra archivos sueltos cada 5 min,
// pero no entra a subcarpetas, así una descarga larga no se corta.
const DL_DIR = path.join(process.cwd(), 'tmp', 'downloads')

const LIMITE_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB

// --- HEADERS PARA EVITAR BLOQUEOS ---
const DEFAULT_HEADERS = {
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'accept-language': 'es-ES,es;q=0.9,en;q=0.8',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    'sec-ch-ua-platform': '"Windows"',
    'upgrade-insecure-requests': '1'
}

// Convierte bytes a texto legible
function formatBytes(bytes) {
    if (!bytes || isNaN(bytes)) return 'desconocido'
    const u = ['B', 'KB', 'MB', 'GB']
    let i = 0
    while (bytes >= 1024 && i < u.length - 1) { bytes /= 1024; i++ }
    return `${bytes.toFixed(2)} ${u[i]}`
}

// Limpia el nombre para que sea seguro como archivo
function nombreSeguro(nombre) {
    return (nombre || 'archivo')
        .replace(/[\/\\?%*:|"<>]/g, '_')
        .slice(0, 120)
}

async function mediafiredlScraper(url) {
    const response = await axios.get(url, { headers: DEFAULT_HEADERS, timeout: 20000 })
    const $ = cheerio.load(response.data)

    const boton = $('#downloadButton')
    let downloadUrl = (boton.attr('href') || '').trim()

    // MediaFire a veces ofusca el enlace en base64 dentro de data-scrambled-url
    if (!downloadUrl || downloadUrl.startsWith('#')) {
        const scrambled = boton.attr('data-scrambled-url')
        if (scrambled) {
            try { downloadUrl = Buffer.from(scrambled, 'base64').toString('utf8').trim() } catch {}
        }
    }

    const $intro = $('div.dl-info > div.intro')
    const filename = $intro.find('div.filename').text().trim()
    const filesizeH = $('div.dl-info > ul.details > li').eq(0).find('span').text().trim()
    const filetype = $intro.find('div.filetype > span').eq(0).text().trim()
    const extMatch = /\(\.(.*?)\)/.exec($intro.find('div.filetype > span').eq(1).text())
    const ext = extMatch?.[1]?.trim() || 'bin'

    if (!downloadUrl || !/^https?:\/\//.test(downloadUrl)) {
        throw new Error('No se pudo extraer el enlace. El archivo podría ser privado o requerir verificación manual.')
    }

    return { url: downloadUrl, filename, filesizeH, filetype, ext }
}

// Descarga por streaming directo a disco (nunca entra completo a la RAM)
async function descargarADisco(url, destino) {
    const respuesta = await axios({
        method: 'GET',
        url,
        responseType: 'stream',      // <- clave: stream, no buffer
        headers: DEFAULT_HEADERS,
        maxRedirects: 5,
        timeout: 0,                  // sin límite: archivos grandes tardan
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    })

    // Verificar tamaño antes de escribir, si el servidor lo informa
    const tam = parseInt(respuesta.headers['content-length'] || '0', 10)
    if (tam && tam > LIMITE_BYTES) {
        respuesta.data.destroy()
        throw new Error(`El archivo pesa ${formatBytes(tam)} y supera el límite de 2 GB.`)
    }

    // Escribir el stream directo al archivo
    await pipeline(respuesta.data, fs.createWriteStream(destino))
    return fs.statSync(destino).size
}

let handler = async (m, { conn, text, usedPrefix, command }) => {

    let thumb
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'))
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender).catch(() => null)) || 'Usuario'

    if (!text) {
        const helpText = `🌸 *Enlace requerido, ${name}.*\n\nIndica una URL de MediaFire.\n> *Ejemplo:* ${usedPrefix + command} https://www.mediafire.com/file/...`
        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - MEDIAFIRE 🌸`,
                    body: `Hola ${name}, te falta el link.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    if (!/mediafire\.com/i.test(text)) {
        return conn.reply(m.chat, '🌸 *Ese enlace no es de MediaFire.*', m)
    }

    await m.react('🕓')

    let rutaTemporal = null
    try {
        // 1. Obtener datos reales del archivo
        const fileData = await mediafiredlScraper(text.trim())

        // 2. Avisar antes de descargar
        let caption = `╭─── [ 📂 *MEDIAFIRE DL* ] ──···\n`
        caption += `│ 📦 *Archivo:* ${fileData.filename}\n`
        caption += `│ ⚖️ *Tamaño:* ${fileData.filesizeH}\n`
        caption += `│ 📂 *Tipo:* ${fileData.filetype} (.${fileData.ext})\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Descargando al servidor...*`

        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - DOWNLOAD 🌸`,
                    body: fileData.filename,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: text
                }
            }
        }, { quoted: m })

        // 3. Descargar por streaming a disco
        if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR, { recursive: true })
        const nombreArchivo = nombreSeguro(fileData.filename) || `mf_${Date.now()}.${fileData.ext}`
        rutaTemporal = path.join(DL_DIR, `${Date.now()}_${nombreArchivo}`)

        const pesoFinal = await descargarADisco(fileData.url, rutaTemporal)

        if (pesoFinal > LIMITE_BYTES) {
            throw new Error(`El archivo descargado pesa ${formatBytes(pesoFinal)} y supera el límite de 2 GB.`)
        }
        if (pesoFinal === 0) {
            throw new Error('La descarga llegó vacía.')
        }

        // 4. Enviar desde disco (Baileys lo lee en streaming, no lo carga completo)
        await conn.sendMessage(m.chat, {
            document: { url: rutaTemporal },
            fileName: fileData.filename || nombreArchivo,
            mimetype: 'application/octet-stream',
            caption: `✅ *${fileData.filename}*\n⚖️ ${formatBytes(pesoFinal)}`
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error('Error MediaFire:', error.message)
        await m.react('❌')
        conn.reply(
            m.chat,
            `🌸 *Fallo en la operación:*\n${error.message || 'MediaFire bloqueó la conexión automática. Verifica que el enlace sea público.'}`,
            m
        )
    } finally {
        // 5. Borrar el temporal siempre, para no llenar el disco del VPS
        if (rutaTemporal && fs.existsSync(rutaTemporal)) {
            try { fs.unlinkSync(rutaTemporal) } catch {}
        }
    }
}

handler.help = ['mediafire <url>']
handler.tags = ['descargas']
handler.command = ['mf', 'mediafire']
handler.register = false

export default handler
