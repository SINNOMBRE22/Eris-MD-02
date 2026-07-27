/* ERIS-MD GITHUB CLONER */

import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i

const handler = async (m, { conn, args, usedPrefix, command }) => {
    
    // Miniatura de Eris
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender)) || "Usuario"

    // --- RESPUESTA CON MINIATURA SI FALTA EL LINK ---
    if (!args[0]) {
        const helpText = `🌸 *Enlace requerido, ${name}.*\n\nNecesito la URL de un repositorio de GitHub para iniciar la clonación.\n> *Ejemplo:* ${usedPrefix + command} https://github.com/SINNOMBRE22/Eris-MD`
        
        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - GITHUB 🌸`,
                    body: `Hola ${name}, indica un repositorio.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    if (!regex.test(args[0])) {
        await m.react('❌')
        return conn.reply(m.chat, `🌸 *Enlace inválido.* Asegúrate de que sea una URL de GitHub válida.`, m)
    }

    let [_, user, repo] = args[0].match(regex) || []
    let sanitizedRepo = repo.replace(/.git$/, '')
    let repoUrl = `https://api.github.com/repos/${user}/${sanitizedRepo}`
    let zipUrl = `https://api.github.com/repos/${user}/${sanitizedRepo}/zipball`

    await m.react('🕓')

    try {
        // Obtenemos información del repositorio
        let response = await fetch(repoUrl)
        if (!response.ok) throw new Error('Repositorio no encontrado o privado.')
        let repoData = await response.json()

        let caption = `╭─── [ 🛡️ *GITHUB CLONER* ] ──···\n`
        caption += `│ 📦 *Repositorio:* ${sanitizedRepo}\n`
        caption += `│ 👤 *Autor:* ${repoData.owner.login}\n`
        caption += `│ 📝 *Descripción:* ${repoData.description || 'Sin descripción'}\n`
        caption += `╰─────────────────────────···\n\n`
        caption += `> 🌸 *Enviando archivo comprimido...*`

        // Enviamos la tarjeta informativa
        await conn.sendMessage(m.chat, {
            text: caption,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - CLONING 🌸`,
                    body: `Procesando: ${sanitizedRepo}`,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: args[0]
                }
            }
        }, { quoted: m })

        // Descargamos y enviamos el ZIP
        let zipResponse = await fetch(zipUrl)
        let filename = `${sanitizedRepo}.zip`
        let buffer = await zipResponse.buffer()

        await conn.sendMessage(m.chat, {
            document: buffer,
            fileName: filename,
            mimetype: 'application/zip',
            caption: `> 🌸 *Clonación finalizada con éxito.*`
        }, { quoted: m })

        await m.react('✅')

    } catch (error) {
        console.error("Error GitHub:", error)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error:* No pude completar la clonación.\n> Detalle: ${error.message}`, m)
    }
}

handler.help = ['gitclone <url>']
handler.tags = ['descargas']
handler.command = ['gitclone', 'git']
handler.register = false

export default handler
