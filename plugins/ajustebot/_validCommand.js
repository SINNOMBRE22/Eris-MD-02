/*
// 🦈 ERIS-MD COMMAND CONTROLLER & PRIMARY BOT SYSTEM 🦈 

export async function before(m) {
    // 1. Validaciones: No procesar si no hay texto, si no tiene prefijo o si no es grupo
    const prefixRegex = global.prefix // Usamos el prefijo global
    if (!m.text || !prefixRegex.test(m.text) || !m.isGroup) return

    let chat = global.db.data.chats[m.chat]
    if (!chat) return 

    // --- 🛡️ LÓGICA DE CONTROL DE BOT PRIMARIO ---
    // Evita que múltiples bots respondan al mismo comando
    let selfJid = this.user.jid.replace(/:.*@/, '@')
    if (chat.primaryBot && chat.primaryBot !== selfJid) {
        return // Me quedo callado, no soy el bot principal de este grupo
    }

    // 2. Extraer el comando
    const usedPrefix = m.text.match(prefixRegex)[0]
    const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase()
    if (!command || command === "bot") return

    // 3. Verificar si el comando existe en los plugins
    const isCommand = (cmd) => {
        return Object.values(global.plugins).some(plugin => 
            plugin.command && (Array.isArray(plugin.command) ? plugin.command.includes(cmd) : plugin.command === cmd)
        )
    }

    if (isCommand(command)) {
        let user = global.db.data.users[m.sender]
        
        // 🔒 Verificar si el chat está baneado/desactivado
        if (chat.isBanned) {
            const aviso = `🌸 *Eris-MD* está en modo reposo en este grupo.\n\n> ✦ Si eres *Admin*, despiértame con:\n> » *${usedPrefix}bot on*`
            await m.reply(aviso)
            return
        }

        // 📈 Contador de uso
        if (!user.commands) user.commands = 0
        user.commands += 1
        console.log(`🌸 [ERIS-CMD] ${m.sender.split('@')[0]} usó: ${usedPrefix}${command}`)

    } else {
        // ❌ Aviso de comando inexistente (Solo lo envía el bot primario para evitar spam)
        const cmdErr = m.text.trim().split(' ')[0]
        await m.reply(`🌸 Ups, el comando *${cmdErr}* no está en mi base de datos.\n\nUsa *${usedPrefix}help* para ver qué puedo hacer por ti.`)
    }
}
*/
/* 🦈 ERIS-MD COMMAND CONTROLLER (SILENT MODE) 🦈 */

export async function before(m) {
    // 1. Validaciones básicas
    const prefixRegex = global.prefix 
    if (!m.text || !prefixRegex.test(m.text) || !m.isGroup) return

    let chat = global.db.data.chats[m.chat]
    if (!chat) return

    // --- 🛡️ LÓGICA DE CONTROL DE BOT PRIMARIO ---
    let selfJid = this.user.jid.replace(/:.*@/, '@')
    if (chat.primaryBot && chat.primaryBot !== selfJid) return 

    // 2. Extraer el comando
    const match = m.text.match(prefixRegex)
    if (!match) return
    const usedPrefix = match[0]
    const command = m.text.slice(usedPrefix.length).trim().split(' ')[0].toLowerCase()
    
    if (!command || command === "bot") return

    // 3. Verificar si el comando existe
    const isCommand = (cmd) => {
        return Object.values(global.plugins).some(plugin => {
            if (!plugin.command) return false
            if (Array.isArray(plugin.command)) return plugin.command.includes(cmd)
            if (plugin.command instanceof RegExp) return plugin.command.test(cmd)
            return plugin.command === cmd
        })
    }

    if (isCommand(command)) {
        let user = global.db.data.users[m.sender]
        if (!user) return

        // 🔒 Verificar baneo del chat
        if (chat.isBanned) {
            const aviso = `🌸 *Eris-MD* está en modo reposo.\n\n> ✦ Despiértame con: *${usedPrefix}bot on*`
            await m.reply(aviso)
            return true // Detiene la ejecución aquí
        }

        // 📈 Contador de uso
        if (!user.commands) user.commands = 0
        user.commands += 1
        console.log(`🌸 [ERIS-CMD] ${m.sender.split('@')[0]} usó: ${usedPrefix}${command}`)
    } 
    
    // ❌ ELIMINAMOS EL AVISO DE "COMANDO NO EXISTE"
    // Dejamos que el flujo siga natural para que no haya spam molesto.
    return
}
