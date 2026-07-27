/* 🌸 SISTEMA DE SORTEOS - ERIS-MD EDITION 🌸 */

import util from 'util'
import path from 'path'
import { readFileSync } from 'fs'

async function handler(m, { groupMetadata, command, conn, text, usedPrefix }) {
    
    // 1. VALIDACIÓN DE TEXTO
    if (!text) return conn.reply(m.chat, `> ꒰🌸꒱ Por favor, ingresa el premio o motivo del sorteo.\n\n*Ejemplo:* ${usedPrefix + command} Un admin gratis`, m)

    // 2. SELECCIÓN ALEATORIA
    let participants = groupMetadata.participants.map(v => v.id)
    if (participants.length === 0) return // Seguridad si el grupo está vacío
    let winner = participants[Math.floor(Math.random() * participants.length)]
    
    // Nueva fuente de audio (Efecto de victoria)
    let vn = `https://qu.ax/YvOA.mp3` 

    // 3. CARGAR MINIATURA DEL MENÚ (perfil2.jpeg)
    let thumb = Buffer.alloc(0)
    try {
        // Usamos la misma ruta que en tu menú
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = readFileSync(imgPath)
    } catch (e) {
        console.log('Imagen del menú no encontrada para el sorteo.')
    }

    // 4. CONSTRUCCIÓN DEL MENSAJE ESTILO ERIS
    let top = `> ꒰🥳꒱ *ＦＥＬＩＣＩＤＡＤＥＳ* 🥳\n\n@${winner.split('@')[0]} ✨\n\n¡Acabas de ganar el sorteo por: *${text}*! 🎉`.trim()
    
    // 5. EFECTO DE ESCRITURA REALISTA
    let txt = ''
    let count = 0
    for (const char of top) {
        await new Promise(resolve => setTimeout(resolve, 8)) 
        txt += char
        count++

        if (count % 15 === 0) {
            conn.sendPresenceUpdate('composing', m.chat)
        }
    }

    // 6. ENVÍO DE RESULTADOS (AUDIO + MENSAJE)
    // Primero el audio de victoria
    try {
        await conn.sendMessage(m.chat, { 
            audio: { url: vn }, 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: m })
    } catch (e) {
        console.log("Error al enviar audio de sorteo.")
    }

    // Enviamos el texto con la mención azul y LA MINIATURA DEL MENÚ
    await conn.sendMessage(m.chat, { 
        text: txt, 
        mentions: [winner],
        contextInfo: {
            mentionedJid: [winner], // Blindado
            externalAdReply: {
                title: '✨ GANADOR DEL SORTEO ✨',
                body: `Evento: ${text}`,
                thumbnail: thumb, // AQUÍ ESTÁ: Usamos el buffer de la imagen local
                mediaType: 1,
                showAdAttribution: true
            }
        }
    }, { quoted: m })

}

handler.help = ['sorteo']
handler.command = ['sorteo']
handler.tags = ['grupos']
handler.group = true

export default handler
