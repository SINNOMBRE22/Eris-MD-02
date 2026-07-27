/* 🦈 MENÚ DE CONFIGURACIÓN - ERIS-MD SYSTEM 🦈 */

import { readFileSync } from 'fs'
import { join } from 'path'

const handler = async (m, { conn }) => {
  let localThumb;
  try {
    localThumb = readFileSync(join(process.cwd(), 'src', 'imagenes', 'perfil2.jpeg'));
  } catch (e) {
    localThumb = { url: 'https://tinyurl.com/SinNombre-chan' };
  }

  const chat = global.db.data.chats[m.chat];
  if (!chat) return; 

  const { welcome, autolevelup, antiBot, antiBot2, autoAceptar, autoRechazar, autoresponder, modoadmin, reaction, nsfw, detect, antiLink, antiLink2, antitoxic, antiTraba, antifake, antiNsfw } = chat;

  const text = `✨ *Configuración Del Grupo* 
◈ Bienvenida: \`${welcome ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Activa O Desactiva El Mensaje De Bienvenida.

◈ Antibot: \`${antiBot ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Expulsa Otros Bots No Autorizados Del Grupo.

◈ Antisubbots: \`${antiBot2 ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Expulsa Subbots No Autorizados Del Grupo.

◈ Autoaceptar: \`${autoAceptar ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Acepta Automáticamente Solicitudes De Ingreso.

◈ Autorechazar: \`${autoRechazar ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Rechaza Automáticamente Solicitudes De Ingreso.

◈ Autoresponder: \`${autoresponder ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Activa Respuestas Automáticas Usando Gemini IA.

◈ Modoadmin: \`${modoadmin ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* El Bot Solo Responderá A Los Administradores.

◈ Reacción: \`${reaction ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Activa O Desactiva Las Reacciones Del Bot.

◈ Nsfw: \`${nsfw ? 'Activado' : 'Desactivado'}\` 
> ➨ *Descripción:* Activa O Desactiva Los Comandos Adultos (+18).

◈ Detect: \`${detect ? 'Activado' : 'Desactivado'}\` 
> ➨ *Descripción:* Notifica Los Cambios Realizados En El Grupo.

◈ Antilink: \`${antiLink ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Bloquea Enlaces Directos De WhatsApp. 

◈ Antilink2: \`${antiLink2 ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Bloquea Enlaces Externos (HTTPS). 

◈ Antitoxic: \`${antitoxic ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Elimina Mensajes Con Contenido Ofensivo.

◈ Antitraba: \`${antiTraba ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Evita El Colapso Del Chat Por Mensajes Largos.

◈ Antifake: \`${antifake ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Bloquea Números Falsos O Extranjeros.

◈ Anti-Nsfw: \`${antiNsfw ? 'Activado' : 'Desactivado'}\`
> ➨ *Descripción:* Detecta Y Elimina Imágenes Explícitas, Expulsando Al Infractor.

_*✦ Nota: Puedes Activar Una Opción Usando: .activar <función> (Ejemplo: .activar bienvenida)*_`.trim();

  await conn.sendMessage(m.chat, {
    text: text,
    contextInfo: {
      externalAdReply: {
        title: 'Eris-MD | Shark Service',
        body: 'Configuración De Funciones',
        thumbnail: localThumb,
        mediaType: 1,
        showAdAttribution: true,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m });
};

handler.help = ['config'];
handler.tags = ['grupos'];
handler.command = ['config', 'opciones', 'configuracion'];
handler.group = true;

export default handler;
