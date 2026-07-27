/* 🌸 ANTI-SPAM - ERIS-MD SYSTEM (CLEAN NAME EDITION) 🌸 */

const userSpamData = {}

const handler = m => m

handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner, isROwner, isPrems }) {
  const bot = global.db.data.settings?.[conn.user.jid] || {}
  const chat = global.db.data.chats?.[m.chat] || {}
  
  if (!bot.antiSpam) return
  if (m.isGroup && chat.modoadmin) return 
  
  if (isOwner || isROwner || isAdmin || isPrems || m.fromMe) return

  let user = global.db.data.users[m.sender]
  const sender = m.sender
  const currentTime = new Date().getTime()
  const timeWindow = 5000 
  const messageLimit = 10 

  const times = [30000, 60000, 120000]

  if (!(sender in userSpamData)) {
    userSpamData[sender] = {
      lastMessageTime: currentTime,
      messageCount: 1, 
      antiBan: 0, 
      message: 0,
      message2: 0,
      message3: 0,
    }
  } else {
    const userData = userSpamData[sender]
    const timeDifference = currentTime - userData.lastMessageTime
    
    // Obtenemos el nombre limpio (el que el usuario tiene en su perfil)
    const name = conn.getName(sender)

    // --- ACCIONES POR REINCIDENCIA ---
    if (userData.antiBan === 1 && userData.message < 1) {
      userData.message++
      await conn.reply(m.chat, `> ⊰🌸⊱ *ADVERTENCIA 1*\n\n${name} no hagas spam, primer aviso.`, m, { mentions: [sender] })
    } else if (userData.antiBan === 2 && userData.message2 < 1) {
      userData.message2++
      await conn.reply(m.chat, `> ⊰🌸⊱ *ADVERTENCIA 2*\n\n${name} detén el spam o serás eliminado.`, m, { mentions: [sender] })
    } else if (userData.antiBan === 3 && userData.message3 < 1) {
      userData.message3++
      await conn.reply(m.chat, `> ⊰🌸⊱ *ELIMINACIÓN*\n\n${name} fue advertido. Adiós basura espacial. 🗑️`, m, { mentions: [sender] })
      if (isBotAdmin) await conn.groupParticipantsUpdate(m.chat, [sender], 'remove')
    }

    if (timeDifference <= timeWindow) {
      userData.messageCount += 1

      if (userData.messageCount >= messageLimit) {
        if (userData.antiBan >= 3) return
        
        userData.antiBan++
        userData.messageCount = 1
        user.banned = true 
        
        const currentBanTime = times[userData.antiBan - 1]
        
        await conn.sendMessage(m.chat, {
          text: `> ⊰🌸⊱ *DETECCIÓN DE SPAM*\n\nUsuario: ${name}\nAcción: Baneo temporal de ${currentBanTime / 1000}s.`,
          mentions: [sender],
          contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363407502496951@newsletter',
              newsletterName: '✨ Eris-MD Oficial'
            }
          }
        }, { quoted: m })

        setTimeout(() => {
          user.banned = false
          if (userData.antiBan === 3) {
            delete userSpamData[sender]
          }
        }, currentBanTime)
      }
    } else {
      if (timeDifference >= 2000) {
        userData.messageCount = 1
      }
    }
    userData.lastMessageTime = currentTime
  }
}

export default handler
