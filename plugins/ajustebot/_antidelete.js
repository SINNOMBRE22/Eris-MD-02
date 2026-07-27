/* 🦈 ANTI-DELETE - ERIS-MD SYSTEM (IMPROVED EDITION) 🦈 */

import { getContentType, generateForwardMessageContent, generateWAMessageFromContent } from '@whiskeysockets/baileys';

// Inicializamos la bóveda si no existe
global.delete = global.delete || [];

export async function before(m, { conn, isAdmin }) {
    if (!m.isGroup) return;
    if (isAdmin) return; // Admins son inmunes
    if (m.key.fromMe) return; // El bot se ignora a sí mismo

    let chat = global.db.data.chats[m.chat];
    if (!chat?.delete) return; // Obedece a: .activar antieliminar

    // 🚀 MEJORA 1: En lugar de borrar toda la lista de golpe y perder mensajes recientes, 
    // solo eliminamos el mensaje MÁS VIEJO. Así siempre hay 500 mensajes respaldados.
    if (global.delete.length > 500) global.delete.shift();

    // Guardar Mensajes En Memoria (Ignoramos mensajes técnicos invisibles)
    if (m.type !== 'protocolMessage' && m.key && m.message) {
        global.delete.push({ 
            key: m.key, 
            message: m.message,
            timestamp: new Date() // Guardamos la hora de envío
        });
    }

    // 🚀 MEJORA 2: Aseguramos que el protocolMessage sea específicamente de tipo 0 (Eliminación)
    if (m.message && m.message.protocolMessage && m.message.protocolMessage.type === 0) {
        let keyId = m.message.protocolMessage.key.id;
        let msgIndex = global.delete.findIndex((index) => index.key.id === keyId);

        if (msgIndex !== -1) {
            let msg = global.delete[msgIndex];
            
            // 🚀 MEJORA 3: Bloque try-catch. Si hay un error al recuperar (ej. una encuesta), el bot no se apaga.
            try {
                const time = msg.timestamp.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const user = msg.key.participant || m.sender;
                const mention = `@${user.split('@')[0]}`;

                // Texto Estilizado Con Info Del Usuario
                let aviso = `> ⊰🦈⊱ ¡Aja! ${mention} intentó borrar un mensaje.\n\n⌚ *Hora de envío:* ${time}\n➥ *Eris-MD* lo recuperó con éxito.`.trim();

                // 🚀 MEJORA 4: Enviamos el aviso etiquetando correctamente para que le llegue la notificación
                await conn.sendMessage(m.chat, { text: aviso, mentions: [user] });

                // Reenviamos el contenido original
                await sendMessageForward(msg, {
                    client: conn,
                    from: m.chat
                });

            } catch (e) {
                console.log('Error al recuperar mensaje eliminado en Eris-MD:', e);
            } finally {
                // Limpiamos el mensaje de la memoria para no ocupar espacio doble
                global.delete.splice(msgIndex, 1);
            }
        }
    }
}

async function sendMessageForward(msg, { client, from }) {
    try {
        let type = getContentType(msg.message);
        if (!type) return;

        let content = await generateForwardMessageContent(msg, { forwardingScore: 1 });
        let contentType = getContentType(content);

        // Inyectamos la info del canal para que luzca elegante
        content[contentType].contextInfo = {
            ...(msg.message[type]?.contextInfo || {}), // Preserva el contexto original si lo hay
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363407502496951@newsletter',
                newsletterName: '✨ Eris-MD Oficial'
            }
        };

        let waMsg = await generateWAMessageFromContent(from, content, {
            userJid: client.user.id
        });

        return await client.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });
    } catch (error) {
        console.error('Error interno al reenviar mensaje (sendMessageForward):', error);
    }
}
