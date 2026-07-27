/* 🌸 INFORMACIÓN DEL BOT - ERIS-MD (ESTILO LIMPIO) 🌸 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { totalmem, freemem, platform, hostname } from 'os'
import { sizeFormatter } from 'human-readable'

let format = sizeFormatter({
    std: 'JEDEC',
    decimalPlaces: 2,
    keepTrailingZeroes: false,
    render: (literal, symbol) => `${literal} ${symbol}B`,
})

let handler = async (m, { conn, usedPrefix }) => {
    // 🌸 MINIATURA: RUTA DE TU PERFIL
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = existsSync(imgPath) ? readFileSync(imgPath) : Buffer.alloc(0)
    } catch {
        thumb = Buffer.alloc(0)
    }

    // ✧ Cálculos de Sistema ✧
    let totalStats = Object.values(global.db.data.stats || {}).reduce((total, stat) => total + (stat.total || 0), 0)
    let totalPlugins = Object.values(global.plugins).filter((v) => v.help && v.tags).length
    const usedRepo = process.memoryUsage()

    // ✦ ESTRUCTURA CON EL ALMA DE ERIS-MD ✦
    let info = `
✦ *INFORMACIÓN DEL SISTEMA*

✧ Configuración:
• Prefijo: [ ${usedPrefix} ]
• Plugins: ${totalPlugins}
• Comandos: ${toNum(totalStats)}

✧ Host Info:
• Plataforma: ${platform()}
• Servidor: ${hostname()}
• RAM: ${format(totalmem() - freemem())} / ${format(totalmem())}
• Libre: ${format(freemem())}

✧ NodeJS Memory:
• Heap Used: ${format(usedRepo.heapUsed)}
• RSS: ${format(usedRepo.rss)}

⚠️ Reporte de estado generado por Eris-MD.`.trim()

    // 🚀 ENVIAR CON IDENTIDAD ERIS
    await conn.sendMessage(m.chat, {
        text: info,
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial',
            },
            externalAdReply: {
                title: '🌸 ERIS-MD: SYSTEM INFO 🌸',
                body: `Versión: ${global.vs || '1.0.0'}`,
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: false, // 🛡️ Evita el cuadro gris
                showAdAttribution: true
            }
        }
    }, { quoted: m })

    m.react('🌸')
}

handler.help = ['botinfo']
handler.tags = ['info']
handler.command = ['info', 'botinfo', 'infobot']

export default handler

function toNum(number) {
    if (number >= 1000 && number < 1000000) {
        return (number / 1000).toFixed(1) + 'k'
    } else if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M'
    } else {
        return number.toString()
    }
}
