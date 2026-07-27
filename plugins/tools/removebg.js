import axios from 'axios'
import FormData from 'form-data'

const handler = async (m, { conn, usedPrefix, command }) => {
    // Tomar la imagen: mensaje citado o el propio mensaje
    const q = m.quoted ? m.quoted : m
    const mime = (q.msg || q).mimetype || ''

    if (!/image\/(jpe?g|png)/.test(mime)) {
        return conn.reply(
            m.chat,
            `🌸 *Quitar fondo*\n\nResponde a una imagen (jpg o png) con:\n${usedPrefix + command}\n\n💡 Funciona mejor con fotos de personas u objetos bien definidos.`,
            m
        )
    }

    // Cargar las keys desde settings (arreglo). Compatible con una sola string también.
    let keys = global.removebg || []
    if (typeof keys === 'string') keys = [keys]
    keys = keys.filter(Boolean)

    if (!keys.length) {
        return conn.reply(
            m.chat,
            '⚠️ No hay ninguna API key configurada. El owner debe agregar `global.removebg` en settings.js.',
            m
        )
    }

    await m.react('⌛')

    try {
        const media = await q.download()

        let resultado = null
        let ultimoError = ''

        // Rotación: probar cada key hasta que una funcione
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            try {
                const form = new FormData()
                form.append('image_file', media, { filename: 'image.jpg' })
                form.append('size', 'auto')

                const respuesta = await axios.post(
                    'https://api.remove.bg/v1.0/removebg',
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            'X-Api-Key': key
                        },
                        responseType: 'arraybuffer',
                        validateStatus: () => true // manejamos los códigos a mano
                    }
                )

                // Éxito: llega el PNG
                if (respuesta.status === 200) {
                    resultado = Buffer.from(respuesta.data)
                    break
                }

                // Key sin créditos o inválida -> pasar a la siguiente
                if (respuesta.status === 402 || respuesta.status === 403) {
                    ultimoError = `Key ${i + 1} sin créditos o inválida`
                    continue
                }

                // Otro error (imagen mala, etc.) -> leer el mensaje y no seguir rotando
                const txt = Buffer.from(respuesta.data).toString('utf8')
                ultimoError = txt.slice(0, 120)
                break
            } catch (err) {
                ultimoError = err.message
                continue
            }
        }

        if (!resultado) {
            await m.react('❌')
            return conn.reply(
                m.chat,
                `⚠️ No se pudo quitar el fondo.\n${ultimoError ? '\n📄 Detalle: ' + ultimoError : ''}`,
                m
            )
        }

        // Enviar como documento PNG para conservar la transparencia
        await conn.sendMessage(
            m.chat,
            {
                document: resultado,
                mimetype: 'image/png',
                fileName: 'sin-fondo.png',
                caption: '✅ *Fondo eliminado*\n\n💡 Se envía como archivo para conservar la transparencia.'
            },
            { quoted: m }
        )

        await m.react('✅')
    } catch (e) {
        console.error('Error en removebg:', e)
        await m.react('❌')
        conn.reply(m.chat, '🌸 *Error interno.* No pude procesar la imagen.', m)
    }
}

handler.help = ['removebg (responder a imagen)']
handler.tags = ['tools']
handler.command = ['removebg', 'quitarfondo', 'nobg', 'rmbg']
handler.group = false
handler.register = false

export default handler
