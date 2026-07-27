import fs from 'fs'
import path from 'path'
const { promises: fsp } = fs

async function readThumbnail() {
  try { return fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')) } catch { return Buffer.alloc(0) }
}

function formatUptime(seconds){
  const h = Math.floor(seconds / 3600)
  const m = Math.floor(seconds % 3600 / 60)
  const s = Math.floor(seconds % 60)
  return `${h}h ${m}m ${s}s`
}

// El handler.js te pasa automáticamente "isOwner", así que lo usamos directamente
const handler = async (m, { conn, isOwner }) => {
  try {
    // Verificación de seguridad usando la variable nativa del handler
    if (!isOwner) {
      return conn.reply(m.chat, `${global?.emoji || '❌'} Acceso denegado — este comando es sólo para *Owner*.`, m)
    }

    if (global?.conn?.user?.jid && conn?.user?.jid && global.conn.user.jid !== conn.user.jid) {
      return conn.reply(m.chat, `${global?.emoji || '⚠️'} Ejecuta este comando directamente en el número principal del bot.`, m)
    }

    try { m.react && m.react(global?.rwait || '⏳') } catch {}

    // Ajustado para que lea la carpeta que configuramos en index.js
    const sessionsFolder = global.ErisSessions || 'session'
    const sessionPath = path.join(process.cwd(), sessionsFolder)

    const muptime = formatUptime(process.uptime())
    const ram = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)
    const header = [
      `╭─── [ 🦈 ERIS - SESSIONS CLEANER ] ───`,
      `│ 🕒 Uptime: ${muptime}`,
      `│ 🧠 RAM: ${ram} MB`,
      `│ 📁 Carpeta: ${sessionsFolder}`,
      `╰───────────────────────────────────`
    ].join('\n')

    if (!fs.existsSync(sessionPath)) {
      const thumb = await readThumbnail()
      await conn.sendMessage(m.chat, {
        text: `${header}\n\n✅ Resultado: La carpeta de sesiones "${sessionsFolder}" no existe o está vacía.`,
        contextInfo: { externalAdReply: { title: 'Eris - Sessions Cleaner', body: 'No se encontraron sesiones para eliminar', thumbnail: thumb, mediaType: 1, renderLargerThumbnail: true } }
      }, { quoted: m })
      try { m.react && m.react(global?.done || '✅') } catch {}
      return
    }

    const entries = await fsp.readdir(sessionPath)
    let deleted = 0
    for (const file of entries) {
      if (file === 'creds.json') continue
      const full = path.join(sessionPath, file)
      try {
        const stat = await fsp.stat(full)
        if (stat.isFile()) { await fsp.unlink(full); deleted++ }
        else if (stat.isDirectory()) { try { await fsp.rm(full, { recursive: true, force: true }); deleted++ } catch (e) { console.error('Error eliminando carpeta de sesión:', full, e) } }
      } catch (e) { console.error('Error accediendo a archivo de sesión:', full, e) }
    }

    const thumb = await readThumbnail()
    const resultText = `${header}\n\n✅ Resultado: Se eliminaron *${deleted}* archivo(s)/carpeta(s) de sesión en "${sessionsFolder}".\n⚠️ Se preservó: creds.json (si existe)`

    await conn.sendMessage(m.chat, {
      text: resultText,
      contextInfo: { externalAdReply: { title: 'Eris - Sessions Cleaner', body: `Archivos eliminados: ${deleted}`, thumbnail: thumb, mediaType: 1, renderLargerThumbnail: true } }
    }, { quoted: m })

    try { m.react && m.react(global?.done || '✅') } catch {}

  } catch (err) {
    console.error('dsowner handler error:', err)
    try { await conn.sendMessage(m.chat, { text: `${global?.msm || '❌'} Error al limpiar sesiones: ${String(err.message || err)}` }, { quoted: m }) } catch {}
  }
}

handler.help = ['dsowner']
handler.tags = ['owner']
handler.command = ['delai', 'dsowner', 'clearallsession']
handler.owner = true // Esto le dice al handler.js que bloquee automáticamente a los que no son dueños

export default handler
