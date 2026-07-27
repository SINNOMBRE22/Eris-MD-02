/* 🌸 SISTEMA DE FANTASMAS - ERIS-MD (ESTILO TAG ADMINS) 🌸 */

import { areJidsSameUser } from '@whiskeysockets/baileys'

let handler = async (m, { conn, participants, groupMetadata, command }) => {
    const pp = await conn.profilePictureUrl(m.chat, 'image').catch((_) => null) || './src/imagenes/perfil2.jpeg'

    let chat = global.db.data.chats[m.chat]
    let members = participants.map(u => u.id)

    // filtrar fantasmas
    let ghosts = members.filter(id => {
        let user = global.db.data.users[id]
        let participant = participants.find(u => u.id === id)

        return (
            (!user || user.chat === 0) &&
            !participant?.admin &&
            !participant?.superadmin &&
            !areJidsSameUser(id, conn.user.id) &&
            (!user || user.whitelist !== true)
        )
    })

    let total = ghosts.length
    if (total === 0) return m.reply(`✦ No se encontraron usuarios inactivos.`)

    const list = ghosts.map(v => `• @${v.split('@')[0]}`).join('\n')
    const isKick = command === 'kickfantasmas'

    const text = `
✦ *${isKick ? 'ELIMINACIÓN DE INACTIVOS' : 'REVISIÓN DE INACTIVOS'}*

✧ Grupo:
➤ ${groupMetadata.subject}

✧ Usuarios:
${list}

✧ Estado:
➤ ${isKick ? 'Eliminación en 10 segundos.' : `Total: ${total}`}

⚠️ ${isKick ? 'Acción automática en proceso.' : 'Solo visualización.'}
`.trim()

    await conn.sendMessage(m.chat, { 
        text,
        contextInfo: {
            mentionedJid: ghosts,
            externalAdReply: {
                title: isKick ? "💀 LIMPIEZA DE INACTIVOS" : "👻 USUARIOS INACTIVOS",
                body: groupMetadata.subject,
                thumbnailUrl: pp,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m })

    // eliminación
    if (isKick) {
        await new Promise(res => setTimeout(res, 10000))

        let backup = chat.welcome
        chat.welcome = false

        try {
            for (let user of ghosts) {
                await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
                await new Promise(res => setTimeout(res, 1500))
            }
        } catch (e) {
            console.error(e)
        } finally {
            chat.welcome = backup
            m.reply(`✓ Limpieza completada.`)
        }
    }
}

handler.help = ['fantasmas', 'kickfantasmas']
handler.tags = ['grupos']
handler.command = ['fantasmas', 'kickfantasmas']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
