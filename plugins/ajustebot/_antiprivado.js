/* 🦈 ANTI-PRIVADO - ERIS-MD SYSTEM (RUTHLESS EDITION) 🦈 */

export async function before(m, { conn, isOwner, isROwner }) {
  if (m.isBaileys && m.fromMe) return true;
  if (m.isGroup) return false;
  if (!m.message) return true;

  // --- EXCEPCIONES ---
  // No bloquear si el mensaje contiene estas palabras clave (Juegos o Subbots)
  const excepciones = ['PIEDRA', 'PAPEL', 'TIJERA', 'serbot', 'jadibot', 'subbot', 'estado', 'deletestatus'];
  if (excepciones.some(word => m.text?.includes(word))) return true;

  // No bloquear Newsletters (Canales)
  if (m.chat === '120363407502496951@newsletter') return true;

  const bot = global.db.data.settings[conn.user.jid] || {};
  
  // --- LÓGICA DE BLOQUEO ---
  if (bot.antiPrivate && !isOwner && !isROwner) {
    const user = `@${m.sender.split('@')[0]}`;
    const grupoOficial = 'https://chat.whatsapp.com/DC71u9zXq6SCjvdNCRGFOs?mode=gi_t'; // Ajusta con tu link real

    let aviso = `> ⊰🌸⊱ *PRIVADO DESACTIVADO*\n\nHola ${user}, mi Creador ha desactivado mi uso en chats privados.\n\n➥ **Razón:** Evitar saturación.\n➥ **Acción:** Bloqueo automático.\n\nSi quieres usar mis funciones, únete a mi grupo oficial:\n${grupoOficial}`;

    await conn.sendMessage(m.chat, { text: aviso, mentions: [m.sender] }, { quoted: m });
    
    // Un pequeño retraso antes de bloquear para que alcance a leer el mensaje
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await conn.updateBlockStatus(m.sender, 'block');
  }
  
  return false;
}
