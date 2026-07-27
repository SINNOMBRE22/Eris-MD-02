/* 🌸 INFO DEL GRUPO - ERIS-MD (MINIATURA GRANDE + MENCIONES) 🌸 */

const handler = async (m, { conn, participants, groupMetadata }) => {
    const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || './src/imagenes/perfil2.jpeg'

    const { antiLink, detect, welcome, modoadmin, antiPrivate, autoRechazar, nsfw, autoAceptar, restrict, antiSpam, reaction, antiviewonce, antiTraba, antiToxic } = global.db.data.chats[m.chat]
    
    const groupAdmins = participants.filter((p) => p.admin)

    const listAdmin = groupAdmins.map(v => `• @${v.id.split('@')[0]}`).join('\n')

    const owner = groupMetadata.owner 
        || groupAdmins.find((p) => p.admin === 'superadmin')?.id 
        || m.chat.split`-`[0] + '@s.whatsapp.net'

    const mentions = [
        owner,
        ...groupAdmins.map(v => v.id)
    ]

    let text = `
✦ *INFO DEL GRUPO*

✧ Nombre:
➤ ${groupMetadata.subject}

✧ ID:
➤ ${groupMetadata.id}

✧ Descripción:
➤ ${groupMetadata.desc?.toString() || 'Sin descripción'}

✧ Miembros:
➤ ${participants.length} usuarios

✧ Creador:
➤ @${owner.split('@')[0]}

✦ *ADMINISTRADORES*
${listAdmin}

✦ *CONFIGURACIÓN*
• Welcome: ${welcome ? '✅' : '❌'}
• Detect: ${detect ? '✅' : '❌'}  
• Antilink: ${antiLink ? '✅' : '❌'} 
• Autoaceptar: ${autoAceptar ? '✅' : '❌'} 
• Autorechazar: ${autoRechazar ? '✅' : '❌'} 
• Nsfw: ${nsfw ? '✅' : '❌'} 
• Antiprivado: ${antiPrivate ? '✅' : '❌'} 
• Modoadmin: ${modoadmin ? '✅' : '❌'} 
• Antiver: ${antiviewonce ? '✅' : '❌'} 
• Reacción: ${reaction ? "✅" : "❌"}
• Antispam: ${antiSpam ? '✅' : '❌'} 
• Restrict: ${restrict ? '✅' : '❌'} 
• Antitoxic: ${antiToxic ? '✅' : '❌'} 
• Antitraba: ${antiTraba ? '✅' : '❌'}

⚠️ Información generada por Eris-MD.
`.trim()

    await conn.sendMessage(m.chat, { 
        text,
        contextInfo: {
            mentionedJid: mentions,
            externalAdReply: {
                title: "🌸 INFO DEL GRUPO",
                body: groupMetadata.subject,
                thumbnailUrl: pp,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['infogrupo']
handler.tags = ['grupos']
handler.command = ['infogrupo', 'gp', 'groupinfo']
handler.group = true

export default handler
