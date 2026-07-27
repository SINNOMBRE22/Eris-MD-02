/* 🌸 COMANDO: DEGRADAR ADMIN - ERIS-MD 🌸 */

let handler = async (m, { conn, text, usedPrefix, command }) => {
    // 1. Identificar al usuario (Mención, Citado o Número)
    let who = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text ? text.replace(/[+@\s-]/g, '') + '@s.whatsapp.net' : false
    
    if (!who) return m.reply(`> ꒰🌸꒱ *USO CORRECTO*\nEtiqueta al admin o responde a su mensaje.\n\n*Ejemplo:*\n${usedPrefix + command} @user`)

    // 2. Seguridad: No intentar degradar al Bot mismo ni al Owner
    if (who === conn.user.jid) return m.reply(`> ꒰🌸꒱ No puedo quitarme el admin a mí misma. ✨`)
    
    const isOwner = global.owner.some(owner => who.includes(owner[0]))
    if (isOwner) return m.reply(`> ꒰🌸꒱ No puedo degradar a mi creador. ✨`)

    try {
        // 3. Ejecutar la degradación en WhatsApp
        await conn.groupParticipantsUpdate(m.chat, [who], 'demote')
        
        // 4. Confirmación visual
        const caption = `> ꒰🌸꒱ *ADMINISTRACIÓN ACTUALIZADA*\n\n➥ @${who.split('@')[0]} ha dejado de ser administrador.\n\n> ✧ *Acción realizada con éxito.* ✨`
        
        await conn.sendMessage(m.chat, { text: caption, mentions: [who] }, { quoted: m })

    } catch (e) {
        console.log('🌸❌ Error en demote:', e)
        await m.reply(`> ꒰❌꒱ No pude quitar el admin. Asegúrese de que el usuario sea administrador y que el Bot tenga los permisos necesarios.`)
    }
}

handler.help = ['demote @user']
handler.tags = ['grupos' , 'admins']
handler.command = ['demote', 'quitarpija', 'degradar']
handler.group = true
handler.admin = true // Solo admins pueden degradar a otros
handler.botAdmin = true // El bot debe ser admin

export default handler
