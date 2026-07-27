/* 🦈 ERIS-MD AUTO-STICKER (PRO-CONVERTER) 🦈 */

import { sticker } from '../../lib/sticker.js'
import { uploadFile } from '../../lib/uploadFile.js'

let handler = m => m

handler.all = async function (m) {
    let chat = global.db.data.chats[m.chat]
    
    // 🛡️ Filtro de seguridad
    if (!chat?.autosticker || !m.isGroup || m.fromMe) return true

    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ''
    
    if (!mime || /webp/g.test(mime)) return true

    try {
        let img = await q.download?.()
        if (!img) return true

        let isVideo = /video/g.test(mime)
        if (isVideo && (q.msg || q).seconds > 9) return // Si es muy largo, WhatsApp lo congela

        console.log(`🌸 [STICKER ENGINE] Convirtiendo ${isVideo ? 'Animado' : 'Estático'}...`)

        // 🎨 Forzamos el procesado con la librería
        // El 'false' después de 'img' es para que NO mantenga el ratio original y lo haga cuadrado
        let stiker = await sticker(img, false, global.packname, global.author)

        if (stiker) {
            // 🔥 LA CLAVE: Usamos 'this.sendMessage' con el tipo 'sticker' explícito
            // Esto evita que salga como archivo o con fondo blanco
            await this.sendMessage(m.chat, { 
                sticker: stiker 
            }, { 
                quoted: m,
                ephemeralExpiration: 86400 
            })
        }

    } catch (e) {
        console.error(`❌ Error en el motor de stickers:`, e)
    }
    
    return true
}

export default handler
