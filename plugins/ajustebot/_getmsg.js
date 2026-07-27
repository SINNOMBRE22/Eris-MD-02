/* 🦈 ERIS-MD KEYWORD RESPONDER (DATABASE MSGS) 🦈 */

export async function all(m) {
    // 1. Filtros de seguridad: No estados, no mensajes propios, no si el bot está baneado
    if (!m.chat.endsWith('.net') || m.fromMe || m.key.remoteJid.endsWith('status@broadcast')) return

    // 2. Verificar base de datos de chats y usuarios
    let chat = global.db.data.chats[m.chat]
    let user = global.db.data.users[m.sender]
    if (chat?.isBanned || user?.banned || m.isBaileys) return

    // 3. Buscar si el texto existe en la base de datos de respuestas personalizadas
    let msgs = global.db.data.msgs
    if (!(m.text in msgs)) return

    console.log(`🌸 [KEYWORD-SYSTEM] Activado por: "${m.text}" en ${m.chat}`)

    // 4. Proceso de conversión (Deserialización de Buffers)
    // Esto asegura que imágenes, audios y videos guardados vuelvan a ser archivos reales
    let _m = this.serializeM(JSON.parse(JSON.stringify(msgs[m.text]), (_, v) => {
        if (
            v !== null &&
            typeof v === 'object' &&
            'type' in v &&
            v.type === 'Buffer' &&
            'data' in v &&
            Array.isArray(v.data)) {
            return Buffer.from(v.data)
        }
        return v
    }))

    try {
        // 5. Reenvío inteligente
        // copyNForward(jid, forceForward, options)
        await _m.copyNForward(m.chat, true, { 
            quoted: m, 
            ephemeralExpiration: 86400 
        })
    } catch (e) {
        console.error('❌ Error al reenviar mensaje guardado:', e)
    }
}
