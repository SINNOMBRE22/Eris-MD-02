import sharp from 'sharp'

const handler = async (m, { conn, text }) => {
  const q = m.quoted ? m.quoted : m
  const mime = (q.msg || q).mimetype || ''

  if (!/image/.test(mime))
    throw '⚠️ Responde a una imagen'

  if (!text)
    throw '⚠️ Ejemplo: .comprimir 1'

  const targetMB = parseFloat(text)

  if (isNaN(targetMB))
    throw '⚠️ Ingresa un número válido'

  await m.reply('⌛ Comprimiendo imagen...')

  const media = await q.download()

  let quality = 90
  let output

  const targetBytes = targetMB * 1024 * 1024

  do {
    output = await sharp(media)
      .jpeg({
        quality,
        mozjpeg: true
      })
      .toBuffer()

    quality -= 5

  } while (
    output.length > targetBytes &&
    quality > 10
  )

  await conn.sendMessage(m.chat, {
    image: output,
    caption:
`✅ Imagen comprimida

📦 Tamaño final:
${(output.length / 1024 / 1024).toFixed(2)} MB

🛠 Calidad usada:
${quality + 5}%`
  }, { quoted: m })
}

handler.command = ['comprimir']

export default handler
