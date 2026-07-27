/* ERIS-MD TEXT-TO-SPEECH (TTS) - ELEGANT VERSION */

import gtts from 'node-gtts'
import { readFileSync, unlinkSync } from 'fs'
import { join } from 'path'
import os from 'os'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'

const defaultLang = 'es'

const handler = async (m, { conn, args, usedPrefix, command }) => {
    let lang = args[0]
    let text = args.slice(1).join(' ')
    
    // Detecta si el primer argumento es un idioma de 2 letras (ej. 'es', 'en', 'pt')
    if ((args[0] || '').length !== 2) {
        lang = defaultLang
        text = args.join(' ')
    }
    
    // Si no hay texto directo, revisa si respondiste a un mensaje con texto
    if (!text && m.quoted?.text) text = m.quoted.text
    
    if (!text) {
        return conn.reply(m.chat, `🌸 *¿Qué deseas que diga?*\n\n*Ejemplo:* ${usedPrefix + command} Hola, soy Eris\n*Con idioma:* ${usedPrefix + command} en Hello world`, m)
    }

    try {
        await m.react('🕓')
        
        let res = await tts(text, lang)
        
        // Enviamos el audio como Nota de Voz (ptt: true) con la identidad de Eris
        await conn.sendMessage(m.chat, { 
            audio: res, 
            mimetype: 'audio/mp4', // Formato seguro para notas de voz en WhatsApp
            ptt: true,             // Aparecerá como micrófono grabado
            contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid,
                    newsletterName,
                    serverMessageId: -1
                }
            }
        }, { quoted: m })

        await m.react('✅')
        
    } catch (e) {
        console.error('Error TTS:', e)
        await m.react('❌')
        conn.reply(m.chat, `🌸 *Error al generar el audio.* El idioma podría ser inválido o el texto es demasiado largo.`, m)
    }
}

handler.help = ['tts <texto>']
handler.tags = ['convertidores'] // Categoría asignada
handler.command = ['tts']
handler.group = false // Ahora lo puedes usar en privado
handler.register = false

export default handler

// --- FUNCIÓN DE GENERACIÓN (BLINDADA) ---
function tts(text, lang = 'es') {
    return new Promise((resolve, reject) => {
        try {
            const ttsInstance = gtts(lang)
            // Usamos la carpeta temporal nativa del VPS (Ubuntu) para evitar errores de rutas
            const filePath = join(os.tmpdir(), `eris_tts_${Date.now()}.wav`)
            
            ttsInstance.save(filePath, text, () => {
                resolve(readFileSync(filePath))
                unlinkSync(filePath) // Se borra automáticamente después de enviarlo (Cero spam de archivos)
            })
        } catch (e) {
            reject(e)
        }
    })
}
