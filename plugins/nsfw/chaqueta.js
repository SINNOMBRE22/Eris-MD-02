/* ERIS-MD ANIMACIÓN NSFW */

let handler = async (m, { conn, command, usedPrefix }) => {
    // 1. Identificar a quién se le hace la broma
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null;

    if (!who) {
        return conn.reply(m.chat, `🌸 *Necesitas ayuda con eso.*\n\nEtiqueta o responde al mensaje de alguien para usar este comando.\n> *Ejemplo:* ${usedPrefix + command} @SinNombre`, m);
    }

    let senderName = `@${m.sender.split('@')[0]}`;
    let targetName = `@${who.split('@')[0]}`;
    let mentionsArray = [m.sender, who];

    // 2. Enviar mensaje inicial
    const { key } = await conn.sendMessage(m.chat, { text: `🔥 *Iniciando...*` }, { quoted: m });

    // 3. Frames de la animación ASCII
    const frame1 = '╭━━╮╭╭╭╮\n┃▔╲┣╈╈╈╈━━━╮\n┃┈┈▏.╰╯╯╯╭╮━┫\n┃┈--.╭━━━━╈╈━╯\n╰━━╯-.                ╰╯';
    const frame2 = '╭━━╮.    ╭╭╭╮\n┃▔╲┣━━╈╈╈╈━━╮\n┃┈┈▏.    .╰╯╯╯╭╮┫\n┃┈--.╭━━━━━━╈╈╯\n╰━━╯-.           . ╰╯';
    
    // Bucle de animación (se repite 8 veces alternando imágenes)
    for (let i = 0; i < 8; i++) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa vital de 0.5s para no ser baneado
        let currentFrame = (i % 2 === 0) ? frame1 : frame2;
        await conn.sendMessage(m.chat, { text: currentFrame, edit: key });
    }

    // 4. Frame Final y Tarjeta Eris
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let splash = `              .               .   ╭\n╭━━╮╭╭╭╮.           ╭ ╯\n┃▔╲┣╈╈╈╈━━━╮╭╯╭\n┃┈┈▏.╰╯╯╯╭╮━┫  \n┃┈--.╭━━━━╈╈━╯╰╮╰\n╰━━╯-.        ╰╯...-    ╰ ╮\n   .         . .  .  .. . . .  . .. .  ╰`;

    let caption = `${splash}\n\n`;
    caption += `╭─── [ 🔥 *FINALIZADO* ] ──···\n`;
    caption += `│ 👤 ${senderName} se ha venido\n`;
    caption += `│ gracias a ${targetName}. 💦\n`;
    caption += `╰─────────────────────────···`;

    await conn.sendMessage(m.chat, { text: caption, edit: key, mentions: mentionsArray });
}

handler.help = ['chaqueta <@tag>'];
handler.tags = ['nsfw'];
handler.command = ['jalame', 'jalamela', 'chaqueteame', 'chaqueta'];
handler.group = true;
handler.register = false;

export default handler;
