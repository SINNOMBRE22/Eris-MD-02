import jsQR from 'jsqr'
import Jimp from 'jimp'

const handler = async (m, { conn, usedPrefix, command }) => {
    // Tomar la imagen: mensaje citado o el propio mensaje
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''

    if (!/image\/(jpe?g|png)/.test(mime)) {
        return conn.reply(
            m.chat,
            `🌸 *Lector de QR*\n\nResponde a una imagen que contenga un código QR con:\n${usedPrefix + command}\n\n💡 La imagen debe ser clara y estar bien enfocada.`,
            m
        )
    }

    await m.react('⌛')

    try {
        // Descargar la imagen y leer sus pixeles
        const media = await q.download()
        const imagen = await Jimp.read(media)

        const { data, width, height } = imagen.bitmap
        // jsQR necesita un Uint8ClampedArray de los pixeles RGBA
        const codigo = jsQR(new Uint8ClampedArray(data), width, height)

        if (!codigo || !codigo.data) {
            await m.react('❌')
            return conn.reply(
                m.chat,
                '⚠️ No pude detectar ningún código QR en la imagen. Asegúrate de que se vea nítido y completo.',
                m
            )
        }

        await conn.reply(
            m.chat,
            `✅ *Contenido del QR:*\n\n${codigo.data}`,
            m
        )

        await m.react('✅')
    } catch (e) {
        console.error('Error al leer QR:', e)
        await m.react('❌')
        conn.reply(m.chat, '🌸 *Error interno.* No pude procesar la imagen.', m)
    }
}

handler.help = ['readqr (responder a imagen con QR)']
handler.tags = ['tools']
handler.command = ['readqr', 'leerqr', 'scanqr']
handler.group = false
handler.register = false

export default handler
