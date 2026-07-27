/* 🌸 ANTI-VIEWONCE - ERIS-MD SYSTEM (BLINDADO) 🌸 */

import { downloadContentFromMessage } from "@whiskeysockets/baileys"

export async function before(m, { conn }) {
    let chat = global.db.data.chats[m.chat]
    if (!chat?.antiver && !chat?.antiVer) return 
    if (chat?.isBanned) return

    if (!m.message) return

    // 1. Buscamos la llave real del mensaje, ignorando basura técnica de WhatsApp
    let type = Object.keys(m.message).find(k => k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo')
    if (!type) return

    let isViewOnce = false
    let msgNode = m.message[type]
    let mediaType = type

    // 2. ¿Es una caja fuerte tradicional de ViewOnce?
    if (/viewOnce/.test(type)) {
        isViewOnce = true
        mediaType = Object.keys(msgNode.message)[0] // 'imageMessage', 'videoMessage' o 'audioMessage'
        msgNode = msgNode.message[mediaType]
    } 
    // 3. ¿Es el nuevo formato oculto (TIPO 2)?
    else if (msgNode?.viewOnce) {
        isViewOnce = true
    }

    // Si NO es ver una sola vez, nos retiramos silenciosamente
    if (!isViewOnce) return

    // 4. Mapeamos qué vamos a descargar
    let dlType = mediaType === 'imageMessage' ? 'image' : 
                 mediaType === 'videoMessage' ? 'video' : 
                 mediaType === 'audioMessage' ? 'audio' : null

    if (!dlType) return

    try {
        // Descargamos el contenido a la fuerza
        let media = await downloadContentFromMessage(msgNode, dlType)
        let buffer = Buffer.from([])
        for await (const chunk of media) {
            buffer = Buffer.concat([buffer, chunk])
        }

        const name = conn.getName(m.sender)
        const caption = `> ⊰🌸⊱ *ANTI-VER UNA VEZ*\n\n➥ **De:** ${name}\n${msgNode.caption ? `➥ **Nota:** ${msgNode.caption}` : ''}\n\nEris-MD rompió la seguridad con éxito.`.trim()

        const contextInfo = {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial'
            }
        }

        // 5. Entregamos el botín al grupo
        if (dlType === 'video') {
            await conn.sendFile(m.chat, buffer, 'video.mp4', caption, m, false, { mentions: [m.sender], contextInfo })
        } else if (dlType === 'image') {
            await conn.sendFile(m.chat, buffer, 'image.jpg', caption, m, false, { mentions: [m.sender], contextInfo })
        } else if (dlType === 'audio') {
            // Reenvía los audios efímeros como notas de voz normales
            await conn.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mp4', ptt: true, contextInfo }, { quoted: m })
        }
        
    } catch (error) {
        console.error('🌸❌ Error al romper ViewOnce:', error)
    }
}
