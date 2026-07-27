/* 🌸 CONFIGURACIÓN DE GRUPO - ERIS-MD (MINIMAL) 🌸 */

let handler = async (m, { conn, args, usedPrefix, command }) => {
    let isClose = {
        'open': 'not_announcement',
        'close': 'announcement',
        'abierto': 'not_announcement',
        'cerrado': 'announcement',
        'abrir': 'not_announcement',
        'cerrar': 'announcement',
    }[(args[0] || '').toLowerCase()]

    // menú simple si no hay opción
    if (isClose === undefined) {
        return m.reply(
`✦ AJUSTES DE GRUPO

➤ ${usedPrefix + command} abrir
➤ ${usedPrefix + command} cerrar`
        )
    }

    // aplicar cambio sin enviar mensaje extra
    await conn.groupSettingUpdate(m.chat, isClose)
}

handler.help = ['grupo abrir', 'grupo cerrar']
handler.tags = ['grupos', 'admins']
handler.command = ['group', 'grupo']
handler.admin = true
handler.botAdmin = true

export default handler
