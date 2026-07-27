/* 🦈 ERIS-MD CLOUD UPLOADER (ADOFILES) 🦈 */

import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command }) => {
  let q = m.quoted ? m.quoted : m
  let mime = (q.msg || q).mimetype || q.mediaType || ''

  // 1. Validar que haya un archivo
  if (!mime) return conn.reply(m.chat, `🌸 Responde a un archivo con *${usedPrefix}${command}* para subirlo a la nube.`, m)

  // 2. Mapeo de extensiones inteligente
  const extensionMap = {
    'image/gif': 'gif',
    'video/mp4': 'mp4',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'audio/ogg': 'ogg',
    'audio/mpeg': 'mp3'
  }
  
  let extension = extensionMap[mime] || 'bin'
  
  await conn.reply(m.chat, `⏳ Procesando y subiendo archivo *.${extension}* a ADOFiles...`, m)

  try {
    // 3. Descarga de media segura
    let media = await q.download()
    if (!media) throw new Error('No se pudo descargar el archivo del chat.')

    let base64 = media.toString('base64')
    let nombreArchivo = `Eris_${Date.now()}.${extension}`

    // 4. Petición al servidor de Hosting
    let response = await fetch('https://adofiles.i11.eu/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: base64,
        filename: nombreArchivo
      })
    })

    if (!response.ok) throw new Error('El servidor de hosting no respondió correctamente.')

    let data = await response.json()
    let publicUrl = data.files[0].publicUrl

    // 5. Respuesta final con estilo
    let caption = `
₊‧꒰ 🦈 ꒱ 𝐄𝐑𝐈𝐒 𝐂𝐋𝐎𝐔𝐃 𝐔𝐏𝐋𝐎𝐀𝐃 ✧˖°

> 📄 *Nombre:* ${nombreArchivo}
> 📦 *Mime:* ${mime}
> 🔗 *URL:* ${publicUrl}

*— Aquí tienes tu enlace, jefe. Úsalo con sabiduría.*`.trim()

    conn.reply(m.chat, caption, m)

  } catch (e) {
    console.error(e)
    conn.reply(m.chat, `🌸 Tsk. Error al subir: ${e.message}`, m)
  }
}

handler.help = ['ado']
handler.tags = ['owner']
handler.command = ['ado', 'upload']
handler.rowner = true

export default handler
