/* 🌸 COMANDO: AGREGAR DIRECTO - ERIS-MD 🌸 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Validar entrada y limpiar el número
    if (!text) return conn.reply(m.chat, `> ꒰🌸꒱ *USO CORRECTO*\nIngrese el número de la persona.\n\nEjemplo:\n*${usedPrefix + command}* 521562988xxxx`, m)
    
    // Limpia el número de cualquier símbolo o espacio
    let num = text.replace(/[+@\s-]/g, '')
    
    if (isNaN(num)) return conn.reply(m.chat, `> ꒰❌꒱ Ingrese solo números, sin letras ni símbolos.`, m)

    let jid = num + '@s.whatsapp.net'
    let group = m.chat

    try {
        // 2. INTENTO DE AGREGAR DIRECTO AL GRUPO
        let res = await conn.groupParticipantsUpdate(group, [jid], 'add')
        
        // Verificación de respuesta de WhatsApp
        // status '403' = Privacidad activada (No se puede agregar directo)
        if (res[0].status === '403') {
            let link = 'https://chat.whatsapp.com/' + await conn.groupInviteCode(group)
            let groupName = await conn.getName(group)
            
            // Enviamos el link por privado si no pudimos meterlo
            await conn.reply(jid, `> ꒰🌸꒱ *INVITACIÓN A GRUPO*\n\nHola, intenté añadirte a *${groupName}* pero tu privacidad no lo permitió.\n\n✨ *Únete aquí:* ${link}`, null)
            
            return m.reply(`> ꒰⚠️꒱ El usuario tiene la privacidad activada. Se le ha enviado el enlace de invitación a su chat privado.`)
        }

        // status '200' = Éxito total
        if (res[0].status === '200') {
            return m.reply(`> ꒰✅꒱ @${num} ha sido añadido con éxito al grupo. ✨`, null, { mentions: [jid] })
        }

        // Otros estados (número no existe, etc)
        return m.reply(`> ꒰❌꒱ No se pudo completar la acción. Estado: ${res[0].status}`)

    } catch (e) {
        // Error general (el bot no es admin o error de conexión)
        await m.reply(`> ꒰❌꒱ Error crítico: Asegúrese de que el número sea correcto y que el Bot sea Administrador del grupo.`)
    }
}

handler.help = ['add <número>']
handler.tags = ['grupos']
handler.command = ['add', 'agregar', 'añadir']
handler.group = true
handler.admin = true // Solo los admins del grupo pueden usar este comando
handler.botAdmin = true // El bot DEBE ser admin para meter gente

export default handler
