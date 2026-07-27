/* 🌸 FIX REPORTE: ENVÍO DIRECTO A SINNOMBRE 🌸 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`🌸 *[ AVISO ]*\n\n✧ Detalle:\n➤ Ingresa el error que deseas reportar.\n\n*Ejemplo:* ${usedPrefix + command} el comando .links no carga.`)
    if (text.length < 10) return m.reply(`🌸 *[ BREVE ]*\n\n✧ Detalle:\n➤ El reporte es muy corto (mínimo 10 caracteres).`)

    // ✦ ESTRUCTURA DEL REPORTE ✦
    const teks = `
✦ *NUEVO REPORTE: ERIS-MD*

✧ Usuario: 
➤ ${m.pushName || 'Usuario Eris'}

✧ Contacto:
➤ wa.me/${m.sender.split`@`[0]}

✧ Mensaje:
➤ ${text}
${m.quoted ? '\n✧ Citado:\n➤ ' + m.quoted.text : ''}

⚠️ Reporte enviado desde el núcleo de Eris.`.trim()

    // 🚀 BUSCANDO AL DUEÑO (SINNOMBRE) 🚀
    // Intentamos mandarlo a tu número principal directamente para que no falle
    let ownerNumber = '5215629885039@s.whatsapp.net' 
    
    // Si prefieres usar la variable global por si cambias de número luego:
    // let ownerNumber = (global.owner[0][0] + '@s.whatsapp.net') || '5215629885039@s.whatsapp.net'

    try {
        await conn.reply(ownerNumber, teks, m, { mentions: [m.sender] })
        
        // ✅ CONFIRMACIÓN AL USUARIO
        m.reply(`🌸 *[ ENVIADO ]*\n\n✧ Estado:\n➤ Tu reporte ha sido entregado a mi creador.\n\n⚠️ *Nota:* El mal uso de esta función puede causar baneo.`)
        m.react('📩')

    } catch (e) {
        console.error('🌸❌ Error al enviar reporte:', e)
        m.reply(`⚠️ *[ ERROR ]*\n\n✧ Detalle:\n➤ No se pudo contactar con mi creador. Inténtalo más tarde.`)
    }
}

handler.help = ['reportar']
handler.tags = ['info']
handler.command = ['reporte', 'report', 'reportar', 'bug', 'error']

export default handler
