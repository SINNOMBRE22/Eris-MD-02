/* 🦈 ANTI-LINK 2 (GLOBAL) - ERIS-MD SYSTEM 🦈 */

// Regex ultra potente para detectar casi cualquier enlace de internet
const linkRegex = /(chat\.whatsapp\.com\/|whatsapp\.com\/channel\/)[0-9A-Za-z]{20,24}|(https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be|tiktok\.com|facebook\.com|instagram\.com|twitter\.com|t\.me|drive\.google\.com|docs\.google\.com|wa\.me|open\.spotify\.com|spotify\.link|soundcloud\.com|mediafire\.com|mega\.nz|streamable\.com|vk\.com|reddit\.com|pinterest\.com|snapchat\.com|linkedin\.com|discord\.gg|discordapp\.com\/invite)\/[a-zA-Z0-9\-\._~:\/?#\[\]@!$&'\(\)*+,;=.]+|pastebin\.com\/[a-zA-Z0-9]+|(?:[a-zA-Z0-9-]+\.)+(?:com|net|org|io|app|dev|xyz|info|biz|co|cc|tv|me|us|eu|ru|in|id|jp|fr|de|uk|br|mx|ar|cl|pe|uy|py|bo|ec|gt|cr|sv|hn|ni|pa|cu|do|pr|ve|co|ca)\b(?!\/)?)/gi;

let cachedLinks = {};

async function getInvite(conn, chatId) {
  if (cachedLinks[chatId]) return cachedLinks[chatId];
  try {
    const code = await conn.groupInviteCode(chatId);
    const link = `https://chat.whatsapp.com/${code}`;
    cachedLinks[chatId] = link;
    setTimeout(() => delete cachedLinks[chatId], 10 * 60 * 1000);
    return link;
  } catch { return null; }
}

export async function before(m, { conn, isAdmin, isBotAdmin, participants }) {
  if (!m.isGroup || !m.text) return;

  const chat = global.db.data.chats[m.chat];
  const bot = global.db.data.settings[this.user.jid] || {};
  
  if (!chat?.antiLink2) return;

  // Los Admins y el Bot son inmunes
  if (isAdmin || m.fromMe) return;

  const containsLink = m.text.match(linkRegex);

  if (containsLink) {
    const user = `@${m.sender.split('@')[0]}`;
    
    // Comprobar links permitidos (YouTube y el link del propio grupo)
    const myGroupLink = isBotAdmin ? await getInvite(conn, m.chat) : null;
    const isAllowed = containsLink.some(link => 
      (myGroupLink && link.includes(myGroupLink)) || 
      link.includes('youtube.com/') || 
      link.includes('youtu.be/')
    );

    if (isAllowed) return true;

    // --- ACCIÓN DE ERIS-MD ---
    
    // 1. Si no es admin, Eris solo se burla
    if (!isBotAdmin) {
      return conn.sendMessage(m.chat, { 
        text: `> ⊰🦈⊱ Detecté un enlace de ${user}.\n\n➥ Lástima que no soy admin para borrar esta basura y echarte.`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    // 2. Si el Owner desactivó 'restrict'
    if (!bot.restrict) {
      return conn.sendMessage(m.chat, { 
        text: `> ⊰🦈⊱ *ALERTA*\n\nEl enlace de ${user} está prohibido, pero mi Creador tiene mi sistema de expulsión desactivado (*restrict*).`,
        mentions: [m.sender]
      }, { quoted: m });
    }

    // 3. BORRADO INMEDIATO
    await conn.sendMessage(m.chat, {
      delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
    });

    // 4. AVISO Y EXPULSIÓN
    let aviso = `> ⊰🦈⊱ *ANTI-LINK 2.0*\n\n${user} mandaste un enlace no permitido.\n➥ A la calle por gracioso. 🗑️`;
    await conn.sendMessage(m.chat, { text: aviso, mentions: [m.sender] });

    try {
      await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
    } catch (e) {
      console.error('Error en AntiLink2:', e);
    }
  }

  return true;
}
