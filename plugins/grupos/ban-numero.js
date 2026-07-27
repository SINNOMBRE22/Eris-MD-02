/* 🌸 PREFIJOS - ERIS-MD (LISTA & KICK) 🌸 */

import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, args, participants, groupMetadata, usedPrefix, command, isBotAdmin }) => {
    const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
    const thumb = fs.readFileSync(imgPath)

    if (!args[0]) {
        return m.reply(`✦ *USO INCORRECTO*\n\n✧ Acción:\n➤ Ingresa un prefijo\n\n➤ Ejemplo:\n${usedPrefix + command} 52`)
    }

    if (isNaN(args[0])) {
        return m.reply(`✦ *FORMATO INVÁLIDO*\n\n✧ Prefijo:\n➤ Debe ser numérico`)
    }

    const prefijo = args[0].replace(/\+/g, '')

    // 🔍 filtrar usuarios
    const users = participants
        .map(u => u.id)
        .filter(v => v !== conn.user.jid && v.startsWith(prefijo))

    if (!users.length) {
        return m.reply(`✦ No hay usuarios con el prefijo +${prefijo}`)
    }

    const list = users.map(v => `• @${v.split('@')[0]}`).join('\n')

    // 📋 LISTA
    if (command === 'listnum' || command === 'listanum') {
        const text = `
✦ *LISTA DE NÚMEROS*

✧ Prefijo:
➤ +${prefijo}

✧ Usuarios:
${list}

📊 Total: ${users.length}
`.trim()

        return conn.sendMessage(m.chat, {
            text,
            contextInfo: {
                mentionedJid: users,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363407502496951@newsletter',
                    newsletterName: '✨ Eris-MD Oficial',
                },
                externalAdReply: {
                    title: "📋 ERIS-MD: LISTNUM",
                    body: groupMetadata.subject,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })
    }

    // 💀 KICK
    if (command === 'kicknum') {
        if (!isBotAdmin) return m.reply(`✦ El bot no es administrador.`)

        const ownerGroup = groupMetadata.owner || m.chat.split`-`[0] + '@s.whatsapp.net'
        const ownerBot = global.owner[0][0] + '@s.whatsapp.net'

        const text = `
✦ *ELIMINACIÓN MASIVA*

✧ Prefijo:
➤ +${prefijo}

✧ Usuarios:
${list}

⚠️ Eliminando usuarios...
`.trim()

        await conn.sendMessage(m.chat, {
            text,
            contextInfo: {
                mentionedJid: users,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363407502496951@newsletter',
                    newsletterName: '✨ Eris-MD Oficial',
                },
                externalAdReply: {
                    title: "💀 ERIS-MD: KICKNUM",
                    body: groupMetadata.subject,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: m })

        const delay = ms => new Promise(res => setTimeout(res, ms))

        for (let user of users) {
            if (
                user !== conn.user.jid &&
                user !== ownerGroup &&
                user !== ownerBot
            ) {
                await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
                await delay(1500)
            }
        }

        await m.reply(`✓ Limpieza completada.`)
    }
}

handler.command = ['kicknum', 'listnum']  // kicknum = eliminar, listnum = mostrar lista
handler.tags = ['admins']                  // Categoría: Admin
handler.help = [
  'listnum', 'kicknum'
];

export default handler
