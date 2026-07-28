/* ERIS-MD TEXT-TO-SPEECH (TTS) - ELEGANT VERSION */

import gtts from 'node-gtts'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import os from 'os'
import { toPTT } from '../../lib/converter.js'

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'

const defaultLang = 'es'
const MAX_TEXTO = 500      // límite de caracteres
const TIMEOUT_MS = 30000   // 30s máximo esperando a Google TTS

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
        return conn.reply(
            m.chat,
            `🌸 *¿Qué deseas que diga?*\n\n*Ejemplo:* ${usedPrefix + command} Hola, soy Eris\n*Con idioma:* ${usedPrefix + command} en Hello world`,
            m
        )
    }

    // Recortar textos muy largos (evita que tarde una eternidad o falle)
    if (text.length > MAX_TEXTO) {
        text = text.slice(0, MAX_TEXTO)
    }

    let ogg
    try {
        await m.react('🕓')

        // 1. Google TTS genera MP3
        const mp3 = await tts(text, lang)

        // 2. MP3 -> OGG/Opus (formato real de nota de voz de WhatsApp)
        ogg = await toPTT(mp3, 'mp3')
        if (!ogg?.data) throw new Error('Fallo al convertir a nota de voz')

        // 3. Enviar como nota de voz
        await conn.sendMessage(m.chat, {
            audio: ogg.data,
            mimetype: 'audio/ogg; codecs=opus', // formato correcto para ptt
            ptt: true,
            contextInfo: {
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
        conn.reply(
            m.chat,
            `🌸 *Error al generar el audio.* El idioma podría ser inválido o el servicio no respondió.`,
            m
        )
    } finally {
        // Limpiar el .ogg temporal
        if (ogg && typeof ogg.delete === 'function') {
            ogg.delete().catch(() => {})
        }
    }
}

handler.help = ['tts <texto>']
handler.tags = ['convertidores']
handler.command = ['tts']
handler.group = false
handler.register = false

export default handler

// --- FUNCIÓN DE GENERACIÓN (BLINDADA) ---
function tts(text, lang = 'es') {
    return new Promise((resolve, reject) => {
        // node-gtts entrega MP3 (aunque el archivo se llame distinto)
        const filePath = join(os.tmpdir(), `eris_tts_${Date.now()}.mp3`)
        let terminado = false

        // Si Google no responde, no dejamos el comando colgado para siempre
        const timer = setTimeout(() => {
            if (terminado) return
            terminado = true
            try { existsSync(filePath) && unlinkSync(filePath) } catch {}
            reject(new Error('Tiempo de espera agotado en el servicio TTS'))
        }, TIMEOUT_MS)

        try {
            const ttsInstance = gtts(lang)

            ttsInstance.save(filePath, text, (err) => {
                if (terminado) return
                terminado = true
                clearTimeout(timer)

                // node-gtts puede pasar un error en el callback
                if (err) {
                    try { existsSync(filePath) && unlinkSync(filePath) } catch {}
                    return reject(err)
                }

                try {
                    if (!existsSync(filePath)) {
                        return reject(new Error('El servicio TTS no generó el audio'))
                    }
                    const buffer = readFileSync(filePath)
                    unlinkSync(filePath)   // borrar antes de resolver
                    if (!buffer?.length) {
                        return reject(new Error('El audio generado está vacío'))
                    }
                    resolve(buffer)
                } catch (e) {
                    try { existsSync(filePath) && unlinkSync(filePath) } catch {}
                    reject(e)
                }
            })
        } catch (e) {
            if (!terminado) {
                terminado = true
                clearTimeout(timer)
                reject(e)
            }
        }
    })
}
