/* 🌸 AUTO-RECHAZAR (ANTI-FAKES) - ERIS-MD SYSTEM 🌸 */

let handler = m => m

handler.before = async function (m, { conn, isBotAdmin }) {
    if (!m.isGroup) return false
    
    let chat = global.db.data.chats[m.chat]
    if (!chat?.autoRechazar || !isBotAdmin) return false

    // ⛔ Lista negra de prefijos (Países detectados como Spam)
    // 6 = Indonesia/Malasia, 91 = India, 92 = Pakistán, 212 = Marruecos, etc.
    const prefixes = ['6', '90', '963', '966', '967', '249', '212', '92', '93', '94', '7', '49', '2', '91', '48']

    // 1. CAPTURAR EVENTO EN TIEMPO REAL (TIPO 172)
    if (m.messageStubType === 172 && m.messageStubParameters) {
        const jid = m.messageStubParameters[0]
        const numero = jid.split('@')[0]
        
        // Verificamos si el número empieza con algún prefijo bloqueado
        const isBlocked = prefixes.some(prefix => numero.startsWith(prefix))

        if (isBlocked) {
            try {
                // Eris le cierra la puerta
                await conn.groupRequestParticipantsUpdate(m.chat, [jid], "reject")
                
                // Mensaje estético avisando del bloqueo
                const erisContext = {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363407502496951@newsletter',
                        newsletterName: '✨ Eris-MD Oficial'
                    }
                }

                let aviso = `> ⊰🌸⊱ *INGRESO RECHAZADO*\n\n➥ *Número:* @${numero}\n> ✧ *Motivo:* Prefijo internacional bloqueado (Anti-Spam).`
                
                await conn.sendMessage(m.chat, { text: aviso, mentions: [jid], contextInfo: erisContext })
            } catch (e) {
                console.log('🌸❌ Error al auto-rechazar:', e)
            }
        }
    }

    // 2. RUTINA DE LIMPIEZA (Revisa si hay algún árabe atascado en la bandeja de pendientes)
    try {
        const requests = await conn.groupRequestParticipantsList(m.chat)
        if (requests && requests.length > 0) {
            for (const req of requests) {
                const reqNum = req.jid.split('@')[0]
                const isBlocked = prefixes.some(prefix => reqNum.startsWith(prefix))
                
                if (isBlocked) {
                    await conn.groupRequestParticipantsUpdate(m.chat, [req.jid], "reject")
                }
            }
        }
    } catch (e) {}

    return true
}

export default handler
