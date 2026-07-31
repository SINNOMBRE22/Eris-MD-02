/* 🌸 ERIS-MD · VOZ NEURONAL (Edge TTS) 🌸 */

import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const TMP_DIR = path.join(process.cwd(), 'tmp')

const MAX_TEXTO = 1000   // caracteres
const TIMEOUT_MS = 60000 // 1 minuto máximo generando

// Voces disponibles: alias corto -> voz real de Edge TTS
const VOCES = {
    jorge:   { id: 'es-MX-JorgeNeural',    desc: '🇲🇽 México · masculina' },
    dalia:   { id: 'es-MX-DaliaNeural',    desc: '🇲🇽 México · femenina' },
    gonzalo: { id: 'es-CO-GonzaloNeural',  desc: '🇨🇴 Colombia · masculina' },
    salome:  { id: 'es-CO-SalomeNeural',   desc: '🇨🇴 Colombia · femenina' },
    tomas:   { id: 'es-AR-TomasNeural',    desc: '🇦🇷 Argentina · masculina' },
    elena:   { id: 'es-AR-ElenaNeural',    desc: '🇦🇷 Argentina · femenina' },
    alvaro:  { id: 'es-ES-AlvaroNeural',   desc: '🇪🇸 España · masculina' },
    elvira:  { id: 'es-ES-ElviraNeural',   desc: '🇪🇸 España · femenina' },
    alonso:  { id: 'es-US-AlonsoNeural',   desc: '🇺🇸 EE.UU. · masculina' },
    paloma:  { id: 'es-US-PalomaNeural',   desc: '🇺🇸 EE.UU. · femenina' },
    // Inglés, por si acaso
    aria:    { id: 'en-US-AriaNeural',     desc: '🇬🇧 Inglés · femenina' },
    guy:     { id: 'en-US-GuyNeural',      desc: '🇬🇧 Inglés · masculina' }
}

const VOZ_DEFECTO = 'jorge'

// Reacción a prueba de fallos
async function reaccion(m, emoji) {
    try { await m.react(emoji) } catch {}
}

// ¿Está edge-tts instalado?
async function tieneEdgeTts() {
    try {
        await execAsync('command -v edge-tts', { timeout: 5000 })
        return true
    } catch {
        return false
    }
}

function listaVoces(usedPrefix, command) {
    let salida = '╭─❍「 🎙️ VOCES 」\n'
    for (const [alias, v] of Object.entries(VOCES)) {
        salida += `┊ ✧ ${alias} — ${v.desc}\n`
    }
    salida += '╰─────────────❍\n\n'
    salida += `💡 *Uso:* ${usedPrefix + command} dalia Hola a todos`
    return salida
}

const handler = async (m, { conn, text, usedPrefix, command }) => {

    // Texto directo o del mensaje citado
    let entrada = (text || '').trim()
    if (!entrada && m.quoted?.text) entrada = m.quoted.text.trim()

    if (!entrada) {
        return conn.reply(
            m.chat,
            `🌸 *¿Qué quieres que diga?*\n\n📌 *Ejemplos:*\n${usedPrefix + command} Hola, soy Eris\n${usedPrefix + command} dalia Hola a todos\n\n${listaVoces(usedPrefix, command)}`,
            m
        )
    }

    // Si la primera palabra es un alias de voz, la usamos
    let voz = VOCES[VOZ_DEFECTO].id
    const partes = entrada.split(/\s+/)
    const posibleAlias = partes[0].toLowerCase()

    if (VOCES[posibleAlias] && partes.length > 1) {
        voz = VOCES[posibleAlias].id
        entrada = partes.slice(1).join(' ')
    }

    // Ver la lista de voces
    if (/^(voces|lista|list)$/i.test(entrada)) {
        return conn.reply(m.chat, listaVoces(usedPrefix, command), m)
    }

    if (entrada.length > MAX_TEXTO) {
        entrada = entrada.slice(0, MAX_TEXTO)
    }

    // Verificar que edge-tts esté disponible
    if (!(await tieneEdgeTts())) {
        return conn.reply(
            m.chat,
            `⚠️ *Edge TTS no está instalado en el servidor.*\n\nEl owner debe ejecutar:\n\`\`\`apt install -y python3-pip\npip3 install edge-tts\`\`\``,
            m
        )
    }

    await reaccion(m, '🕓')

    const id = Date.now()
    const txtPath = path.join(TMP_DIR, `voz_${id}.txt`)
    const mp3Path = path.join(TMP_DIR, `voz_${id}.mp3`)

    try {
        if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

        // Escribimos el texto a un archivo en vez de pasarlo por la terminal:
        // evita problemas con comillas, acentos y caracteres raros.
        fs.writeFileSync(txtPath, entrada, 'utf8')

        // 1. Edge TTS genera el MP3
        await execAsync(
            `edge-tts --voice "${voz}" --file "${txtPath}" --write-media "${mp3Path}"`,
            { timeout: TIMEOUT_MS }
        )

        if (!fs.existsSync(mp3Path) || fs.statSync(mp3Path).size === 0) {
            throw new Error('Edge TTS no generó audio')
        }

        // 2. Enviar el MP3 como archivo de audio descargable (no nota de voz)
        const mp3 = fs.readFileSync(mp3Path)

        // Nombre del archivo con las primeras palabras del texto
        const titulo = entrada
            .slice(0, 40)
            .replace(/[\/\\?%*:|"<>]/g, '')
            .trim() || 'audio'

        await conn.sendMessage(m.chat, {
            audio: mp3,
            mimetype: 'audio/mpeg',
            fileName: `${titulo}.mp3`,
            ptt: false                  // <- archivo guardable, no nota de voz
        }, { quoted: m })

        await reaccion(m, '✅')

    } catch (e) {
        console.error('Error en voz:', e)
        await reaccion(m, '❌')
        conn.reply(
            m.chat,
            `🌸 *No pude generar la voz.*\n\n📄 *Motivo:* ${e.message || 'error desconocido'}`,
            m
        )
    } finally {
        // Limpieza de temporales
        for (const p of [txtPath, mp3Path]) {
            try { fs.existsSync(p) && fs.unlinkSync(p) } catch {}
        }
    }
}

handler.help = ['voz <texto>', 'voz <alias> <texto>']
handler.tags = ['convertidores']
handler.command = ['voz', 'narrar', 'decir']
handler.group = false
handler.register = false

export default handler
