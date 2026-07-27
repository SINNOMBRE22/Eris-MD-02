/* 🦈 ANTI-FAKE - ERIS-MD SYSTEM (IMPROVED EDITION) 🦈 */

export async function before(m, { conn, isBotAdmin, isOwner }) {
  if (!m.sender) return;
  // 🚀 MEJORA 1: Inmunidad. El bot y el Creador (Tú) jamás serán expulsados.
  if (m.fromMe || isOwner) return; 

  const botJid = conn.user.jid;
  const sender = m.sender;
  const chatId = m.chat;
  const isPrivate = !m.isGroup;
  const numero = sender.split('@')[0];

  // Prefijos bloqueados organizados
  const prefijosBloqueados = [
    // Varios / Virtuales comunes
    '90', '92', '93', '94', '91', '49', '48', '7',
    // Países Árabes / África
    '966', '971', '20', '212', '213', '216', '218', '249',
    '967', '963', '964', '962', '961', '970', '974',
    '973', '968', '965', '222', '252'
  ];

  // 🚀 MEJORA 2: Búsqueda eficiente. Encuentra el prefijo exacto que causó la alerta.
  const prefijoDetectado = prefijosBloqueados.find(p => numero.startsWith(p));
  
  // Si el número es normal, detenemos el código aquí para ahorrar recursos
  if (!prefijoDetectado) return true; 

  // Aseguramos que la base de datos del usuario exista para evitar crasheos
  global.db.data.settings[botJid] = global.db.data.settings[botJid] || {};
  global.db.data.users[sender] = global.db.data.users[sender] || {};

  // --- LÓGICA PARA GRUPOS ---
  if (!isPrivate) {
    let chat = global.db.data.chats[chatId] || {};
    
    if (chat.antifake && isBotAdmin) {
      global.db.data.users[sender].block = true; // Lo marca en la base de datos
      
      // 🚀 MEJORA 3: Mensaje al estilo Eris-MD
      let aviso = `> ⊰🌸⊱ *ALERTA ANTI-FAKE*\n\nSe detectó un número con prefijo dudoso (+${prefijoDetectado}).\n➥ Adiós basura espacial. 🗑️`;
      
      // Avisa al grupo y luego lo expulsa
      await conn.sendMessage(chatId, { text: aviso, mentions: [sender] });
      await conn.groupParticipantsUpdate(chatId, [sender], 'remove');
    }
  } 
  // --- LÓGICA PARA PRIVADO ---
  else {
    let antifakePriv = global.db.data.settings[botJid].antifakePriv;
    
    if (antifakePriv) {
      global.db.data.users[sender].block = true;
      
      let avisoPriv = `> ⊰🌸⊱ *ALERTA ANTI-FAKE*\n\nTu prefijo (+${prefijoDetectado}) no es bienvenido en mi chat privado.\n➥ Bloqueo inminente.`;
      
      try {
        await conn.sendMessage(sender, { text: avisoPriv });
      } catch (e) {
        console.log('No se pudo avisar al fake en privado, procediendo al bloqueo silencioso.');
      }
      
      // Bloquea al usuario nativamente en WhatsApp
      await conn.updateBlockStatus(sender, 'block');
      // Limpia el chat para no dejar basura
      await conn.chatModify({ clear: { messages: [{ id: m.key.id }] } }, sender);
    }
  }
}
