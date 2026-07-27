/* 🌸 SISTEMA DE GRUPOS - ERIS-MD (IDENTIDAD TOTAL) 🌸 */
import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    // MINIATURA (perfil)
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.existsSync(imgPath) ? fs.readFileSync(imgPath) : null
    } catch {
        thumb = null
    }

    // TEXTO
    let texto = `
✦ *COMUNIDAD OFICIAL*

✧ Grupo Principal:
➤ ${global.gp1 || 'Enlace no disponible'}

✧ Comunidad:
➤ ${global.comunidad1 || 'Enlace no disponible'}

✧ Canal Oficial:
➤ ${global.channel || 'Enlace no disponible'}`.trim()

    // 🚀 ENVÍO SOLO CON MINIATURA (SIN IMAGEN GRANDE)
    await conn.sendMessage(m.chat, {
        text: texto,
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial',
            },
            externalAdReply: {
                title: '🌸 ERIS-MD: COMUNIDAD 🌸',
                body: 'SinNombre 👑',
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: true, // ahora sí se ve grande tipo preview
                showAdAttribution: true
            }
        }
    }, { quoted: m })

    m.react('🌸')
}

handler.help = ['grupos']
handler.tags = ['info']
handler.command = ['grupos', 'links', 'groups']

export default handler
