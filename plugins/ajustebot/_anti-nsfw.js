/* 🦈 ANTI-NSFW - ERIS-MD SYSTEM 🦈 */
import Jimp from 'jimp'
import { downloadMediaMessage } from '@whiskeysockets/baileys'

const SKIN_THRESHOLD = 0.22
const CLUSTER_THRESHOLD = 0.20

function isSkinPixel(r, g, b) {
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    // Excluir píxeles muy saturados (anime/dibujos)
    const saturation = max === 0 ? 0 : delta / max
    if (saturation > 0.55) return false

    // Excluir blanco puro y negro puro
    if (max > 245 && delta < 8) return false
    if (max < 20) return false

    // ── Piel clara ───────────────────────────────────────────────────────────
    const esPielClara = (
        r > 180 && g > 120 && b > 80 &&
        r > g && r > b &&
        delta > 10 &&
        Math.abs(r - g) > 8
    )

    // ── Piel media / morena ───────────────────────────────────────────────────
    const esPielMedia = (
        r > 120 && r <= 200 &&
        g > 70 && g <= 160 &&
        b > 40 && b <= 120 &&
        r > g && g > b &&
        delta > 12
    )

    // ── Piel oscura / negra ───────────────────────────────────────────────────
    const esPielOscura = (
        r > 60 && r <= 140 &&
        g > 30 && g <= 100 &&
        b > 15 && b <= 80 &&
        r > g && g > b &&
        delta > 8 &&
        r - b > 15
    )

    return esPielClara || esPielMedia || esPielOscura
}

async function checkNSFW(buffer) {
    const image = await Jimp.read(buffer)
    image.resize(100, 100)
    const { data, width, height } = image.bitmap

    let skinPixels = 0
    let totalPixels = 0
    const quadrants = [0, 0, 0, 0]
    const quadrantTotal = [0, 0, 0, 0]

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4
            const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3]
            if (a < 128) continue

            const qx = x < width / 2 ? 0 : 1
            const qy = y < height / 2 ? 0 : 1
            const q = qy * 2 + qx

            totalPixels++
            quadrantTotal[q]++

            if (isSkinPixel(r, g, b)) {
                skinPixels++
                quadrants[q]++
            }
        }
    }

    const ratio = totalPixels > 0 ? skinPixels / totalPixels : 0

    const activeCuadrants = quadrants.filter((s, i) =>
        quadrantTotal[i] > 0 && s / quadrantTotal[i] >= CLUSTER_THRESHOLD
    ).length

    const isNSFW = ratio >= SKIN_THRESHOLD && activeCuadrants >= 1

    return { isNSFW, score: ratio }
}

const handler = async (m, opts) => {}

handler.before = async function(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
    if (!m.isGroup) return true

    const chat = global.db?.data?.chats?.[m.chat]
    if (!chat?.antiNsfw) return true

    if (isAdmin || isOwner || isROwner || m.fromMe) return true

    const msgType = m.mtype || Object.keys(m.message || {})[0] || ''

    const isImage =
        msgType === 'imageMessage' ||
        msgType === 'image' ||
        (msgType === 'viewOnceMessage' &&
         Object.keys(m.message?.viewOnceMessage?.message || {})[0] === 'imageMessage') ||
        (msgType === 'viewOnceMessageV2' &&
         Object.keys(m.message?.viewOnceMessageV2?.message || {})[0] === 'imageMessage')

    if (!isImage) return true

    try {
        const buffer = await downloadMediaMessage(
            m, 'buffer', {},
            { logger: console, reuploadRequest: conn.updateMediaMessage }
        )
        if (!buffer || buffer.length === 0) return true

        const { isNSFW, score } = await checkNSFW(buffer)
        console.log(`[ANTI-NSFW] Score: ${(score * 100).toFixed(0)}% | NSFW: ${isNSFW} | ${m.sender}`)

        if (!isNSFW) return true

        const user = `@${m.sender.split('@')[0]}`

        if (!isBotAdmin) {
            await conn.sendMessage(m.chat, {
                text: `> ⊰🦈⊱ Detecté contenido sospechoso de ${user}.\n\n➥ Qué lástima que no soy administradora para borrarlo y sacarlo a patadas. Háganme admin si quieren que trabaje.`,
                mentions: [m.sender]
            }, { quoted: m })
            return true
        }

        await conn.sendMessage(m.chat, {
            delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
        })

        await conn.sendMessage(m.chat, {
            text: `> ⊰🌸⊱ *IMAGEN INAPROPIADA DETECTADA*\n\n${user} envió contenido explícito.\n➥ Hora de sacar la basura. 🗑️\n\n_Confianza: ${(score * 100).toFixed(0)}%_`,
            mentions: [m.sender]
        })

        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')

    } catch (e) {
        console.error('❌ Error en Anti-NSFW:', e.message)
    }

    return true
}

export default handler
