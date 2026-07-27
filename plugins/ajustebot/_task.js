/* 🦈 ERIS-MD DATABASE MANAGER (YOSHY SYSTEM) 🦈 */

import { promises as fs } from 'fs'
import path from 'path'

const charactersFilePath = path.join(process.cwd(), './src/database/characters.json');

// --- CONFIGURACIÓN DE JEFES (SUPER ADMINS) ---
const SUPER_ADMINS = ['525629885039', '18493873691', '16028790660']; 

const newsletterJid = '120363418071540900@newsletter';
const newsletterName = '🦈 Eris-MD — SinNombre Service';

function normalizeName(text) {
    if (!text) return "";
    return text.trim().toLowerCase().replace(/-/g, ' ');
}

let handler = async (m, { conn, args, isOwner, usedPrefix, command }) => {
    const senderNumber = m.sender.split('@')[0];
    const isSuperAdmin = SUPER_ADMINS.includes(senderNumber) || isOwner;

    // 1. Lógica de Confirmación
    if (args[0] === 'confirm_eris') {
        if (!isSuperAdmin) return m.reply('🌸 Tsk. Solo mis jefes reales pueden tocar ese botón.');
        const type = args[1]; 
        const target = args[2]; 
        if (type === 'no') return m.reply('🌸 Lo sabía. Solicitud cancelada. No me vuelvas a despertar.');
        await executeLogic(m, conn, charactersFilePath, type === 'reset', type === 'all', target, []);
        return;
    }

    if (!isSuperAdmin) return m.reply('🌸 (Bostezo)... Solo mi jefe SinNombre puede pedirme estas cosas.');

    let targetJID;
    let characterNames = [];
    let transferAll = false;
    let resetAll = false;

    // 2. Parsing de argumentos
    if (m.quoted) {
        targetJID = m.quoted.sender;
        characterNames = args;
    } else {
        if (args[0]?.toLowerCase() === 'reset') {
            resetAll = true;
        } else {
            if (args.length < 2) return m.reply('🌸 Tsk. Pon el nombre y el número. Qué poca eficiencia...');
            targetJID = args[args.length - 1].includes('@') ? args[args.length - 1] : args[args.length - 1] + '@s.whatsapp.net';
            characterNames = args.slice(0, args.length - 1);
        }
    }

    if (!resetAll && characterNames[0]?.toLowerCase() === 'all') transferAll = true;

    // 3. MODO MASIVO: Alerta de Confirmación
    if (resetAll || transferAll) {
        const actionType = resetAll ? 'RESETEAR TODA LA DB' : 'TRANSFERENCIA MASIVA';
        const typeArg = resetAll ? 'reset' : 'all';

        const caption = `
₊‧꒰ 🦈 ꒱ 𝐄𝐑𝐈𝐒 𝐇𝐎𝐔𝐒𝐄𝐊𝐄𝐄𝐏𝐈𝐍𝐆 — 𝐀𝐋𝐄𝐑𝐓𝐀 ✧˖°

> 🌸 *Acción:* ${actionType}
> 👤 *Solicita:* @${senderNumber}
> 🦈 *Destino:* ${resetAll ? 'LIMPIEZA TOTAL' : '@' + targetJID.split('@')[0]}

*¿Realmente quieres que haga esto? Confirma escribiendo:*
👉 \`${usedPrefix}${command} confirm_eris ${typeArg} ${targetJID || ''}\`
👉 \`${usedPrefix}${command} confirm_eris no\``;

        return conn.reply(m.chat, caption, m, { mentions: [m.sender, targetJID].filter(Boolean) });
    }

    await executeLogic(m, conn, charactersFilePath, false, false, targetJID, characterNames);
}

async function executeLogic(m, conn, pathFile, resetAll, transferAll, targetJID, characterNames) {
    try {
        const data = await fs.readFile(pathFile, 'utf-8');
        let characters = JSON.parse(data);
        let count = 0;

        const normalizedInputNames = characterNames.map(name => normalizeName(name));

        characters = characters.map(char => {
            const charNameInDB = normalizeName(char.name);
            if (resetAll) {
                if (char.user || char.protectionUntil) {
                    char.user = "";
                    char.status = "Libre";
                    char.protectionUntil = 0;
                    count++;
                }
            } else if (transferAll || normalizedInputNames.includes(charNameInDB)) {
                if (char.user !== targetJID) {
                    char.user = targetJID;
                    char.status = 'Reclamado';
                    count++;
                }
            }
            return char;
        });

        if (count > 0) {
            await fs.writeFile(pathFile, JSON.stringify(characters, null, 2));
        } else {
            return m.reply('🌸 Oye... No encontré personajes con esos nombres o ya los tiene ese usuario.');
        }

        const resMsg = resetAll 
            ? `🌸 (Bostezo)... Turno terminado. He liberado a ${count} personajes de la DB.`
            : `🌸 Ya está. Se transfirieron ${count} personajes a su nuevo dueño.`;

        return conn.reply(m.chat, resMsg, m, {
            contextInfo: {
                mentionedJid: [targetJID].filter(Boolean),
                forwardedNewsletterMessageInfo: { newsletterJid, newsletterName, serverMessageId: -1 }
            }
        });
    } catch (e) {
        return m.reply('🌸 Tsk. Error al leer la base de datos de personajes.');
    }
}

handler.command = ['yoshy', 'erisadmin'];
handler.rowner = true; 
export default handler;
