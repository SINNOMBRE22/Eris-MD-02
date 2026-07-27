import { exec as _exec } from 'child_process'
import { promisify } from 'util'

const exec = promisify(_exec)

function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '')
}

let handler = async (m, { conn, command }) => {
    try {
        if (typeof global.loadDatabase === 'function' && (!global.db || !global.db.data)) {
            await global.loadDatabase()
        }
        if (!global.db) throw new Error('Database no disponible')
        if (!global.db.data) global.db.data = {}
        if (!global.db.data.users) global.db.data.users = {}
        if (!global.db.data.users[m.sender]) {
            global.db.data.users[m.sender] = { comandos: 0, lastusuario: 0 }
        }

        // ========== DETECCIÓN DE OWNER (robusta) ==========
        const senderNumber = m.sender.split('@')[0] // elimina @s.whatsapp.net o @c.us

        let isOwner = false
        if (global.owner) {
            let owners = []
            if (Array.isArray(global.owner)) {
                owners = global.owner.map(o => Array.isArray(o) ? o[0] : o)
            } else if (typeof global.owner === 'string') {
                owners = [global.owner]
            }
            // Limpiar números (solo dígitos)
            owners = owners.map(o => String(o).replace(/\D/g, ''))
            isOwner = owners.includes(senderNumber)
        }

        // ========== COOLDOWN SOLO PARA NO-OWNERS ==========
        const COOLDOWN = 3 * 24 * 60 * 60 * 1000 // 3 días
        const last = global.db.data.users[m.sender].lastusuario || 0

        if (!isOwner && Date.now() - last < COOLDOWN) {
            const wait = msToTime(COOLDOWN - (Date.now() - last))
            throw `⏱️ Espera ${wait} antes de crear otro usuario.`
        }

        await m.reply("💻 Creando usuario random, espera...")

        let stdout = ''
        try {
            const { stdout: out } = await exec('userbot')
            stdout = out || ''
        } catch (e) {
            stdout = (e.stdout || e.message || String(e))
            await m.reply(`❌ Error al generar usuario:\n${stripAnsi(stdout)}`)
            return
        }

        // Solo actualizar estadísticas si NO es owner (para mantener limpias las del owner)
        if (!isOwner) {
            global.db.data.users[m.sender].comandos = (global.db.data.users[m.sender].comandos || 0) + 1
            global.db.data.users[m.sender].lastusuario = Date.now()
            try { await global.db.write() } catch (e) { console.error('DB write error:', e) }
        }

        // Mensaje público
        await conn.sendMessage(m.chat, {
            text: `✅ *Cuenta generada*\n\nLos datos han sido enviados al privado.\n\n_Recuerda que puedes donar para mantener el servidor activo._`
        }, { quoted: m })

        // Enviar datos al privado (sin ANSI)
        const cleanOutput = stripAnsi(stdout)
        await conn.sendMessage(m.sender, {
            text: `❏ *DATOS DE CUENTA*\n\n${cleanOutput}\n\n*Nota:* Para puertos SSL WS usar Payload.`
        })
    } catch (err) {
        const message = (err && err.message) ? err.message : String(err)
        console.error('Error en usuarios-demo:', err)
        try { await m.reply(`❌ Error: ${message}`) } catch (e) {}
    }
}

handler.help = ['user']
handler.tags = ['netfree']
handler.command = /^(usuario|user)$/i
handler.group = true

export default handler

function msToTime(duration) {
    const seconds = Math.floor((duration / 1000) % 60)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    const days = Math.floor(duration / (1000 * 60 * 60 * 24))
    return `${days}d ${hours}h ${minutes}m ${seconds}s`
}
