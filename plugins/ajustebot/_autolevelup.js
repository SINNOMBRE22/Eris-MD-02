/* 🌸 DETECT - ERIS-MD SYSTEM (LID RESOLVER EDITION) 🌸 */

let WAMessageStubType = (await import('@whiskeysockets/baileys')).default

let handler = m => m

handler.before = async function (m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return
    
    let chat = global.db.data.chats[m.chat]
    if (!chat) return

    const erisContext = {
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363407502496951@newsletter',
            newsletterName: '✨ Eris-MD Oficial'
        }
    }

    // 🌸 LÓGICA MAESTRA: Función para resolver cualquier LID a JID real
    const resolveJid = (rawJid) => {
        if (!rawJid) return null;
        const cleanJid = rawJid.split('@')[0];
        const found = participants.find(p => {
            const jN = (p.id || p.jid || '').split('@')[0];
            const lN = (p.lid || '').split('@')[0];
            return jN === cleanJid || lN === cleanJid;
        });
        return found?.id || found?.jid || rawJid; 
    };

    // 1. Identificar al Actor
    let realActor = resolveJid(m.sender);
    let actorName = realActor ? await conn.getName(realActor) : null;
    let txtActor = (actorName && actorName !== 'undefined') ? actorName : (realActor ? `@${realActor.split('@')[0]}` : 'Un administrador');

    // 2. Función rápida para identificar a la Víctima/Target
    const getTargetInfo = async (index = 0) => {
        let rawTarget = m.messageStubParameters[index];
        let realTarget = resolveJid(rawTarget);
        let targetName = realTarget ? await conn.getName(realTarget) : null;
        let txtTarget = (targetName && targetName !== 'undefined') ? targetName : (realTarget ? `@${realTarget.split('@')[0]}` : '');
        return { realTarget, txtTarget };
    };

    try {
        if (chat.detect && m.messageStubType == 21) {
            let nombre = `> ⊰🌸⊱ *ACTUALIZACIÓN DE GRUPO*\n\n➥ *${txtActor}* ha cambiado el nombre del grupo.\n\n> ✧ *Nuevo nombre:*\n> ${m.messageStubParameters[0]}`
            await conn.sendMessage(m.chat, { text: nombre, mentions: [realActor], contextInfo: erisContext })   
        } 
        
        else if (chat.detect && m.messageStubType == 22) {
            let pp = await conn.profilePictureUrl(m.chat, 'image').catch(_ => 'https://files.catbox.moe/xr2m6u.jpg')
            let foto = `> ⊰🌸⊱ *ACTUALIZACIÓN DE GRUPO*\n\n➥ Se ha actualizado la foto del grupo.\n\n> ✧ *Acción por:* ${txtActor}`
            await conn.sendMessage(m.chat, { image: { url: pp }, caption: foto, mentions: [realActor], contextInfo: erisContext })
        } 
        
        else if (chat.detect && m.messageStubType == 23) {
            let newlink = `> ⊰🌸⊱ *ACTUALIZACIÓN DE GRUPO*\n\n➥ El enlace de invitación ha sido restablecido.\n\n> ✧ *Acción por:* ${txtActor}`
            await conn.sendMessage(m.chat, { text: newlink, mentions: [realActor], contextInfo: erisContext })    
        } 
        
        else if (chat.detect && m.messageStubType == 25) {
            let modo = m.messageStubParameters[0] == 'on' ? 'Solo Administradores' : 'Todos los participantes'
            let edit = `> ⊰🌸⊱ *ACTUALIZACIÓN DE GRUPO*\n\n➥ *${txtActor}* ha modificado los ajustes.\n\n> ✧ *¿Quién puede editar info?*\n> ${modo}`
            await conn.sendMessage(m.chat, { text: edit, mentions: [realActor], contextInfo: erisContext })  
        } 
        
        else if (chat.detect && m.messageStubType == 26) {
            let statusMsg = m.messageStubParameters[0] == 'on' ? 'CERRADO (Solo Admins)' : 'ABIERTO (Todos)'
            let status = `> ⊰🌸⊱ *ACTUALIZACIÓN DE GRUPO*\n\n➥ *${txtActor}* ha modificado los permisos.\n\n> ✧ *Estado del grupo:*\n> ${statusMsg}`
            await conn.sendMessage(m.chat, { text: status, mentions: [realActor], contextInfo: erisContext })  
        } 
        
        else if (chat.detect2 && m.messageStubType == 27) {
            let { realTarget, txtTarget } = await getTargetInfo(0);
            let aceptar = `> ⊰🌸⊱ *NUEVO INGRESO*\n\n➥ *${txtTarget}* ha sido añadido al grupo.\n\n> ✧ *Añadido por:* ${txtActor}`
            await conn.sendMessage(m.chat, { text: aceptar, mentions: [realActor, realTarget].filter(Boolean), contextInfo: erisContext })
        } 
        
        else if (chat.detect && m.messageStubType == 29) {
            let { realTarget, txtTarget } = await getTargetInfo(0);
            let admingp = `> ⊰🌸⊱ *NUEVO ADMINISTRADOR*\n\n➥ *${txtTarget}* ahora es administrador.\n\n> ✧ *Promovido por:* ${txtActor}`
            await conn.sendMessage(m.chat, { text: admingp, mentions: [realActor, realTarget].filter(Boolean), contextInfo: erisContext })  
        } 
        
        else if (chat.detect && m.messageStubType == 30) {
            let { realTarget, txtTarget } = await getTargetInfo(0);
            let noadmingp = `> ⊰🌸⊱ *DEGRADACIÓN DE ADMIN*\n\n➥ *${txtTarget}* ha dejado de ser administrador.\n\n> ✧ *Degradado por:* ${txtActor}`
            await conn.sendMessage(m.chat, { text: noadmingp, mentions: [realActor, realTarget].filter(Boolean), contextInfo: erisContext })
        } 
        
        else {
            if (m.messageStubType == 2) return
        }
    } catch (e) {
        console.log('🌸❌ Error en detect:', e)
    }
}

export default handler
