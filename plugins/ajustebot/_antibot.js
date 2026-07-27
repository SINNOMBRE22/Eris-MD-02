export async function before(m, { conn, isBotAdmin }) {
    if (!m.isGroup) return;
    let chat = global.db.data.chats[m.chat];
    let bot = global.db.data.settings[this.user.jid] || {};

    if (m.fromMe) return true;

    if (m.id.startsWith('3EB0') && m.id.length === 22) {
        if (chat.antiBot) {
            // Tu mensaje exacto restaurado
            await conn.reply(m.chat, `     ͞ ͟͞ ͟${packname}͟͞ ͟ ͟͞ ͞   \n╚▭࣪▬ִ▭࣪▬ִ▭࣪▬ִ▭࣪▬ִ▭࣪▬ִ▭࣪▬▭╝\n\n𝑆𝑜𝑦 ${botname} 𝑙𝑎 𝑚𝑒𝑗𝑜𝑟 𝑏𝑜𝑡 𝑑𝑒 𝑾𝒉𝒂𝒕𝒔𝑨𝒑𝒑!!\n𝐸𝑠𝑡𝑒 𝑔𝑟𝑢𝑝𝑜 𝑛𝑜 𝑡𝑒 𝑛𝑒𝑐𝑒𝑠𝑖𝑡𝑎, 𝑎𝑑𝑖𝑜𝑠𝑖𝑡𝑜 𝑏𝑜𝑡 𝑑𝑒 𝑠𝑒𝑔𝑢𝑛𝑑𝑎.`, m);

            if (isBotAdmin) {
                // Eliminar el mensaje del bot intruso
                await conn.sendMessage(m.chat, { 
                    delete: { 
                        remoteJid: m.chat, 
                        fromMe: false, 
                        id: m.key.id, 
                        participant: m.key.participant 
                    } 
                });
                
                // Expulsar al bot intruso
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            }
        }
    }
    return true;
}
