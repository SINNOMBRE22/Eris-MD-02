/* 🌸 SISTEMA DE ESTADO - ERIS-MD (FIX CRASH) 🌸 */

import { readFileSync, existsSync } from 'fs'
import path from 'path'
import ws from 'ws'
import { performance } from 'perf_hooks'

let handler = async (m, { conn, usedPrefix }) => {
    // 🌸 MINIATURA
    let thumb
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = existsSync(imgPath) ? readFileSync(imgPath) : Buffer.alloc(0)
    } catch {
        thumb = Buffer.alloc(0)
    }

    // ✧ Cálculos de Sistema
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    
    const chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
    const groupsIn = chats.filter(([id]) => id.endsWith('@g.us'))
    
    // 🛡️ FIX: PROTECCIÓN PARA SUB-BOTS (global.conns)
    let subBots = []
    if (global.conns && Array.isArray(global.conns)) {
        subBots = [...new Set([...global.conns.filter((conn) => conn.user && conn.ws.socket && conn.ws.socket.readyState !== ws.CLOSED).map((conn) => conn)])]
    }
    
    let old = performance.now()
    let neww = performance.now()
    let speed = (neww - old).toFixed(4)

    let info = `
✦ *ESTADO DEL SISTEMA*

✧ Desarrollador:
➤ SinNombre 👑

✧ Proyecto:
➤ Eris-MD

✧ Estadísticas:
• Prefijo: [ ${usedPrefix} ]
• Usuarios: ${totalreg}
• Grupos: ${groupsIn.length}
• Chats Privados: ${chats.length - groupsIn.length}

✧ Rendimiento:
• Actividad: ${uptime}
• Velocidad: ${speed} ms
• Sub-Bots: ${subBots.length}`.trim()

    await conn.sendMessage(m.chat, { 
        text: info, 
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial',
            },
            externalAdReply: {
                title: '🌸 ERIS-MD: STATUS REPORT 🌸',
                body: `Estatus: Online`,
                thumbnail: thumb,
                mediaType: 1,
                renderLargerThumbnail: true
            }
        }
    }, { quoted: m })
}

handler.help = ['estado']
handler.tags = ['info']
handler.command = ['estado', 'status', 'stats', 'stado']

export default handler

function clockString(ms) {
    let seconds = Math.floor((ms / 1000) % 60)
    let minutes = Math.floor((ms / (1000 * 60)) % 60)
    let hours = Math.floor((ms / (1000 * 60 * 60)) % 24)
    let days = Math.floor(ms / (1000 * 60 * 60 * 24))
    return (days > 0 ? days + 'd ' : '') + (hours > 0 ? hours + 'h ' : '') + (minutes > 0 ? minutes + 'm ' : '') + seconds + 's'
}
