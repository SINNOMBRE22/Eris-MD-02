import QRCode from 'qrcode'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    // Aceptar texto directo o mensaje citado
    const contenido = text || (m.quoted && m.quoted.text) || ''

    if (!contenido.trim()) {
        return conn.reply(
            m.chat,
            `🌸 *Generador de QR*\n\nEscribe el texto o enlace que quieres convertir en código QR.\n\n📌 *Ejemplo:*\n${usedPrefix + command} https://sinnombre.xyz\n\n💡 También puedes responder a un mensaje con ${usedPrefix + command}`,
            m
        )
    }

    // Límite de QR estándar (~2953 bytes); avisamos antes de tronar
    if (contenido.length > 2900) {
        return conn.reply(m.chat, '⚠️ El texto es demasiado largo para un código QR.', m)
    }

    await m.react('⌛')

    try {
        // Generar el QR como buffer PNG (nítido, con margen y buen contraste)
        const buffer = await QRCode.toBuffer(contenido, {
            errorCorrectionLevel: 'H',
            type: 'png',
            margin: 2,
            scale: 10,
            color: {
                dark: '#000000ff',
                light: '#ffffffff'
            }
        })

        await conn.sendMessage(
            m.chat,
            {
                image: buffer,
                caption: `✅ *Código QR generado*\n\n📋 Contenido:\n${contenido.length > 100 ? contenido.slice(0, 100) + '…' : contenido}`
            },
            { quoted: m }
        )

        await m.react('✅')
    } catch (e) {
        console.error('Error al generar QR:', e)
        await m.react('❌')
        conn.reply(m.chat, '🌸 *Error interno.* No pude generar el código QR.', m)
    }
}

handler.help = ['qr <texto/enlace>']
handler.tags = ['tools']
handler.command = ['qr', 'qrcode', 'generarqr']
handler.group = false
handler.register = false

export default handler
