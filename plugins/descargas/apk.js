/* ERIS-MD APK DOWNLOADER - APTOIDE VERSION */

import { search, download } from 'aptoide-scraper'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

var handler = async (m, { conn, usedPrefix, command, text }) => {
    
    // Miniatura de Eris
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario"

    if (!text) {
        const helpText = `🌸 *Falta el nombre de la App, ${name}.*\n\nNecesito saber qué aplicación quieres descargar.\n> *Ejemplo:* ${usedPrefix + command} WhatsApp`
        
        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - APK 🌸`,
                    body: `Hola ${name}, indica una App.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    try {
        await m.react('🕓')

        // 1. Buscamos la App
        let searchResults = await search(text)
        if (!searchResults || searchResults.length === 0) {
            await m.react('❌')
            return conn.reply(m.chat, `🌸 *Sin resultados:* No encontré ninguna App llamada "${text}" en Aptoide.`, m)
        }

        // 2. Obtenemos datos de descarga del primer resultado
        let appData = await download(searchResults[0].id)
        
        if (!appData || !appData.dllink) {
            throw new Error('No se pudo obtener el link de descarga.')
        }

        // 3. Verificamos peso (Límite 500MB para no matar el VPS)
        const sizeString = appData.size.toUpperCase()
        const isTooHeavy = sizeString.includes('GB') || (sizeString.includes('MB') && parseFloat(sizeString) > 500)

        let caption = `╭─── [ 📥 *APK DOWNLOADER* ] ──···\n`
        caption += `│ 📱 *App:* ${appData.name}\n`
        caption += `│ 📦 *Paquete:* ${appData.package}\n`
        caption += `│ ⚖️ *Tamaño:* ${appData.size}\n`
        caption += `│ 🗓️ *Actualizada:* ${appData.lastup}\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Eris Service - Enviando Aplicación...*`

        // Enviamos miniatura e info
        await conn.sendMessage(m.chat, { 
            image: { url: appData.icon }, 
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: `🌸 APK LOCALIZADA 🌸`,
                    body: appData.name,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        if (isTooHeavy) {
            await m.react('⚠️')
            return conn.reply(m.chat, `⚠️ *Archivo muy pesado:* El APK pesa ${appData.size}, lo cual excede el límite de seguridad de 500MB.`, m)
        }

        // 4. Enviamos el archivo APK
        await conn.sendMessage(m.chat, {
            document: { url: appData.dllink },
            mimetype: 'application/vnd.android.package-archive',
            fileName: `${appData.name}.apk`,
            caption: `> 🌸 *${appData.name} lista para instalar.*`
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error("Error APK DL:", error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error:* Hubo un fallo al intentar descargar la APK. Intenta más tarde.`, m)
    }
}

handler.help = ['apk <app>', 'aptoide <app>']
handler.tags = ['descargas']
handler.command = ['apk', 'modapk', 'aptoide', 'apkmod']
handler.register = false

export default handler
