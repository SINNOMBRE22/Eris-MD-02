/* 🌸 ANTI-TRABA - ERIS-MD SYSTEM (FLOWER EDITION) 🌸 */

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner }) {
  if (m.isBaileys && m.fromMe) return true;
  if (!m.isGroup) return false;

  const chat = global.db.data.chats[m.chat];
  const bot = global.db.data.settings[conn.user.jid] || {};
  
  if (!chat?.antiTraba) return true;

  // Límite de caracteres (5000 es el estándar para detectar textos pesados)
  if (m.text && m.text.length > 5000) {
    const name = conn.getName(m.sender);
    const user = `@${m.sender.split('@')[0]}`;
    
    // Inyectamos el contexto de Eris para el mensaje
    const erisContext = {
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: '120363407502496951@newsletter',
        newsletterName: '✨ Eris-MD Oficial'
      }
    };

    // Si el que lo envía es Admin, solo avisamos
    if (isAdmin) {
      return conn.sendMessage(m.chat, { 
        text: `> ⊰🌸⊱ *AVISO ADM*\n\nEl administrador ${user} envió un texto muy extenso. Tengan cuidado dispositivos de gama baja.`,
        mentions: [m.sender],
        contextInfo: erisContext
      });
    }

    // --- ACCIÓN PARA USUARIOS NORMALES ---

    // 1. Mensaje de Alerta
    await conn.sendMessage(m.chat, { 
      text: `> ⊰🌸⊱ *TRABA DETECTADA*\n\nSe detectó un mensaje con exceso de caracteres que puede congelar dispositivos.\n➥ Procediendo con la limpieza.`,
      contextInfo: erisContext
    });

    if (isBotAdmin && bot.restrict) {
      // 2. Borrado inmediato de la traba
      await conn.sendMessage(m.chat, { 
        delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender } 
      });

      // 3. Limpieza visual del chat (Flood de líneas)
      const cleaning = `🌸 *CHAT LIMPIO* 🌸\n${'\n'.repeat(300)}\n➥ Traba eliminada de: ${name}`;
      await conn.sendMessage(m.chat, { text: cleaning, mentions: [m.sender] });

      // 4. Expulsión
      setTimeout(async () => {
        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
      }, 1000);

    } else {
      // Si el bot no es admin o no tiene restrict
      let msg = !isBotAdmin ? 'No soy administradora para borrar esto.' : 'Mi Creador tiene desactivado el modo *restrict*.';
      return m.reply(`> ⊰🌸⊱ *ERROR:* ${msg}`);
    }
  }
  return true;
}
