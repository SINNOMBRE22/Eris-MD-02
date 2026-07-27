/* ✦ BIENVENIDA Y DESPEDIDA - ERIS-MD SYSTEM ✦ */

import { WAMessageStubType } from '@whiskeysockets/baileys'
import { readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { exec } from 'child_process'

const BASE_PATH = process.cwd();
const IMAGE_WELCOME = join(BASE_PATH, 'src', 'imagenes', 'perfil2.jpeg');
const IMAGE_LEAVE_THUMB = join(BASE_PATH, 'src', 'imagenes', 'despedida.jpeg');
const AUDIO_MP3 = join(BASE_PATH, 'src', 'audio', 'despedida.mp3');
const AUDIO_OGG = join(BASE_PATH, 'src', 'audio', 'temp_despedida.ogg');

export async function before(m, { conn, participants, groupMetadata }) {
    if (!m.messageStubType || !m.isGroup) return true;

    let chat = global.db.data.chats[m.chat];
    if (!chat?.welcome) return true;

    // 1. JID crudo
    let rawId = m.messageStubParameters?.[0] || m.sender;
    if (!rawId) return true;

    // 2. Limpiar puerto del JID
    let jid = rawId;
    if (jid.includes(':') && jid.includes('@')) {
        const [numPart, domain] = jid.split('@');
        jid = numPart.split(':')[0] + '@' + domain;
    } else if (jid.includes(':')) {
        jid = jid.split(':')[0] + '@s.whatsapp.net';
    } else if (!jid.includes('@')) {
        jid = jid + '@s.whatsapp.net';
    }

    const userNumber = jid.split('@')[0];
    const groupName = groupMetadata.subject;
    const groupSize = participants.length;

    // ==========================================================
    // EVENTO: BIENVENIDA
    // ==========================================================
    const welcomeStubs = [WAMessageStubType.GROUP_PARTICIPANT_ADD, 27, 31];
    if (welcomeStubs.includes(m.messageStubType)) {

        let imgBuffer;
        try { imgBuffer = readFileSync(IMAGE_WELCOME); } catch { imgBuffer = Buffer.alloc(0); }

        let welcomeText;
        if (chat.welcomeMsg) {
            welcomeText = chat.welcomeMsg
                .replace(/@user/gi, `@${userNumber}`)
                .replace(/@nombre/gi, `@${userNumber}`)
                .replace(/@grupo/gi, groupName)
                .replace(/@miembros/gi, groupSize);
        } else {
            welcomeText = `> ꒰✦꒱ ¡Bienvenido/a al grupo, @${userNumber}!\n\nEsperamos que te sientas cómodo/a aquí. Recuerda respetar las reglas del grupo.\n\n∫ 👥 *Miembros:* ${groupSize}\n∫ 🏷️ *Grupo:* ${groupName}\n\n> ꒰💡꒱ ¿Necesitas ayuda? Usa *.help*`;
        }

        await conn.sendMessage(m.chat, {
            text: welcomeText,
            mentions: [jid],
            contextInfo: {
                mentionedJid: [jid],
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363407502496951@newsletter',
                    newsletterName: '✨ Eris-MD Oficial'
                },
                externalAdReply: {
                    title: `✦ ¡Bienvenido/a a ${groupName}!`,
                    body: " ",
                    thumbnail: imgBuffer,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        });
        return true;
    }

    // ==========================================================
    // EVENTO: DESPEDIDA
    // ==========================================================
    const leaveStubs = [WAMessageStubType.GROUP_PARTICIPANT_LEAVE, WAMessageStubType.GROUP_PARTICIPANT_REMOVE, 28, 32];
    if (leaveStubs.includes(m.messageStubType)) {

        let byeText;
        if (chat.byeMsg) {
            byeText = chat.byeMsg
                .replace(/@user/gi, `@${userNumber}`)
                .replace(/@nombre/gi, `@${userNumber}`)
                .replace(/@grupo/gi, groupName)
                .replace(/@miembros/gi, groupSize);
        } else {
            byeText = `> ꒰✦꒱ @${userNumber} ha salido del grupo.\n\nFue un gusto tenerte aquí. ¡Hasta la próxima!\n\n∫ 👥 *Miembros restantes:* ${groupSize}`;
        }

        await conn.sendMessage(m.chat, {
            text: byeText,
            mentions: [jid],
            contextInfo: { mentionedJid: [jid] }
        });

        if (existsSync(AUDIO_MP3)) {
            try {
                await new Promise((resolve, reject) => {
                    exec(`ffmpeg -y -i "${AUDIO_MP3}" -c:a libopus "${AUDIO_OGG}"`, (error) => {
                        if (error) reject(error); else resolve();
                    });
                });

                let thumbBuffer;
                try { thumbBuffer = readFileSync(IMAGE_LEAVE_THUMB); } catch { thumbBuffer = Buffer.alloc(0); }
                const audioBuffer = readFileSync(AUDIO_OGG);

                await conn.sendMessage(m.chat, {
                    audio: audioBuffer,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt: true,
                    contextInfo: {
                        mentionedJid: [jid],
                        externalAdReply: {
                            title: '✦ Despedida | Eris-MD',
                            body: ' ',
                            thumbnail: thumbBuffer,
                            mediaType: 1,
                            renderLargerThumbnail: false,
                            showAdAttribution: true
                        }
                    }
                });

                if (existsSync(AUDIO_OGG)) unlinkSync(AUDIO_OGG);
            } catch (e) {
                console.error('❌ Error en despedida Eris-MD:', e);
            }
        }
        return true;
    }

    return true;
}
