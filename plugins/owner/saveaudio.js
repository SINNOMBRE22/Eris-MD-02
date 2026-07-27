/* 🦈 GUARDAR AUDIO - ERIS-MD SYSTEM (RUTA CORTA) 🦈 */

import fs from 'fs'
import path from 'path'

let handler = async (m, { text }) => {
  console.log("➡️ saveaudio ejecutado")

  if (!text) return m.reply('❌ Debes Especificar Un Nombre Para Guardar El Audio.')
  if (!m.quoted) return m.reply('❌ Debes Citar Un Audio Para Guardarlo.')

  try {
    // 📂 Carpeta Ajustada A Tu Estructura
    const folder = 'src/audio'

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

    console.log("⬇️ Intentando Descargar Media Del Citado...")
    let media

    if (m.quoted.download) {
      media = await m.quoted.download()
    }

    if (!media || media.length === 0) {
      console.log("⚠️ Media Vacío O Nulo")
      return m.reply('❌ No Se Pudo Obtener El Audio Del Citado.')
    }

    const mime = m.quoted.mimetype || 'audio/mpeg'
    const ext = mime.split('/')[1] || 'mp3'

    let safeName = text.replace(/[/\\?%*:|"<>]/g, '-')
    if (!safeName.includes('.')) safeName = `${safeName}.${ext}`

    let fullPath = `${folder}/${safeName}`

    // Evitar Sobrescribir
    let count = 1
    const basePath = fullPath.replace(/\.[^/.]+$/, '')
    const fileExt = fullPath.split('.').pop()

    while (fs.existsSync(fullPath)) {
      fullPath = `${basePath}_${count}.${fileExt}`
      count++
    }

    fs.writeFileSync(fullPath, media)

    console.log(`✅ Audio Guardado En ${fullPath}`)
    m.reply(`━━━━━━✦❘༻༺❘✦━━━━━━\n✅ **Éxito:** Audio Guardado En:\n*${fullPath}*\n━━━━━━✦❘༻༺❘✦━━━━━━`)

  } catch (err) {
    console.error("❌ Error En Saveaudio:", err)
    m.reply('❌ Ocurrió Un Error Al Guardar El Audio.')
  }
}

handler.help = ['saveaudio <nombre>']
handler.tags = ['owner']
handler.command = /^(saveaudio|sa)$/i
handler.owner = true

export default handler
