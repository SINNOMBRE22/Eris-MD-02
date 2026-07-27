import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
const NEWSLETTER_JID = '120363407502496951@newsletter';
const NEWSLETTER_NAME = 'Eris Service';
const SOURCE_URL = 'https://github.com/SINNOMBRE22/Eris-MD';
const YTS_TIMEOUT_MS = 12_000;
const TMP_DIR = path.join(process.cwd(), 'tmp');
const THUMB = (() => { try { return fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')); } catch { return Buffer.alloc(0); } })();
const buildContext = (title = '🌸 ERIS SERVICE 🌸', body = '') => ({ isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: NEWSLETTER_NAME, serverMessageId: -1 }, externalAdReply: { title, body, thumbnail: THUMB, mediaType: 1, renderLargerThumbnail: false, sourceUrl: SOURCE_URL } });
async function downloadAudio(videoUrl) {
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    const outPath = path.join(TMP_DIR, `play_${Date.now()}.mp3`);
    await execAsync(`yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 128K --no-warnings --quiet -o "${outPath}" "${videoUrl}"`, { timeout: 90_000 });
    if (!fs.existsSync(outPath)) throw new Error('yt-dlp no generó el archivo');
    return outPath;
}
async function searchTrack(query) {
    const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('Búsqueda tardó demasiado')), YTS_TIMEOUT_MS));
    const result = await Promise.race([yts(query), timer]);
    return result?.videos?.[0] ?? null;
}
function fmtDuration(sec = 0) { const m = Math.floor(sec / 60); const s = String(sec % 60).padStart(2, '0'); return `${m}:${s}`; }
const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text?.trim()) {
        return conn.sendMessage(m.chat, { text: [`🌸 *¿Qué canción quieres escuchar?*`, ``, `Escribe el nombre del artista o la canción.`, ``, `> 📌 *Ejemplo:* ${usedPrefix + command} Bad Bunny Tití Me Preguntó`].join('\n'), contextInfo: { mentionedJid: [m.sender], ...buildContext('🌸 ERIS SERVICE - PLAYER 🌸', `Hola ${m.pushName || 'usuario'} 👋`) } }, { quoted: m });
    }
    m.react('🔍').catch(() => {});
    let audioPath = null;
    try {
        const track = await searchTrack(text.trim());
        if (!track) { m.react('❌').catch(() => {}); return conn.sendMessage(m.chat, { text: `❌ *No encontré resultados para:* _${text.trim()}_\n\nIntenta con otro nombre.`, contextInfo: buildContext('Sin resultados') }, { quoted: m }); }
        const duration = typeof track.seconds === 'number' ? fmtDuration(track.seconds) : (track.duration?.timestamp ?? '?:??');
        await conn.sendMessage(m.chat, { text: [`🎵 *${track.title}*`, ``, `👤 *Artista:* ${track.author?.name ?? 'Desconocido'}`, `⏱ *Duración:* ${duration}`, ``, `_Descargando audio…_ ⏳`].join('\n'), contextInfo: buildContext('🌸 REPRODUCIENDO AHORA 🌸', track.title) }, { quoted: m });
        m.react('⬇️').catch(() => {});
        console.log(`[play] Descargando: ${track.url}`);
        audioPath = await downloadAudio(track.url);
        console.log(`[play] ✅ Listo: ${audioPath}`);
        m.react('🎧').catch(() => {});
        await conn.sendMessage(m.chat, { audio: fs.readFileSync(audioPath), mimetype: 'audio/mpeg', fileName: `${track.title.replace(/[^\w\s\-áéíóúñü]/gi, '')}.mp3`, ptt: false, contextInfo: buildContext('🌸 ERIS SERVICE 🌸', track.title) }, { quoted: m });
        m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[play] Error:', err?.message ?? err);
        m.react('❌').catch(() => {});
        conn.sendMessage(m.chat, { text: [`❌ *No pude reproducir la canción.*`, ``, `_${err?.message ?? 'Error desconocido'}_`].join('\n'), contextInfo: buildContext('Error de reproducción') }, { quoted: m });
    } finally {
        if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }
};
handler.help = ['play <canción>'];
handler.tags = ['descargas'];
handler.command = ['play', 'musica', 'mp3'];
export default handler;
