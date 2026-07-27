/* 🌸 COMANDO: ELIMINAR MENSAJE (FORCE) - ERIS-MD 🌸 */

let handler = async (m, { conn, usedPrefix, command }) => {
    // 1. Verificar si hay algo que borrar
    if (!m.quoted) return m.reply(`> ꒰🌸꒱ *USO CORRECTO*\nResponde al mensaje que deseas eliminar con el comando:\n*${usedPrefix + command}*`)

    try {
        // 2. Extraer los datos necesarios del mensaje citado
        const { chat, fromMe, id, participant } = m.quoted.vM.key
        
        // 3. Enviar la orden de eliminación con todos los parámetros
        await conn.sendMessage(m.chat, { 
            delete: { 
                remoteJid: m.chat, 
                fromMe: fromMe, 
                id: id, 
                participant: participant || m.quoted.sender // Forzar el participante si no viene en la key
            } 
        })

    } catch (e) {
        console.log('🌸❌ Error en delete:', e)
        // Intento desesperado si el anterior falla
        try {
            await conn.sendMessage(m.chat, { delete: m.quoted.fakeObj.key })
        } catch (err) {
            m.reply(`> ꒰❌꒱ No pude eliminar el mensaje. Asegúrate de que el Bot sea *Administrador*.`)
        }
    }
}

handler.help = ['del', 'delete']
handler.tags = ['grupos']
handler.command = ['del', 'delete']
handler.group = true 
handler.admin = true 
handler.botAdmin = true 

export default handler
