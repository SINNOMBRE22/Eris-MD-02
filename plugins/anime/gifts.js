/* ERIS-MD ANIME INTERACTIVE - v7 */

import fetch from 'node-fetch'
import fs    from 'fs'
import path  from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const TMP_DIR = path.join(process.cwd(), 'tmp')

// ── Convertir webp animado → mp4 (optimizado para gifPlayback en WhatsApp) ───
async function webpToMp4(buffer) {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })
    const id = Date.now()
    const inPath  = path.join(TMP_DIR, `anime_${id}.webp`)
    const outPath = path.join(TMP_DIR, `anime_${id}.mp4`)
    fs.writeFileSync(inPath, buffer)
    try {
        await execAsync(
            `ffmpeg -y -i "${inPath}" ` +
            `-an ` +
            `-c:v libx264 -preset ultrafast -crf 28 ` +
            `-pix_fmt yuv420p ` +
            `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ` +
            `-movflags +faststart ` +
            `"${outPath}"`,
            { timeout: 30_000 }
        )
        const mp4 = fs.readFileSync(outPath)
        return mp4
    } finally {
        if (fs.existsSync(inPath))  fs.unlinkSync(inPath)
        if (fs.existsSync(outPath)) fs.unlinkSync(outPath)
    }
}

// ── nekos.best endpoints ──────────────────────────────────────────────────────
const STATIC_TYPES = new Set(['waifu', 'neko', 'kitsune', 'husbando'])

async function getAnimeMedia(action) {
    const res = await fetch(`https://nekos.best/api/v2/${action}`, {
        timeout: 15_000,
        headers: { 'User-Agent': 'Eris-MD/1.0' }
    })
    if (!res.ok) throw new Error(`nekos.best HTTP ${res.status}`)
    const json = await res.json()
    const url = json?.results?.[0]?.url
    if (!url) throw new Error('Sin URL en respuesta')
    const isStatic = STATIC_TYPES.has(action)
    return { url, isStatic }
}

// ── Handler principal ─────────────────────────────────────────────────────────
let handler = async (m, { conn, command }) => {
    let who = m.mentionedJid?.[0] ?? (m.quoted ? m.quoted.sender : m.sender)
    let nameFrom = `@${m.sender.split('@')[0]}`
    let nameWho  = who === m.sender ? 'alguien' : `@${who.split('@')[0]}`

    const interactions = {
        'waifu':     { action: 'waifu',     str: `🌸 Waifu para ${nameFrom}` },
        'waifuh':    { action: 'waifu',     str: `🔥 Waifu H para ${nameFrom}` },
        'neko':      { action: 'neko',      str: `🐾 Neko para ${nameFrom}` },
        'shinobu':   { action: 'neko',      str: `🦋 Shinobu para ${nameFrom}` },
        'megumin':   { action: 'neko',      str: `💥 Megumin para ${nameFrom}` },
        'bully':     { action: 'baka',      str: `😈 ${nameFrom} le hace bullying a ${nameWho}` },
        'cuddle':    { action: 'cuddle',    str: `🥰 ${nameFrom} se acurruca con ${nameWho}` },
        'cry':       { action: 'cry',       str: `😢 ${nameFrom} está llorando por culpa de ${nameWho}` },
        'hug':       { action: 'hug',       str: `🤗 ${nameFrom} le dio un abrazo a ${nameWho}` },
        'awoo':      { action: 'waifu',     str: `🐺 ${nameFrom} dice: ¡Awoooo!` },
        'kiss':      { action: 'kiss',      str: `💋 ${nameFrom} besó a ${nameWho}` },
        'lick':      { action: 'nom',       str: `👅 ${nameFrom} lamió a ${nameWho}` },
        'pat':       { action: 'pat',       str: `👋 ${nameFrom} acaricia a ${nameWho}` },
        'smug':      { action: 'smug',      str: `😏 ${nameFrom} se puso presumido/a` },
        'bonk':      { action: 'punch',     str: `🔨 ${nameFrom} le dio un bonk a ${nameWho}` },
        'yeet':      { action: 'yeet',      str: `🚀 ${nameFrom} mandó a volar a ${nameWho}` },
        'blush':     { action: 'blush',     str: `😳 ${nameFrom} se sonrojó` },
        'smile':     { action: 'smile',     str: `😊 ${nameFrom} le sonrió a ${nameWho}` },
        'wave':      { action: 'wave',      str: `👋 ${nameFrom} saluda a ${nameWho}` },
        'highfive':  { action: 'highfive',  str: `🖐️ ${nameFrom} chocó los cinco con ${nameWho}` },
        'handhold':  { action: 'handshake', str: `🤝 ${nameFrom} tomó la mano de ${nameWho}` },
        'nom':       { action: 'nom',       str: `🍱 ${nameFrom} está comiendo...` },
        'bite':      { action: 'bite',      str: `🦷 ${nameFrom} mordió a ${nameWho}` },
        'glomp':     { action: 'hug',       str: `💨 ${nameFrom} se lanzó sobre ${nameWho}` },
        'slap':      { action: 'slap',      str: `🖐️ ${nameFrom} le dio una bofetada a ${nameWho}` },
        'kill':      { action: 'shoot',     str: `💀 ${nameFrom} mató a ${nameWho}` },
        'kick':      { action: 'kick',      str: `🦵 ${nameFrom} le metió una patada a ${nameWho}` },
        'happy':     { action: 'happy',     str: `✨ ${nameFrom} está muy feliz` },
        'wink':      { action: 'wink',      str: `😉 ${nameFrom} le guiñó el ojo a ${nameWho}` },
        'poke':      { action: 'poke',      str: `👉 ${nameFrom} picó a ${nameWho}` },
        'dance':     { action: 'dance',     str: `💃 ${nameFrom} baila con ${nameWho}` },
        'cringe':    { action: 'facepalm',  str: `😬 ${nameFrom} siente cringe...` }
    }

    const aliases = {
        'abrazar': 'hug', 'beso': 'kiss', 'muak': 'kiss', 'lamer': 'lick',
        'palmada': 'bonk', 'palmadita': 'pat', 'picar': 'poke', 'bailar': 'dance',
        'feliz': 'happy', 'matar': 'kill', 'patear': 'kick', 'patada': 'kick',
        'bofetada': 'slap', 'comer': 'nom', 'morder': 'bite', 'mano': 'handhold',
        '5': 'highfive', 'ola': 'wave', 'saludar': 'wave', 'sonreir': 'smile',
        'sonrojarse': 'blush', 'presumir': 'smug', 'acurrucarse': 'cuddle',
        'llorar': 'cry', 'bullying': 'bully'
    }

    const cmd = aliases[command] || command
    const interaction = interactions[cmd]
    if (!interaction) return

    try {
        await m.react('🕓')

        const { url: mediaUrl, isStatic } = await getAnimeMedia(interaction.action)

        const resMedia = await fetch(mediaUrl, { timeout: 15_000, headers: { 'User-Agent': 'Eris-MD/1.0' } })
        if (!resMedia.ok) throw new Error(`Descarga fallida: HTTP ${resMedia.status}`)
        const rawBuffer = Buffer.from(await resMedia.arrayBuffer())

        let menciones = [m.sender]
        if (who !== m.sender) menciones.push(who)

        if (isStatic) {
            // ── Imagen fija con caption ──────────────────────────────────────
            await conn.sendMessage(m.chat, {
                image: rawBuffer,
                caption: interaction.str,
                mentions: menciones
            }, { quoted: m })

        } else {
            // ── GIF animado con caption ──────────────────────────────────────
            const mp4Buffer = await webpToMp4(rawBuffer)
            await conn.sendMessage(m.chat, {
                video: mp4Buffer,
                caption: interaction.str,
                gifPlayback: true,
                gifAttribution: 0,
                mimetype: 'video/mp4',
                mentions: menciones
            }, { quoted: m })
        }

        await m.react('✅')

    } catch (e) {
        console.error('Error Anime Interaction:', e)
        await m.react('❌')
        conn.reply(m.chat, '🌸 *Error al cargar la interacción, intenta de nuevo.*', m)
    }
}

handler.help = [
    'waifu', 'waifuh', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug',
    'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave',
    'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy',
    'wink', 'poke', 'dance', 'cringe', 'abrazar', 'beso', 'muak', 'lamer', 'palmada',
    'palmadita', 'picar', 'bailar', 'feliz', 'matar', 'patear', 'patada', 'bofetada',
    'comer', 'morder', 'mano', '5', 'ola', 'saludar', 'sonreir', 'sonrojarse',
    'presumir', 'acurrucarse', 'llorar', 'bullying'
]
handler.tags = ['anime']
handler.command = /^(waifu|waifuh|neko|shinobu|megumin|bully|cuddle|cry|hug|awoo|kiss|lick|pat|smug|bonk|yeet|blush|smile|wave|highfive|handhold|nom|bite|glomp|slap|kill|kick|happy|wink|poke|dance|cringe|abrazar|beso|muak|lamer|palmada|palmadita|picar|bailar|feliz|matar|patear|patada|bofetada|comer|morder|mano|5|ola|saludar|sonreir|sonrojarse|presumir|acurrucarse|llorar|bullying)$/i
handler.group = true

export default handler
