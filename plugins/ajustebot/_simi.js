/* 🦈 ERIS-MD SIMI-AUTOCHAT SYSTEM 🦈 */

import translate from '@vitalets/google-translate-api';
import axios from 'axios';

const handler = (m) => m;

handler.before = async function (m, { conn }) {
  const chat = global.db.data.chats[m.chat];
  
  // 1. Filtros de activación
  if (!chat?.simi || m.fromMe || m.isBaileys) return true;
  if (!m.text) return true;

  // 2. Filtro de Comandos (Para que Simi no responda cuando pides el menú o música)
  // He añadido expresiones regulares para que sea más limpio
  const regexComandos = /^(serbot|bots|jadibot|menu|play|tiktok|facebook|estado|ping|sticker|s|wm|qc|ai|eris)/i;
  if (regexComandos.test(m.text)) return true;

  // 3. Ignorar si el mensaje empieza con prefijos de comandos
  if (/^[./!#>$]/.test(m.text)) return true;

  try {
    const ressimi = await simitalk(m.text);
    if (ressimi.status) {
      await conn.reply(m.chat, ressimi.resultado.simsimi, m);
    }
  } catch (err) {
    console.error('❌ Error en Simi-Talk:', err);
  }
  return true;
};

export default handler;

async function simitalk(ask, apikeyyy = "iJ6FxuA9vxlvz5cKQCt3", language = "es") {
    if (!ask) return { status: false, resultado: { msg: "Texto vacío." }};
    
    try {
        // Opción 1: API Delirius
        const response1 = await axios.get(`https://delirius-apiofc.vercel.app/tools/simi?text=${encodeURIComponent(ask)}`);
        let simiMsg = response1.data.data?.message || response1.data.data;
        
        // Traducir si es necesario
        const trad1 = await translate(simiMsg, { to: language, autoCorrect: true });
        
        if (!trad1.text || trad1.text === 'undefined') throw new Error('Respuesta inválida');
        
        return { status: true, resultado: { simsimi: trad1.text }};        
    } catch {
        try {
            // Opción 2: API Anbusec (Respaldo)
            const response2 = await axios.get(`https://anbusec.xyz/api/v1/simitalk?apikey=${apikeyyy}&ask=${encodeURIComponent(ask)}&lc=${language}`);
            return { status: true, resultado: { simsimi: response2.data.message }};       
        } catch (error2) {
            return { status: false, resultado: { msg: "Fallo total.", error: error2.message }};
        }
    }
}
