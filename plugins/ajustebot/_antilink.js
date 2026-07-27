/* 🦈 ANTI-LINK - ERIS-MD SYSTEM (RUTHLESS EDITION) 🦈 */

let linkRegex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
let linkRegex1 = /whatsapp\.com\/channel\/([0-9A-Za-z]{20,24})/i;

// Caché de invitaciones para no saturar los servidores de WhatsApp
let cachedGroupLinks = {};

async function getCachedGroupInviteCode(conn, chatId) {
  if (cachedGroupLinks[chatId]) return cachedGroupLinks[chatId];
  try {
    const code = await conn.groupInviteCode(chatId);
    const fullLink = `https://chat.whatsapp.com/${code}`;
    cachedGroupLinks[chatId] = fullLink;
    // El caché dura 10 minutos
    setTimeout(() => delete cachedGroupLinks[chatId], 10 * 60 * 1000);
    return fullLink;
  } catch (e) {
    return null; // Si Eris no es admin, no podrá ver el enlace
  }
}

export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, participants }) {
  // Ignorar si no es grupo o si el mensaje no tiene texto (ej. un sticker)
  if (!m.isGroup || !m.text) return;

  let chat = global.db.data.chats[m.chat];
  if (!chat?.antiLink) return;

  // Los Admins, Creadores y el propio Bot son inmunes al Anti-Link
  if (isAdmin || isOwner || m.fromMe || isROwner) return;

  // Detectar si el texto contiene enlaces de grupos o canales
  const isGroupLink = linkRegex.test(m.text) || linkRegex1.test(m.text);

  if (isGroupLink) {
    try {
      const user = `@${m.sender.split('@')[0]}`;
      const groupAdmins = participants.filter(p => p.admin);

      // Si Eris es admin, comprobamos si el link es el de ESTE mismo grupo
      if (isBotAdmin) {
        const currentGroupLink = await getCachedGroupInviteCode(conn, m.chat);
        if (currentGroupLink && m.text.includes(currentGroupLink)) return; // Se perdona si es el link local
      }

      // Si Eris NO es admin, no puede borrar ni expulsar, solo se queja
      if (!isBotAdmin) {
        let queja = `> ⊰🦈⊱ ¡Ey! Detecté un enlace de ${user}.\n\n➥ Qué lástima que no soy administradora para borrarlo y sacarlo a patadas. Háganme admin si quieren que trabaje.`;
        return conn.sendMessage(m.chat, { text: queja, mentions: [m.sender, ...groupAdmins.map(v => v.id)] }, { quoted: m });
      }

      // 1. ELIMINAR EL MENSAJE INMEDIATAMENTE
      await conn.sendMessage(m.chat, {
        delete: { remoteJid: m.chat, fromMe: false, id: m.key.id, participant: m.sender }
      });

      // 2. ENVIAR AVISO SARCÁSTICO
      let aviso = `> ⊰🌸⊱ *ENLACE DETECTADO*\n\nUy, ${user} rompió las reglas mandando links externos.\n➥ Hora de sacar la basura. 🗑️`;
      await conn.sendMessage(m.chat, { text: aviso, mentions: [m.sender] });

      // 3. EXPULSAR AL INFRACTOR
      const res = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
      if (res[0]?.status === "404") return; // Si el usuario se salió corriendo antes de que lo echen

    } catch (e) {
      console.error('❌ Error en Anti-Link Eris-MD:', e);
    }
  }

  return true;
}
