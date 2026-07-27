/* 🌸 AUTO-ADMIN: PODER TOTAL - ERIS-MD 🌸 */

let handler = async (m, { conn, isAdmin }) => {
    // 1. Verificación previa
    if (isAdmin) return m.reply('🌸 *[ AVISO ]*\n\n✧ Detalle:\n➤ Ya cuentas con el rango de administrador en este grupo.')

    try {
        // 2. Ejecutar ascenso
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
        
        // 3. Confirmación con Identidad Eris
        await m.reply('🌸 *[ ACCESO CONCEDIDO ]*\n\n✧ Estado:\n➤ Rango de administrador asignado correctamente.\n\n⚠️ *Nota:* Úsalo con sabiduría, SinNombre 👑.')
        await m.react('👑')

    } catch (e) {
        console.error('🌸❌ Error en Autoadmin:', e)
        m.reply('⚠️ *[ ERROR ]*\n\n✧ Detalle:\n➤ No pude darte admin. Verifica que yo sea administrador del grupo.')
    }
}

handler.help = ['autoadmin']
handler.tags = ['owner']
handler.command = ['autoadmin', 'dameadmin']
handler.rowner = true  // 🔥 SOLO TÚ PUEDES USARLO
handler.group = true   // Solo funciona en grupos
handler.botAdmin = true // El bot necesita ser admin para darte el rango

export default handler
