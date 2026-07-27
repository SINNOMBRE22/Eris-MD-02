/* 🌸 COMANDO: OWNER/CREADOR - ERIS-MD (IDENTIDAD ÚNICA: SINNOMBRE) 🌸 */

import fs from 'fs'
import path from 'path'
import PhoneNumber from 'awesome-phonenumber'

const handler = async (m, { conn }) => {
    // 🌸 MINIATURA: RUTA EXACTA DE TU PERFIL (perfil2.jpeg)
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    m.react('👑')

    // ✧ TU INFORMACIÓN ÚNICA ✧
    const miNumero = '5215629885039'
    const miNombre = 'SinNombre 👑'
    const miBio = await conn.fetchStatus(miNumero + '@s.whatsapp.net').then(res => res.status).catch(_ => 'Desarrollador de SN PLUS')

    const textMessage = `
✦ *CONTACTO OFICIAL*

✧ Desarrollador Único:
➤ ${miNombre}

✧ Proyecto:
➤ Eris-MD & SN PLUS

✧ Redes Oficiales:
• Telegram: https://t.me/SIN_NOMBRE22
• WhatsApp: https://wa.me/message/VM4JCHQ5RF45K1

⚠️ Solo contactar por temas de soporte técnico o negocios.`.trim()

    // 1. Enviar el mensaje con el Alma de Eris
    await conn.sendMessage(m.chat, { 
        text: textMessage, 
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial',
            },
            externalAdReply: {
                title: '🌸 ERIS-MD: ÚNICO OWNER 🌸',
                body: 'Contacto Directo con el Desarrollador',
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })

    // 2. Generar y enviar tu VCard (Tarjeta de Contacto)
    const vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${miNombre};;;
FN:${miNombre}
item.ORG:Creador de SN PLUS
item1.TEL;waid=${miNumero}:${PhoneNumber('+' + miNumero).getNumber('international')}
item1.X-ABLabel:Dueño Principal
item2.ADR:;;🇲🇽 México;;;;
item2.X-ABLabel:Región
item3.URL:https://github.com/SinNombre-dev
item3.X-ABLabel:GitHub Oficial
item4.X-ABLabel:${miBio}
END:VCARD`.trim()

    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: miNombre,
            contacts: [{ vcard, displayName: miNombre }]
        }
    }, { quoted: m })
}

handler.help = ['owner', 'creador']
handler.tags = ['info']
handler.command = ['owner', 'creator', 'creador', 'dueño']

export default handler
