/* 🦈 CONFIGURACIÓN DE FUNCIONES - ERIS-MD MASTER SYSTEM 🦈 */

import { createHash } from 'crypto';  
import fetch from 'node-fetch';

const handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  let chat = global.db.data.chats[m.chat];
  let user = global.db.data.users[m.sender];
  let bot = global.db.data.settings[conn.user.jid] || {};
  
  let type = '';
  let isAll = false, isUser = false;
  let isEnable;
  let isSame = false;

  const cmd = command.toLowerCase();
  const encender = ['on', 'enable', 'activar'].includes(cmd);
  const apagar = ['off', 'disable', 'desactivar'].includes(cmd);

  if (encender) {
    isEnable = true;
    type = args[0] ? args[0].toLowerCase() : '';
  } else if (apagar) {
    isEnable = false;
    type = args[0] ? args[0].toLowerCase() : '';
  } else {
    type = cmd;
    let arg = args[0] ? args[0].toLowerCase() : '';
    if (['on', 'enable', 'activar'].includes(arg)) {
      isEnable = true;
    } else if (['off', 'disable', 'desactivar'].includes(arg)) {
      isEnable = false;
    } else {
      const estado = chat[type] ? '✓ Activado' : '✗ Desactivado';
      return conn.reply(m.chat, `「✦」Un Administrador Puede Activar O Desactivar El Comando *${type.toUpperCase()}* Utilizando:\n\n> ✐ *${usedPrefix}activar ${type}*\n> ✐ *${usedPrefix}desactivar ${type}*\n\n✧ Estado Actual » *${estado}*`, m);
    }
  }

  if (!type) return conn.reply(m.chat, `「✦」Falta la función. Ejemplo: *${usedPrefix}activar antibot*`, m);

  switch (type) {
    case 'welcome':
    case 'bv':
    case 'bienvenida':
      if (!m.isGroup) {
        if (!isOwner) { global.dfail('group', m, conn); throw false; }
      } else if (!isAdmin) {
        global.dfail('admin', m, conn); throw false;
      }
      if (chat.welcome === isEnable) isSame = true; else chat.welcome = isEnable;
      break;

    case 'antiprivado':
    case 'antipriv':
    case 'antiprivate':
      isAll = true;
      if (!isOwner) { global.dfail('rowner', m, conn); throw false; }
      if (bot.antiPrivate === isEnable) isSame = true; else bot.antiPrivate = isEnable;
      break;

    case 'restrict':
    case 'restringir':
      isAll = true;
      if (!isOwner) { global.dfail('rowner', m, conn); throw false; }
      if (bot.restrict === isEnable) isSame = true; else bot.restrict = isEnable;
      break;

    case 'autolevelup':
    case 'autonivel':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.autolevelup === isEnable) isSame = true; else chat.autolevelup = isEnable;
      break;

    case 'autosticker':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.autosticker === isEnable) isSame = true; else chat.autosticker = isEnable;
      break;

    case 'antibot':
    case 'antibots':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiBot === isEnable) isSame = true; else chat.antiBot = isEnable;
      break;

    case 'autoaceptar':
    case 'aceptarauto':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.autoAceptar === isEnable) isSame = true; else chat.autoAceptar = isEnable;
      break;

    case 'autorechazar':
    case 'rechazarauto':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.autoRechazar === isEnable) isSame = true; else chat.autoRechazar = isEnable;
      break;

    case 'autoresponder':
    case 'autorespond':
      if (!m.isGroup && !isOwner) { global.dfail('group', m, conn); throw false; }
      else if (m.isGroup && !isAdmin) { global.dfail('admin', m, conn); throw false; }
      if (chat.autoresponder === isEnable) isSame = true; else chat.autoresponder = isEnable;
      break;

    case 'antisubbots':
    case 'antisub':
    case 'antisubot':
    case 'antibot2':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiBot2 === isEnable) isSame = true; else chat.antiBot2 = isEnable;
      break;

    case 'modoadmin':
    case 'soloadmin':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.modoadmin === isEnable) isSame = true; else chat.modoadmin = isEnable;
      break;

    case 'autoread':
    case 'autoleer':
      isAll = true;
      if (!isROwner) { global.dfail('rowner', m, conn); throw false; }
      if (global.opts['autoread'] === isEnable) isSame = true; else global.opts['autoread'] = isEnable;
      break;

    case 'antiver':
    case 'antiocultar':
    case 'antiviewonce':
      if (m.isGroup && !isAdmin) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiver === isEnable) isSame = true; else chat.antiver = isEnable;
      break;

    case 'reaction':
    case 'reaccion':
      if (m.isGroup && !isAdmin) { global.dfail('admin', m, conn); throw false; }
      if (chat.reaction === isEnable) isSame = true; else chat.reaction = isEnable;
      break;

    case 'nsfw':
    case 'nsfwhot':
      if (m.isGroup && !isAdmin) { global.dfail('admin', m, conn); throw false; }
      if (chat.nsfw === isEnable) isSame = true; else chat.nsfw = isEnable;
      break;

    case 'antispam':
      isAll = true;
      if (!isOwner) { global.dfail('rowner', m, conn); throw false; }
      if (bot.antiSpam === isEnable) isSame = true; else bot.antiSpam = isEnable;
      break;

    case 'antidelete': 
    case 'antieliminar':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.delete === isEnable) isSame = true; else chat.delete = isEnable;
      break;

    case 'detect':
    case 'avisos':
      if (m.isGroup && !isAdmin) { global.dfail('admin', m, conn); throw false; }
      if (chat.detect === isEnable) isSame = true; else chat.detect = isEnable;
      break;

    case 'antilink':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiLink === isEnable) isSame = true; else chat.antiLink = isEnable;
      break;

    case 'antilink2':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiLink2 === isEnable) isSame = true; else chat.antiLink2 = isEnable;
      break;

    case 'antitoxic': 
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antitoxic === isEnable) isSame = true; else chat.antitoxic = isEnable;
      break;

    case 'antitraba':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiTraba === isEnable) isSame = true; else chat.antiTraba = isEnable;
      break;

    case 'antifake': 
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
        if (chat.antifake === isEnable) isSame = true; else chat.antifake = isEnable;
      } else {
        if (!isOwner) { global.dfail('rowner', m, conn); throw false; }
        if (bot.antifakePriv === isEnable) isSame = true; else bot.antifakePriv = isEnable;
      }
      break;

    case 'audios':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.audios === isEnable) isSame = true; else chat.audios = isEnable;
      break;

    // ── ANTI-NSFW ────────────────────────────────────────────────────────────
    case 'antinsfw':
    case 'antinsf':
    case 'nsfwdetect':
      if (m.isGroup && !(isAdmin || isOwner)) { global.dfail('admin', m, conn); throw false; }
      if (chat.antiNsfw === isEnable) isSame = true; else chat.antiNsfw = isEnable;
      break;

    default:
      if (!/[01]/.test(command)) return conn.reply(m.chat, `「✦」La Función *${type}* No Existe En La Lista.`, m);
      throw false;
  }

  // ── GUARDAR EN DISCO ──────────────────────────────────────────────────────
// ── GUARDAR EN DISCO ──────────────────────────────────────────────────────
global.db.write()
  // --- RESPUESTA FINAL ---
  let mensajeFinal = '';
  if (isSame) {
    mensajeFinal = `《✦》La Función *${type.toUpperCase()}* Ya Estaba *${isEnable ? 'Activada' : 'Desactivada'}* ${isAll ? 'Para Este Bot' : isUser ? '' : 'Para Este Chat'}`;
  } else {
    mensajeFinal = `《✦》La Función *${type.toUpperCase()}* Se *${isEnable ? 'Activó' : 'Desactivó'}* ${isAll ? 'Para Este Bot' : isUser ? '' : 'Para Este Chat'}`;
  }
  
  conn.reply(m.chat, mensajeFinal, m);
};

handler.command = /^(on|off|enable|disable|activar|desactivar|welcome|bv|bienvenida|antiprivado|antipriv|antiprivate|restrict|restringir|autolevelup|autonivel|autosticker|antibot|antibots|autoaceptar|aceptarauto|autorechazar|rechazarauto|autoresponder|autorespond|antisubbots|antisub|antisubot|antibot2|modoadmin|soloadmin|autoread|autoleer|autover|antiver|antiocultar|antiviewonce|reaction|reaccion|emojis|nsfw|nsfwhot|nsfwhorny|antispam|antiSpam|antispamosos|antidelete|antieliminar|jadibotmd|modejadibot|subbots|detect|configuraciones|avisodegp|detect2|avisos|eventos|autosimi|simsimi|antilink|antilink2|antitoxic|antitoxicos|antitraba|antitrabas|antifake|antivirtuales|audios|antinsfw|antinsf|nsfwdetect)$/i

export default handler;
