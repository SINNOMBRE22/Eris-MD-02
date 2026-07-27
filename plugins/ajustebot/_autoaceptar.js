/* 🌸 AUTO-ACEPTAR (CON AVISO FLORAL) - ERIS-MD SYSTEM 🌸 */

let handler = m => m

handler.before = async function (m, { conn, isBotAdmin }) {
    if (!m.isGroup) return false
    
    let chat = global.db.data.chats[m.chat]
    if (!chat?.autoAceptar || !isBotAdmin) return false

    // 1. CAPTURAR EVENTO DE SOLICITUD
    if (m.messageStubType === 172 && m.messageStubParameters) {
        const jid = m.messageStubParameters[0]
        
        try {
            // Eris abre la puerta
            await conn.groupRequestParticipantsUpdate(m.chat, [jid], "approve")
            
            // 🌸 SOLUCIÓN AL UNDEFINED:
            let name = await conn.getName(jid)
            
            // Si el nombre no existe, está oculto o dice undefined, usamos un apodo bonito
            if (!name || name === 'undefined' || name === jid.split('@')[0]) {
                name = 'Nuevo Integrante ✨'
            }

            let aviso = `> ⊰🌸⊱ *INGRESO APROBADO*\n\n➥${name}\nEris-MD ha aceptado tu solicitud. ¡Disfruta tu estadía!`.trim()
            
            await conn.sendMessage(m.chat, { 
                text: aviso, 
                // Ya no usamos mentions: [jid] para que no salga el @420655... azul
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363407502496951@newsletter',
                        newsletterName: '✨ Eris-MD Oficial'
                    }
                }
            })
        } catch (e) {
            console.log('🌸❌ Error al auto-aceptar:', e)
        }
    }
    
    // 2. RUTINA DE LIMPIEZA
    try {
        const participants = await conn.groupRequestParticipantsList(m.chat)
        if (participants && participants.length > 0) {
            for (const participant of participants) {
                await conn.groupRequestParticipantsUpdate(m.chat, [participant.jid], "approve")
            }
        }
    } catch (e) {}

    return true
}

export default handler

