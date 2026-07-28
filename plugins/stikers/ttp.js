/* 🌸 TEXTO A STICKER ANIMADO (COLORES) - ERIS-MD EDITION 🌸 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { sticker } from '../../lib/sticker.js'

const execAsync = promisify(exec)
const TMP_DIR = path.join(process.cwd(), 'tmp')

// Paleta de colores por la que va ciclando el texto
const COLORES = [
    '#FF3B30', // rojo
    '#FF9500', // naranja
    '#FFCC00', // amarillo
    '#34C759', // verde
    '#00C7BE', // cyan
    '#007AFF', // azul
    '#AF52DE', // morado
    '#FF2D55'  // rosa
]

// Escapar caracteres especiales de XML/SVG
function escaparXML(texto) {
    return texto
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

// Partir el texto en líneas (máx ~18 chars por línea)
function dividirLineas(texto, maxLargo = 18) {
    const palabras = texto.split(' ')
    const lineas = []
    let actual = ''
    for (const palabra of palabras) {
        if ((actual + ' ' + palabra).trim().length <= maxLargo) {
            actual = (actual + ' ' + palabra).trim()
        } else {
            if (actual) lineas.push(actual)
            actual = palabra
        }
    }
    if (actual) lineas.push(actual)
    return lineas.slice(0, 6)
}

// Generar un PNG del texto en un color dado
async function frameTexto(lineas, color) {
    const fontSize = lineas.length <= 2 ? 90 : lineas.length <= 4 ? 65 : 48
    const lineHeight = fontSize * 1.2
    const startY = 256 - ((lineas.length - 1) * lineHeight) / 2

    const tspans = lineas
        .map((linea, i) => {
            const y = startY + i * lineHeight
            return `<text x="256" y="${y}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" stroke="black" stroke-width="6" paint-order="stroke" text-anchor="middle" dominant-baseline="middle">${escaparXML(linea)}</text>`
        })
        .join('\n')

    const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">${tspans}</svg>`
    return await sharp(Buffer.from(svg)).png().toBuffer()
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        return conn.reply(
            m.chat,
            `> ꒰🌸꒱ Escribe un texto para convertirlo en sticker animado.\n\n📌 *Ejemplo:*\n${usedPrefix + command} Hola mundo`,
            m
        )
    }

    if (text.length > 100) {
        return conn.reply(m.chat, '> ꒰⚠️꒱ El texto es demasiado largo (máx. 100 caracteres).', m)
    }

    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true })

    const id = Date.now()
    const framePaths = []
    const outMp4 = path.join(TMP_DIR, `ttp_${id}.mp4`)
    let stiker = false

    try {
        await m.react('🕓')

        const lineas = dividirLineas(text)

        // 1. Generar un frame PNG por cada color
        for (let i = 0; i < COLORES.length; i++) {
            const png = await frameTexto(lineas, COLORES[i])
            const fp = path.join(TMP_DIR, `ttp_${id}_${i}.png`)
            fs.writeFileSync(fp, png)
            framePaths.push(fp)
        }

        // 2. Unir los frames en un MP4 (2 fps = cada color se ve medio segundo)
        await execAsync(
            `ffmpeg -y -framerate 2 -i "${path.join(TMP_DIR, `ttp_${id}_%d.png`)}" ` +
            `-c:v libx264 -pix_fmt yuv420p ` +
            `-vf "scale=512:512" ` +
            `-movflags +faststart "${outMp4}"`,
            { timeout: 30_000 }
        )

        // 3. MP4 -> sticker animado usando el motor del bot
        const mp4Buffer = fs.readFileSync(outMp4)
        stiker = await sticker(
            mp4Buffer,
            false,
            global.packsticker || 'Eris-MD',
            global.packsticker2 || 'Sticker'
        )

        await m.react('✅')
    } catch (e) {
        console.error('Error en ttp animado:', e)
        await m.react('❌')
        return conn.reply(m.chat, '> ꒰❌꒱ No pude crear el sticker animado.', m)
    } finally {
        // Limpiar todos los temporales
        for (const fp of framePaths) fs.existsSync(fp) && fs.unlinkSync(fp)
        if (fs.existsSync(outMp4)) fs.unlinkSync(outMp4)

        if (stiker && Buffer.isBuffer(stiker)) {
            await conn.sendFile(m.chat, stiker, 'sticker.webp', '', m)
        }
    }
}

handler.help = ['ttp <texto>']
handler.tags = ['sticker']
handler.command = ['ttp', 'sticktext', 'textsticker']

export default handler
