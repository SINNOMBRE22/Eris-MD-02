/* ✦ SETWELCOME - ERIS-MD ✦ */

const handler = async (m, { conn, args, command, isAdmin, isBotAdmin, groupMetadata }) => {
    const chat = global.db.data.chats[m.chat];
    const prefix = '.';

    const sub = args[0]?.toLowerCase();

    // .setwelcome ver
    if (sub === 'ver') {
        const actual = chat.welcomeMsg || '_Usando mensaje por defecto_';
        const actualBye = chat.byeMsg || '_Usando mensaje por defecto_';
        return conn.sendMessage(m.chat, {
            text: [
                `> ꒰✦꒱ *Mensajes Actuales*`,
                ``,
                `*Bienvenida:*`,
                actual,
                ``,
                `*Despedida:*`,
                actualBye,
                ``,
                `> ꒰💡꒱ Variables disponibles:`,
                `∫ \`@user\` — menciona al usuario`,
                `∫ \`@nombre\` — nombre del usuario`,
                `∫ \`@grupo\` — nombre del grupo`,
                `∫ \`@miembros\` — cantidad de miembros`
            ].join('\n'),
            contextInfo: { mentionedJid: [] }
        }, { quoted: m });
    }

    // .setwelcome reset
    if (sub === 'reset') {
        delete chat.welcomeMsg;
        await global.db.write(); // ✅
        return conn.sendMessage(m.chat, {
            text: `> ꒰✦꒱ Bienvenida restablecida al mensaje por *defecto*.`
        }, { quoted: m });
    }

    // .setwelcome bye reset
    if (sub === 'bye' && args[1]?.toLowerCase() === 'reset') {
        delete chat.byeMsg;
        await global.db.write(); // ✅
        return conn.sendMessage(m.chat, {
            text: `> ꒰✦꒱ Despedida restablecida al mensaje por *defecto*.`
        }, { quoted: m });
    }

    // .setwelcome bye <mensaje>
    if (sub === 'bye') {
        const nuevoMensaje = args.slice(1).join(' ');
        if (!nuevoMensaje) {
            return conn.sendMessage(m.chat, {
                text: [
                    `> ꒰⚠꒱ Debes escribir el nuevo mensaje de despedida.`,
                    ``,
                    `*Ejemplo:*`,
                    `\`${prefix}setwelcome bye Adiós @nombre, que te vaya bien.\``
                ].join('\n')
            }, { quoted: m });
        }
        chat.byeMsg = nuevoMensaje;
        await global.db.write(); // ✅
        return conn.sendMessage(m.chat, {
            text: [
                `> ꒰✦꒱ *Despedida actualizada:*`,
                ``,
                nuevoMensaje,
                ``,
                `> ꒰💡꒱ Usa \`${prefix}setwelcome bye reset\` para volver al mensaje por defecto.`
            ].join('\n')
        }, { quoted: m });
    }

    // .setwelcome <mensaje>
    const nuevoMensaje = args.join(' ');
    if (!nuevoMensaje) {
        return conn.sendMessage(m.chat, {
            text: [
                `> ꒰✦꒱ *Configurar Mensaje de Bienvenida*`,
                ``,
                `*Uso:*`,
                `\`${prefix}setwelcome <mensaje>\` — cambia la bienvenida`,
                `\`${prefix}setwelcome bye <mensaje>\` — cambia la despedida`,
                `\`${prefix}setwelcome ver\` — ver mensajes actuales`,
                `\`${prefix}setwelcome reset\` — restablecer bienvenida`,
                `\`${prefix}setwelcome bye reset\` — restablecer despedida`,
                ``,
                `*Variables disponibles:*`,
                `∫ \`@user\` — menciona al usuario`,
                `∫ \`@nombre\` — nombre del usuario`,
                `∫ \`@grupo\` — nombre del grupo`,
                `∫ \`@miembros\` — cantidad de miembros`,
                ``,
                `*Ejemplo:*`,
                `\`${prefix}setwelcome ¡Hola @nombre! Bienvenido/a a @grupo, somos @miembros.\``
            ].join('\n')
        }, { quoted: m });
    }

    chat.welcomeMsg = nuevoMensaje;
    await global.db.write(); // ✅
    return conn.sendMessage(m.chat, {
        text: [
            `> ꒰✦꒱ *Bienvenida actualizada:*`,
            ``,
            nuevoMensaje,
            ``,
            `> ꒰💡꒱ Usa \`${prefix}setwelcome reset\` para volver al mensaje por defecto.`
        ].join('\n')
    }, { quoted: m });
};

handler.help = ['setwelcome <mensaje>', 'setwelcome bye <mensaje>', 'setwelcome ver', 'setwelcome reset'];
handler.tags = ['grupos'];
handler.command = ['setwelcome', 'bienvenidacambiar', 'setwlc'];
handler.group = true;
handler.admin = true;
handler.botAdmin = false;

export default handler;
