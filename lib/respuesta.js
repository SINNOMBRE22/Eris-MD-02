import fs from 'fs'
import path from 'path'

// --- VALORES NECESARIOS ---
const newsletterJid = '120363407502496951@newsletter';
const newsletterName = 'Eris Service';
const packname = 'Eris-Pack';
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

/**
 * Plugin centralizado para manejar mensajes de error de permisos.
 */
const handler = async (type, conn, m, comando) => {
    
    // Cargamos la misma miniatura que el menú
    let thumb;
    try {
        const imgPath = path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')
        thumb = fs.readFileSync(imgPath)
    } catch {
        thumb = Buffer.alloc(0)
    }

    const templates = {
        rowner: `*[ 🛡️ ERIS-MD ]*\n\nAcceso denegado al comando _${comando}_.\n*Requisito:* 🦈 Solo mi creador.`,
        owner: `*[ 🛡️ ERIS-MD ]*\n\nAcceso denegado al comando _${comando}_.\n*Requisito:* ⚙️ Privilegios de Owner.`,
        mods: `*[ 🛡️ ERIS-MD ]*\n\nAcceso denegado al comando _${comando}_.\n*Requisito:* 🔌 Rango de Moderador.`,
        premium: `*[ 🛡️ ERIS-MD ]*\n\nAcceso denegado al comando _${comando}_.\n*Requisito:* 🌟 Cuenta Premium activa.`,
        group: `*[ 🛡️ ERIS-MD ]*\n\nError de entorno con _${comando}_.\n*Requisito:* 🫂 Ejecutar dentro de un grupo.`,
        private: `*[ 🛡️ ERIS-MD ]*\n\nError de entorno con _${comando}_.\n*Requisito:* 🏠 Ejecutar en chat privado.`,
        admin: `*[ 🛡️ ERIS-MD ]*\n\nAcceso denegado al comando _${comando}_.\n*Requisito:* 👑 Ser Administrador del grupo.`,
        botAdmin: `*[ 🛡️ ERIS-MD ]*\n\nFallo al ejecutar _${comando}_.\n*Requisito:* 🚫 El bot necesita ser Administrador.`,
        unreg: `*[ 🛡️ ERIS-MD ]*\n\nPerfil no encontrado en el sistema.\n*Requisito:* 📝 Regístrate usando: _#reg Nombre.Edad_`,
        restrict: `*[ 🛡️ ERIS-MD ]*\n\nFunción deshabilitada por seguridad.\n*Requisito:* ⛔ Acceso a _${comando}_ restringido.`
    };

    const msg = templates[type];

    if (msg) {
        const contextInfo = {
            mentionedJid: [m.sender],
            isForwarded: true,
            forwardingScore: 999,
            forwardedNewsletterMessageInfo: {
                newsletterJid: newsletterJid,
                newsletterName: newsletterName,
                serverMessageId: -1
            },
            externalAdReply: {
                title: packname,
                body: 'SERVICIO DENEGADO',
                thumbnail: thumb, // Ahora usa la imagen perfil2.jpeg
                sourceUrl: redes,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        };

        await conn.reply(m.chat, msg, m, { contextInfo })

        try {
            m.react && m.react('✖️')
        } catch {}
    }

    return true
}

export default handler
