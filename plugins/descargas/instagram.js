/* ERIS-MD INSTAGRAM DOWNLOADER - ALL-IN-ONE */

import axios from 'axios'
import fs from 'fs'
import path from 'path'
// instagram-url-direct v1.0.13 trae un bug: su build ESM declara "type": "module"
// pero por dentro usa CommonJS. Por eso cargamos su build CJS con createRequire,
// y si aun así falla, el plugin sigue funcionando con la API de respaldo.
import { createRequire } from 'module'

let instagramGetUrl = null

function extraerFuncion(mod) {
    if (!mod) return null
    const candidatos = [
        mod.instagramGetUrl,
        mod.default?.instagramGetUrl,
        mod.default,
        mod.getUrl,
        mod
    ]
    const fn = candidatos.find(c => typeof c === 'function')
    if (fn) return fn
    if (typeof mod === 'object') {
        return Object.values(mod).find(v => typeof v === 'function') || null
    }
    return null
}

// Intento 1: require (usa el build CommonJS, que sí funciona)
try {
    const require = createRequire(import.meta.url)
    instagramGetUrl = extraerFuncion(require('instagram-url-direct'))
} catch (e) {
    // Intento 2: import dinámico (por si en el futuro arreglan el ESM)
    try {
        instagramGetUrl = extraerFuncion(await import('instagram-url-direct'))
    } catch (e2) {
        console.log('[instagram] librería no disponible, se usará la API')
    }
}

// --- DATOS OFICIALES DE ERIS ---
const newsletterJid = '120363407502496951@newsletter'
const newsletterName = 'Eris Service'
const redes = 'https://github.com/SINNOMBRE22/Eris-MD'

// Reacción a prueba de fallos
async function reaccion(m, emoji) {
    try { await m.react(emoji) } catch {}
}

// Extrae un mensaje legible de cualquier cosa que se lance (Error, string, objeto)
function textoError(err) {
    if (!err) return 'sin detalle'
    if (typeof err === 'string') return err
    if (err.message) return err.message
    if (err.response?.status) return `HTTP ${err.response.status}`
    try { return JSON.stringify(err).slice(0, 150) } catch { return String(err) }
}

// ── MÉTODO 1: librería local (sin apikey, no caduca) ──
async function viaLibreria(url) {
    if (typeof instagramGetUrl !== 'function') {
        throw new Error('librería no cargada (ejecuta: npm install instagram-url-direct@latest)')
    }
    const res = await instagramGetUrl(url)
    if (!res?.url_list?.length) throw new Error('Sin resultados')

    const info = res.post_info || {}
    const detalles = res.media_details || []

    const medios = res.url_list.map((u, i) => ({
        url: u,
        // media_details dice si es video o imagen; si no, lo deducimos por la URL
        type: detalles[i]?.type === 'video' || /\.mp4/i.test(u) ? 'video' : 'image'
    }))

    return {
        user: info.owner_username || null,
        title: info.caption || null,
        media: medios,
        origen: 'librería'
    }
}

// ── MÉTODO 2: API externa (respaldo si la librería falla) ──
async function viaApi(url) {
    const { data: res } = await axios.get(
        'https://rest.apicausas.xyz/api/v1/descargas/instagram',
        { params: { url, apikey: 'causa-ee5ee31dcfc79da4' }, timeout: 30000 }
    )
    if (!res?.status || !res?.data) throw new Error('La API no devolvió datos')

    const d = res.data
    const lista = Array.isArray(d.download) ? d.download : [d.download]

    const medios = lista.filter(Boolean).map(item => {
        const u = typeof item === 'string' ? item : item.url
        const esVideo = (typeof item === 'object' && item.type?.includes('video')) || /\.mp4/i.test(u || '')
        return { url: u, type: esVideo ? 'video' : 'image' }
    })

    if (!medios.length) throw new Error('La API no devolvió archivos')

    return {
        user: d.user || null,
        title: d.title || null,
        media: medios,
        origen: 'API'
    }
}

const handler = async (m, { args, conn, usedPrefix, command }) => {

    // Miniatura de Eris
    let thumb
    try {
        thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg'))
    } catch {
        thumb = Buffer.alloc(0)
    }

    const name = m.pushName || (await conn.getName(m.sender).catch(() => null)) || 'Usuario'

    // --- MENSAJE DE AYUDA CON MINIATURA ---
    if (!args[0]) {
        const helpText = `🌸 *Enlace requerido, ${name}.*\n\nNecesito la URL de un post o Reel de Instagram.\n> *Ejemplo:* ${usedPrefix + command} https://www.instagram.com/reel/C4...`

        return conn.sendMessage(m.chat, {
            text: helpText,
            contextInfo: {
                mentionedJid: [m.sender],
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 },
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - INSTAGRAM 🌸`,
                    body: `Hola ${name}, indica un enlace.`,
                    thumbnail: thumb,
                    mediaType: 1,
                    renderLargerThumbnail: false,
                    sourceUrl: redes
                }
            }
        }, { quoted: m })
    }

    // Limpiar la URL: quitar parámetros de rastreo que rompen la descarga
    let url = args[0].trim().split('?')[0]
    if (!/instagram\.com|instagr\.am/.test(url)) {
        return conn.reply(m.chat, `🌸 *Enlace inválido.* El link no parece ser de Instagram.`, m)
    }

    await reaccion(m, '🕓')

    const errores = []
    let resultado = null

    try {
        // Intentar librería primero, API como respaldo
        for (const metodo of [viaLibreria, viaApi]) {
            try {
                resultado = await metodo(url)
                if (resultado?.media?.length) break
            } catch (err) {
                errores.push(`${metodo.name}: ${textoError(err)}`)
            }
        }

        if (!resultado?.media?.length) {
            throw new Error(errores.join(' | ') || 'Ningún método obtuvo el contenido')
        }

        const { user, title, media } = resultado

        // Tarjeta informativa de éxito
        let infoCaption = `╭─── [ 📸 *INSTAGRAM DL* ] ──···\n`
        infoCaption += `│ 👤 *Usuario:* ${user || 'N/A'}\n`
        infoCaption += `│ 📝 *Título:* ${title ? title.substring(0, 50) + '...' : 'Contenido de IG'}\n`
        infoCaption += `│ 🎞️ *Archivos:* ${media.length}\n`
        infoCaption += `╰─────────────────────────···\n\n`
        infoCaption += `> 🌸 *Enviando contenido visual...*`

        await conn.sendMessage(m.chat, {
            text: infoCaption,
            contextInfo: {
                mentionedJid: [m.sender],
                externalAdReply: {
                    title: `🌸 ERIS SERVICE - SUCCESS 🌸`,
                    body: `Post de ${user || 'Instagram'}`,
                    thumbnail: thumb,
                    mediaType: 1,
                    sourceUrl: url
                }
            }
        }, { quoted: m })

        // PROCESAMIENTO DE MULTIMEDIA (CARRUSELES O SIMPLE)
        let enviados = 0
        for (const item of media) {
            if (!item.url) continue
            try {
                if (item.type === 'video') {
                    await conn.sendMessage(m.chat, {
                        video: { url: item.url },
                        caption: `📹 *Video/Reel*\n👤 ${user || ''}`,
                        mimetype: 'video/mp4'
                    }, { quoted: m })
                } else {
                    await conn.sendMessage(m.chat, {
                        image: { url: item.url },
                        caption: `🖼️ *Imagen*\n👤 ${user || ''}`
                    }, { quoted: m })
                }
                enviados++
            } catch (err) {
                console.error('Error enviando media IG:', err.message)
            }
        }

        if (!enviados) throw new Error('No se pudo enviar ningún archivo')

        await reaccion(m, '✅')

    } catch (e) {
        console.error('Error Instagram DL:', e)
        await reaccion(m, '❌')
        // Mostrar el motivo real, no un mensaje genérico
        conn.reply(
            m.chat,
            `🌸 *No pude obtener el contenido.*\n\n📄 *Motivo:* ${e.message}\n\n💡 Verifica que la cuenta sea pública y que el enlace sea de un post o reel.`,
            m
        )
    }
}

handler.command = ['instagram', 'ig', 'instadl']
handler.tags = ['descargas']
handler.help = ['ig <url>']
handler.register = false

export default handler
