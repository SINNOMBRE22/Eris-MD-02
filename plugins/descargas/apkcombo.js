/* ERIS-MD APK DOWNLOADER - APKCOMBO (descarga al VPS primero) */
/* Requiere: npm install axios cheerio google-play-scraper       */

import axios from 'axios'
import * as cheerio from 'cheerio'
import gplay from 'google-play-scraper'
import fs from 'fs'
import path from 'path'
import { pipeline } from 'stream/promises'
import { createWriteStream, mkdirSync, rmSync } from 'fs'

const newsletterJid  = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes          = 'https://github.com/SINNOMBRE22/Eris-MD'
const TMP_DIR        = '/tmp/eris-apk'

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Referer': 'https://apkcombo.com/'
}

async function getApkComboInfo(packageId, appName) {
    const slug = appName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const url  = `https://apkcombo.com/${slug}/${packageId}/download/apk`
    const { data } = await axios.get(url, { headers: HEADERS, timeout: 20000 })
    const $ = cheerio.load(data)

    let dlLink = null, fileType = 'apk'

    $('a.variant').each((_, el) => {
        if (dlLink) return
        const href = $(el).attr('href') || ''
        if (!href || href.includes('apkcombo-installer') || href.includes('com.apkcombo.app')) return
        dlLink = href.startsWith('http') ? href : `https://apkcombo.com${href}`
        if (href.includes('.xapk')) fileType = 'xapk'
        else if (href.includes('.apks')) fileType = 'apks'
        else fileType = 'apk'
    })

    if (!dlLink) {
        $('a[href*=".apk"], a[href*=".xapk"], a[href*=".apks"]').each((_, el) => {
            if (dlLink) return
            const href = $(el).attr('href') || ''
            if (href.includes('apkcombo-installer') || href.includes('com.apkcombo.app')) return
            dlLink = href.startsWith('http') ? href : `https://apkcombo.com${href}`
            if (href.includes('.xapk')) fileType = 'xapk'
            else if (href.includes('.apks')) fileType = 'apks'
            else fileType = 'apk'
        })
    }

    return { dlLink, fileType }
}

// Descarga siguiendo todas las redirecciones y guarda en disco
async function downloadToDisk(url, destPath) {
    const response = await axios.get(url, {
        headers: {
            ...HEADERS,
            'Accept': 'application/octet-stream,*/*'
        },
        responseType: 'stream',
        timeout: 180000,
        maxRedirects: 10
    })
    await pipeline(response.data, createWriteStream(destPath))
    const stat = fs.statSync(destPath)
    if (stat.size < 1000) throw new Error('Archivo descargado muy pequeño, posible error de descarga')
}

const MIME = 'application/vnd.android.package-archive'

var handler = async (m, { conn, usedPrefix, command, text }) => {

    let thumb
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'))
    } catch { thumb = Buffer.alloc(0) }

    const name = m.pushName || (await conn.getName(m.sender)) || 'Usuario'

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: `🌸 *Falta el nombre de la App, ${name}.*\n\n> *Ejemplo:* ${usedPrefix + command} WhatsApp`,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: '🌸 ERIS SERVICE - APK 🌸',
                    body: `Hola ${name}, indica una App.`,
                    thumbnail: thumb, mediaType: 1,
                    renderLargerThumbnail: false, sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    const workDir = path.join(TMP_DIR, `${Date.now()}`)

    try {
        await m.react('🕓')

        // 1. Buscar en Google Play
        const searchResults = await gplay.search({ term: text, num: 1, lang: 'es', country: 'mx' })
        if (!searchResults?.length) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Sin resultados:* No encontré *"${text}"*.`, m)
        }

        const { appId: packageId, title: appName, icon: appIcon, scoreText: appScore = 'N/A' } = searchResults[0]

        // 2. Info extra Google Play
        let gpVersion = 'N/A', gpSize = 'N/A'
        try {
            const d = await gplay.app({ appId: packageId, lang: 'es', country: 'mx' })
            gpVersion = d.version || 'N/A'
            gpSize    = d.size    || 'N/A'
        } catch { /* ok */ }

        // 3. Link de APKCombo
        const { dlLink, fileType } = await getApkComboInfo(packageId, appName)
        if (!dlLink) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Sin link:* APKCombo no tiene *${appName}*.`, m)
        }

        const ext      = `.${fileType}`
        const fileName = `${appName}${ext}`

        // 4. Mostrar info
        let caption = `╭─── [ 📥 *APK DOWNLOADER* ] ──···\n`
        caption += `│ 📱 *App:* ${appName}\n`
        caption += `│ 📦 *Paquete:* ${packageId}\n`
        caption += `│ 🏷️ *Versión:* ${gpVersion}\n`
        caption += `│ ⚖️ *Tamaño:* ${gpSize}\n`
        caption += `│ 📁 *Formato:* ${ext.toUpperCase()}\n`
        caption += `│ ⭐ *Rating:* ${appScore}\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Descargando al servidor, espera...*`

        await conn.sendMessage(m.chat, {
            image: { url: appIcon }, caption,
            contextInfo: {
                externalAdReply: {
                    title: '🌸 APK LOCALIZADA 🌸', body: appName,
                    thumbnail: thumb, mediaType: 1, sourceUrl: redes
                }
            }
        }, { quoted: m })

        // 5. Descargar al VPS primero (resuelve redirecciones del CDN firmado)
        mkdirSync(workDir, { recursive: true })
        // Nombre limpio para el sistema de archivos (sin caracteres especiales)
        const safeName = packageId + ext
        const tmpFile  = path.join(workDir, safeName)
        await downloadToDisk(dlLink, tmpFile)

        // 6. Enviar desde disco (sin errores de parsing)
        const fileBuffer = fs.readFileSync(tmpFile)
        await conn.sendMessage(m.chat, {
            document: fileBuffer,
            mimetype: MIME,
            fileName: fileName,
            caption: `> 🌸 *${appName}* lista.\n> 📁 Formato: *${ext.toUpperCase()}*`
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error('[APK-DL] Error:', error.message)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error:* ${error.message}`, m)
    } finally {
        // Limpiar temporal
        try { rmSync(workDir, { recursive: true, force: true }) } catch { /* ok */ }
    }
}

handler.help = ['apkpure <app>']
handler.tags = ['descargas']
handler.command = ['apkpure', 'apkp', 'apkdl', 'apkcombo']
handler.register = false

export default handler
