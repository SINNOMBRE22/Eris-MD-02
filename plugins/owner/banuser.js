/* 🌸 BANEO GLOBAL - ERIS-MD 🌸 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    let user
    let e = '🌸'

    // 1. Identificar al objetivo (Tag, Respuesta o Número)
    if (!text && !m.quoted) return m.reply(`${e} *[ AVISO ]*\n\n✧ Detalle:\n➤ Etiqueta o escribe el número del usuario que deseas banear.`)

    if (m.quoted) {
        user = m.quoted.sender
    } else if (text) {
        user = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    // 2. Verificaciones de Seguridad
    let botJid = conn.user.jid
    if (user === botJid) return m.reply(`⚠️ *[ ERROR ]*\n\n✧ Detalle:\n➤ No puedo banearme a mí misma.`)

    // Protección para TI (SinNombre) y otros owners
    let isOwner = global.owner.some(owner => user.replace(/[^0-9]/g, '') === owner[0].replace(/[^0-9]/g, ''))
    if (isOwner) return m.reply(`⚠️ *[ DENEGADO ]*\n\n✧ Detalle:\n➤ No se puede banear a un Propietario de Eris-MD.`)

    // 3. Ejecutar Baneo en DB
    let users = global.db.data.users
    if (!users[user]) users[user] = { banned: false }
    
    if (users[user].banned) return m.reply(`${e} *[ INFO ]*\n\n✧ Detalle:\n➤ El usuario ya se encuentra baneado.`)

    users[user].banned = true
    let name = conn.getName(user)
    
    // 4. Confirmación con Estilo Eris
    await m.reply(`${e} *[ USUARIO BANEADO ]*\n\n✧ Nombre:\n➤ ${name}\n\n✧ Estado:\n➤ Acceso al bot restringido.\n\n⚠️ *Nota:* Ahora el bot ignorará todos sus comandos.`)
    
    // Notificación a tu número (SinNombre)
    let ownerNumber = '5215629885039@s.whatsapp.net'
    await conn.reply(ownerNumber, `✦ *REPORTE DE BANEO*\n\n• Admin: ${m.pushName}\n• Baneado: ${name}\n• JID: ${user}`, m)

    m.react('🚫')
}

handler.help = ['banuser']
handler.tags = ['owner']
handler.command = ['banuser', 'ban']
handler.rowner = true // 🔥 Solo SinNombre puede banear globalmente

export default handler
