/* 🌸 SISTEMA DE HIDETAG - ERIS-MD (ESTILO LIMPIO) 🌸 */

import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import fs from 'fs'
import path from 'path'

var handler = async (m, { conn, text, participants, groupMetadata }) => {
    // 🌸 MINIATURA: RUTA EXACTA DE TU PERFIL
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    // Verificación de entrada
    if (!m.quoted && !text) return m.reply(`✦ Debes enviar un texto o responder a un mensaje para notificar al grupo.`)

    let users = participants.map(u => u.id)
    let q = m.quoted ? m.quoted : m
    let msgText = text || (m.quoted ? q.text : '')

    // ✧ ESTILO DE TEXTO ERIS-MD ✧
    const cleanText = `
✦ *NOTIFICACIÓN GRUPAL*

✧ Grupo:
➤ ${groupMetadata.subject}

✧ Mensaje:
${msgText}

⚠️ Notificación enviada a todos los miembros.
`.trim()

    try {
        // Lógica para Multimedia (Imagen, Video, etc.)
        if (q.mimetype && /image|video|sticker|audio/.test(q.mimetype)) {
            const media = await q.download?.()
            const msgType = q.mtype
            
            let mediaObj = {}
            if (msgType === 'imageMessage') mediaObj = { image: media, caption: cleanText }
            else if (msgType === 'videoMessage') mediaObj = { video: media, caption: cleanText, mimetype: 'video/mp4' }
            else if (msgType === 'audioMessage') mediaObj = { audio: media, mimetype: 'audio/mp4', fileName: 'hidetag.mp3' }
            else if (msgType === 'stickerMessage') mediaObj = { sticker: media }

            await conn.sendMessage(m.chat, { ...mediaObj, mentions: users }, { quoted: null })
            
        } else {
            // Lógica para Texto con el Estilo Limpio y Miniatura
            await conn.relayMessage(m.chat, {
                extendedTextMessage: {
                    text: cleanText,
                    contextInfo: { 
                        mentionedJid: users,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363407502496951@newsletter',
                            newsletterName: '✨ Eris-MD Oficial',
                        },
                        externalAdReply: { 
                            title: '🌸 ERIS-MD: NOTIFICACIÓN 🌸',
                            body: groupMetadata.subject,
                            thumbnail: thumb, 
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }
            }, {})
        }

    } catch (e) {
        console.error('🌸❌ Error en Hidetag:', e)
        conn.reply(m.chat, '❌ Ocurrió un error al intentar notificar.', m)
    }
}

handler.help = ['notificar']
handler.tags = ['grupos', 'admins']
handler.command = ['hidetag', 'notificar', 'notify', 'tag']
handler.group = true
handler.admin = true

export default handler
