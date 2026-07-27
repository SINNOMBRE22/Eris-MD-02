/* 🌸 BAN USUARIO - ERIS-MD (DOBLE MÉTODO) 🌸 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, groupMetadata }) => {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
    const thumb = fs.readFileSync(imgPath)

    // 🔥 detectar usuario (mención o reply)
    let user = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
        ? m.quoted.sender 
        : null

    if (!user) {
        return m.reply(`✦ *USO INCORRECTO*\n\n✧ Acción:\n➤ Menciona o responde a un usuario.`)
    }

    const ownerGroup = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
    const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

    // 🔒 protecciones
    if (user === conn.user.jid) return m.reply(`✦ No puedo eliminarme.`)
    if (user === ownerGroup) return m.reply(`✦ No puedo eliminar al creador del grupo.`)
    if (user === ownerBot) return m.reply(`✦ No puedo eliminar a mi creador.`)

    const text = `
✧ Usuario:
➤ @${user.split('@')[0]}

✧ Acción:
>  Eliminado del grupo

⚠️ Acción ejecutada por un administrador.
`.trim()

    await conn.sendMessage(m.chat, {
        text,
        contextInfo: {
            mentionedJid: [user],
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial',
            },
            externalAdReply: {
                title: "🚫 ERIS-MD: BAN",
                body: groupMetadata.subject,
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })

    // 🚀 ejecutar ban
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
}

handler.help = ['ban2 @user']
handler.tags = ['grupos']
handler.command = ['ban2']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler
