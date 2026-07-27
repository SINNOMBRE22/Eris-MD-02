import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // Detectar al usuario a promocionar
    let who = m.mentionedJid?.[0] || m.quoted?.sender || (text ? text.replace(/[+@\s-]/g, '') + '@s.whatsapp.net' : false)
    if (!who) return m.reply(`> ꒰🌸꒱ *USO CORRECTO*\nEtiqueta al usuario o responde a su mensaje.\n\n*Ejemplo:*\n${usedPrefix + command} @user`)

    // Evitar promocionar al bot o al creador
    if (who === conn.user.jid) return m.reply(`> ꒰🌸꒱ No puedo promoverme a mí mismo. ✨`)
    const isOwner = global.owner?.some(owner => who.includes(owner[0]))
    if (isOwner) return m.reply(`> ꒰🌸꒱ No puedo promover a mi creador. ✨`)

    try {
        // Obtener info del grupo
        const groupMetadata = await conn.groupMetadata(m.chat)
        const participant = groupMetadata.participants.find(p => p.id === who)

        // Evitar promocionar si ya es admin
        if (participant?.admin === 'admin' || participant?.admin === 'superadmin') {
            return m.reply(`> ꒰🌸꒱ El usuario ya es administrador.`)
        }

        // Promocionar al usuario
        await conn.groupParticipantsUpdate(m.chat, [who], 'promote')

        // Mensaje final con mención real
        const caption = `> ꒰🌸꒱ *ADMINISTRACIÓN ACTUALIZADA*\n\n➥ @${who.split('@')[0]} ahora es administrador.\n> ✧ Promovido por: @${m.sender.split('@')[0]} ✨`

        await conn.sendMessage(
            m.chat,
            {
                text: caption,
                mentions: [who, m.sender]
            },
            { quoted: m }
        )

    } catch (e) {
        await m.reply(`> ꒰❌꒱ No pude promover. Asegúrate de que el usuario no sea administrador y que el Bot tenga permisos.`)
    }
}

handler.help = ['promote @user']
handler.tags = ['grupos', 'admins']
handler.command = ['promote', 'promover', 'darpija']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
