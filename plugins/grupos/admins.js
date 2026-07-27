/* 🌸 COMANDO: TAG ADMINS - ERIS-MD (MINIATURA GRANDE) 🌸 */

const handler = async (m, { conn, participants, groupMetadata, args }) => {
    const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || './src/imagenes/perfil2.jpeg'
    
    const groupAdmins = participants.filter((p) => p.admin)
    const owner = groupMetadata.owner || groupAdmins.find((p) => p.admin === 'superadmin')?.id || m.chat.split`-`[0] + '@s.whatsapp.net'
    
    const listAdmin = groupAdmins.map((v) => `• @${v.id.split('@')[0]}`).join('\n')
    
    const pesan = args.join(' ') || 'Sin mensaje específico.'

    const text = `
✦ *LLAMADO A ADMINS*

✧ Grupo:
➤ ${groupMetadata.subject}

✧ Mensaje:
➤ ${pesan}

✧ Administradores:
${listAdmin}

⚠️ Nota: Usar solo en casos importantes.
`.trim()

    await conn.sendMessage(m.chat, { 
        text,
        contextInfo: {
            mentionedJid: [...groupAdmins.map((v) => v.id), owner],
            externalAdReply: {
                title: "🚨 LLAMADO A ADMINS",
                body: groupMetadata.subject,
                thumbnailUrl: pp,
                sourceUrl: "https://wa.me/",
                mediaType: 1,
                renderLargerThumbnail: true // 🔥 AQUÍ EL CAMBIO
            }
        }
    }, { quoted: m })
}

handler.help = ['admins <texto>']
handler.tags = ['grupos']
handler.command = /^(admins|@admins|tagadmins)$/i
handler.group = true

export default handler
