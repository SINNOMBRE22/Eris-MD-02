/* 🌸 ANTI-TOXIC - ERIS-MD SYSTEM (ULTIMATE FIX) 🌸 */

const toxicRegex = /g0re|g0r3|g.o.r.e|sap0|sap4|malparido|malparida|malparidos|malparidas|m4lp4rid0|m4lp4rido|m4lparido|malp4rido|m4lparid0|malp4rid0|chocha|chup4la|chup4l4|chupalo|chup4lo|chup4l0|chupal0|chupon|chupameesta|sabandija|hijodelagranputa|hijodeputa|hijadeputa|hijadelagranputa|kbron|kbrona|cajetuda|laconchadedios|putita|putito|put1t4|putit4|putit0|put1to|put1ta|pr0stitut4s|pr0stitutas|pr05titutas|pr0stitut45|prostitut45|prostituta5|pr0stitut45|fanax|f4nax|drogas|droga|dr0g4|nepe|p3ne|p3n3|pen3|p.e.n.e|pvt0|pvto|put0|hijodelagransetentamilparesdeputa|Chingadamadre|coño|c0ño|coñ0|c0ñ0|afeminado|drog4|cocaína|marihuana|chocho|chocha|cagon|pedorro|agrandado|agrandada|pedorra|cagona|pinga|joto|sape|mamar|chigadamadre|hijueputa|chupa|caca|bobo|boba|loco|loca|chupapolla|estupido|estupida|estupidos|polla|pollas|idiota|maricon|chucha|verga|vrga|naco|zorra|zorro|zorras|zorros|pito|huevon|huevona|huevones|rctmre|mrd|ctm|csm|cepe|sepe|sepesito|cepecito|cepesito|hldv|ptm|baboso|babosa|babosos|babosas|feo|fea|feos|feas|mamawebos|chupame|bolas|qliao|imbecil|embeciles|kbrones|cabron|capullo|carajo|gore|gorre|gorreo|gordo|gorda|gordos|gordas|sapo|sapa|mierda|cerdo|cerda|puerco|puerca|perra|perro|dumb|fuck|shit|bullshit|cunt|semen|bitch|motherfucker|foker|fucking/i

let handler = m => m

handler.before = async function (m, { conn, isAdmin, isBotAdmin, isOwner }) { 
    if (!m.isGroup || !m.text || m.fromMe) return false

    let chat = global.db.data.chats[m.chat]
    let user = global.db.data.users[m.sender]
    
    // 🌸 CORRECCIÓN AQUÍ: Acepta tanto antiToxic como antitoxic
    let isActivated = chat?.antiToxic || chat?.antitoxic
    if (!isActivated) return false
    
    // Los admins son inmunes (si quieres probar tú, comenta esta línea)
    if (isAdmin || isOwner) return false

    // Detectar toxicidad
    if (toxicRegex.test(m.text)) {
        const isToxic = m.text.match(toxicRegex)
        const word = isToxic[0]
        const name = conn.getName(m.sender)
        
        user.warn = (user.warn || 0) + 1

        if (user.warn < 3) {
            let aviso = `> ⊰🌸⊱ *COMPORTAMIENTO TÓXICO*\n\nHola ${name}, se detectó una palabra prohibida.\n\n➥ **Palabra:** ${word}\n➥ **Advertencia:** ${user.warn}/3\n\nNo seas grosero o serás eliminado.`.trim()
            
            await conn.sendMessage(m.chat, { 
                text: aviso, 
                mentions: [m.sender],
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363407502496951@newsletter',
                        newsletterName: '✨ Eris-MD Oficial'
                    }
                }
            }, { quoted: m })
        } else {
            user.warn = 0
            let expulsión = `> ⊰🌸⊱ *ELIMINACIÓN*\n\nEl usuario ${name} superó el límite de advertencias.\n➥ Adiós basura espacial. 🗑️`.trim()
            
            await conn.sendMessage(m.chat, { text: expulsión, mentions: [m.sender] })
            if (isBotAdmin) {
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
            }
        }
        return true
    }
    return false
}

export default handler
