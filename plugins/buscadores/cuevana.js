/* ERIS-MD CUEVANA SEARCHER - ELEGANT & STABLE */

import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return conn.reply(m.chat, `🌸 *¿Qué película o serie deseas buscar hoy?*\n\n*Ejemplo:* ${usedPrefix + command} La Sirena`, m)

    // Leer miniatura local perfil2.jpeg
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = await conn.getName(m.sender)

    try {
        await m.react('🕓')

        // Formatear la búsqueda para que el link sea 100% exacto
        const searchName = text.trim().replace(/\s+/g, '+')
        const cuevanaUrl = `https://cue-vana3.org/?s=${searchName}`

        // Estructura elegante del mensaje
        let caption = `╭─── [ 📽️  *CUEVANA SEARCH* ] ──···\n`
        caption += `│ 👤 *Usuario:* ${name}\n`
        caption += `│ 🔍 *Búsqueda:* ${text}\n`
        caption += `│ 🟢 *Estado:* Servidor Estable\n`
        caption += `╰─────────────────────────···\n\n`
        
        caption += `🎬 *Resultados Localizados:*\n`
        caption += `He preparado tu pase directo al catálogo. Toca el enlace para ver todas las coincidencias de tu película:\n\n`
        
        caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        caption += `🔗 *Acceso Directo:*\n${cuevanaUrl}\n\n`
        caption += `─ׄ─ׄ─⭒─ׄ─ׅ─ׄ⭒─ׄ─ׄ─\n\n`
        
        caption += `> 🌸 *Tip de Eris:* *Utiliza el Navegador Brave* Usa el enlace para entrar directamente a la lista de opciones de Cuevana.`

        await conn.sendMessage(m.chat, {
            text: caption,
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
                    title: `🌸 ERIS SERVICE - CUEVANA 🌸`,
                    body: `Buscador para: ${name}`,
                    thumbnail: thumb, // Aquí va el icono pequeño
                    mediaType: 1,
                    renderLargerThumbnail: false, // Formato discreto activado
                    sourceUrl: redes
                }
            }
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error(error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Ocurrió un error al generar el enlace de búsqueda.*`, m)
    }
}

handler.help = ['cuevana <nombre>']
handler.command = ['cuevana', 'cuevanasearch']
handler.tags = ['buscadores']
handler.register = false

export default handler
