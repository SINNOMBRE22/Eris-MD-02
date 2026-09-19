import yts from 'yt-search';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
const NEWSLETTER_JID = '120363407502496951@newsletter';
const NEWSLETTER_NAME = 'Eris Service';
const SOURCE_URL = 'https://github.com/SINNOMBRE22/Eris-MD';
const YTS_TIMEOUT_MS = 12_000;
const MASTER_TIMEOUT_MS = 68_000; // techo absoluto: nunca deja al usuario sin respuesta (cubre las 3 oleadas)

// Fuera de process.cwd() para que PM2 (watch:true) nunca lo detecte y reinicie el bot a medias
const TMP_DIR = path.join(os.tmpdir(), 'eris-md-play');
const BIN_DIR = path.join(TMP_DIR, 'bin');
const YTDLP_LOCAL = path.join(BIN_DIR, 'yt-dlp');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const THUMB = (() => { try { return fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')); } catch { return Buffer.alloc(0); } })();
const buildContext = (title = '🌸 ERIS SERVICE 🌸', body = '') => ({ isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, newsletterName: NEWSLETTER_NAME, serverMessageId: -1 }, externalAdReply: { title, body, thumbnail: THUMB, mediaType: 1, renderLargerThumbnail: false, sourceUrl: SOURCE_URL } });

const AUDIO_MIME = { m4a: 'audio/mp4', mp4: 'audio/mp4', webm: 'audio/webm', opus: 'audio/ogg; codecs=opus', ogg: 'audio/ogg; codecs=opus', mp3: 'audio/mpeg' };

// ── Resolver binario yt-dlp (sistema o local, con auto-descarga) ──
let ytdlpBin = null;
async function resolveYtdlp() {
    if (ytdlpBin) return ytdlpBin;
    try { await execAsync('yt-dlp --version', { timeout: 10_000 }); ytdlpBin = 'yt-dlp'; return ytdlpBin; } catch {}
    if (fs.existsSync(YTDLP_LOCAL)) {
        try { await execAsync(`"${YTDLP_LOCAL}" --version`, { timeout: 10_000 }); ytdlpBin = YTDLP_LOCAL; return ytdlpBin; } catch { try { fs.unlinkSync(YTDLP_LOCAL); } catch {} }
    }
    console.log('[play] yt-dlp no encontrado, descargando binario…');
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });
    await execAsync(`curl -fsSL -o "${YTDLP_LOCAL}" "${YTDLP_URL}" || wget -q -O "${YTDLP_LOCAL}" "${YTDLP_URL}"`, { timeout: 120_000 });
    if (!fs.existsSync(YTDLP_LOCAL)) throw new Error('No se pudo descargar yt-dlp');
    fs.chmodSync(YTDLP_LOCAL, 0o755);
    await execAsync(`"${YTDLP_LOCAL}" --version`, { timeout: 15_000 });
    console.log('[play] ✅ yt-dlp instalado en', YTDLP_LOCAL);
    ytdlpBin = YTDLP_LOCAL;
    return ytdlpBin;
}

// ── Auto-actualizar yt-dlp si el binario está viejo (>7 días) ──
// Se llama SIEMPRE en segundo plano (sin await en el flujo principal) para que
// nunca añada latencia a una descarga en curso. Descarga a un archivo temporal
// y hace rename atómico, así no rompe una ejecución concurrente que use el binario viejo.
async function ensureFreshYtdlp(bin) {
    if (bin !== YTDLP_LOCAL) return;
    try {
        const stat = fs.statSync(YTDLP_LOCAL);
        const ageMs = Date.now() - stat.mtimeMs;
        if (ageMs <= 7 * 24 * 60 * 60 * 1000) return;
        console.log('[play] yt-dlp local desactualizado (>7 días), refrescando en segundo plano…');
        const tmpBin = `${YTDLP_LOCAL}.new`;
        await execAsync(`curl -fsSL -o "${tmpBin}" "${YTDLP_URL}" || wget -q -O "${tmpBin}" "${YTDLP_URL}"`, { timeout: 120_000 });
        fs.chmodSync(tmpBin, 0o755);
        await execAsync(`"${tmpBin}" --version`, { timeout: 15_000 });
        fs.renameSync(tmpBin, YTDLP_LOCAL); // atómico: nunca deja el binario a medias
        console.log('[play] ✅ yt-dlp actualizado');
    } catch (err) {
        console.warn('[play] ⚠️ No se pudo refrescar yt-dlp:', err?.message ?? err);
    }
}

// Saca la razón real del fallo desde stderr/stdout de yt-dlp (prioriza líneas "ERROR:").
// Antes usábamos --quiet, que tapaba esto por completo y solo dejaba ver "Command failed".
function extractYtdlpError(output) {
    if (!output) return null;
    const lines = output.split('\n').map(l => l.replace(/\x1b\[[0-9;]*m/g, '').trim()).filter(Boolean);
    const errLines = lines.filter(l => l.startsWith('ERROR:'));
    if (errLines.length) return errLines[errLines.length - 1].replace(/^ERROR:\s*/, '');
    return lines.length ? lines[lines.length - 1] : null;
}

function findDownloadedFile(prefix) {
    try {
        const dir = path.dirname(prefix);
        const base = path.basename(prefix);
        const match = fs.readdirSync(dir).find(f => f.startsWith(base));
        return match ? path.join(dir, match) : null;
    } catch { return null; }
}

function cleanupPrefix(prefix) {
    try {
        const dir = path.dirname(prefix);
        const base = path.basename(prefix);
        for (const f of fs.readdirSync(dir)) {
            if (f.startsWith(base)) { try { fs.unlinkSync(path.join(dir, f)); } catch {} }
        }
    } catch {}
}

// Lanza varios clientes de yt-dlp EN PARALELO (no en fila) para el mismo video.
// Gana el primero que produzca archivo; los demás se matan y se limpian sus restos.
// Sin -x/--audio-format: bajamos bestaudio tal cual, sin reencode con ffmpeg (mucho más rápido).
function raceClients(bin, clients, videoUrl, timeoutMs) {
    return clients.map(client => {
        const outPrefix = path.join(TMP_DIR, `play_${Date.now()}_${client}_${Math.random().toString(36).slice(2, 7)}`);
        let child;
        const promise = new Promise((resolve, reject) => {
            // 'default' = último recurso: dejamos que yt-dlp elija el cliente por sí mismo (sin forzar)
            const extractorArg = client === 'default' ? '' : `--extractor-args "youtube:player_client=${client}" `;
            const cmd = `"${bin}" --no-playlist --no-progress -f "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio" ` +
                `${extractorArg}-o "${outPrefix}.%(ext)s" "${videoUrl}"`;
            // Sin --quiet: así stderr trae el motivo real cuando algo falla (bloqueo, formato, video privado, etc.)
            child = exec(cmd, { timeout: timeoutMs, maxBuffer: 4 * 1024 * 1024 }, (error, stdout, stderr) => {
                if (error) {
                    const reason = (extractYtdlpError(stderr) || extractYtdlpError(stdout) || error.message.split('\n')[0] || 'Error desconocido').slice(0, 300);
                    console.log(`[play] ✗ Cliente "${client}" falló: ${reason}`); // visible aunque otro cliente gane
                    return reject(Object.assign(new Error(reason), { client }));
                }
                const file = findDownloadedFile(outPrefix);
                if (file && fs.statSync(file).size > 0) return resolve({ file, client });
                console.log(`[play] ✗ Cliente "${client}" no generó archivo`);
                reject(new Error(`Archivo no generado (cliente ${client})`));
            });
        });
        return { client, outPrefix, promise, kill: () => { try { child?.kill('SIGKILL'); } catch {} } };
    });
}

async function downloadAudio(videoUrl) {
    const bin = await resolveYtdlp();
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

    // Dos oleadas en paralelo en vez de 4 intentos en fila: el caso normal (android/ios)
    // resuelve en segundos; solo si ambos fallan se prueba la segunda oleada.
    // 'default' va primero: en las pruebas fue el único que consistentemente descargó.
    // Se deja android/ios/web_safari/tv como respaldo por si ALGÚN video sí bloquea a 'default'
    // (esa fue la razón original de la rotación de clientes).
    const phases = [
        { clients: ['default'], timeoutMs: 20_000 },
        { clients: ['android', 'ios'], timeoutMs: 18_000 },
        { clients: ['web_safari', 'tv'], timeoutMs: 22_000 }
    ];

    let lastErr = null;
    for (const phase of phases) {
        const jobs = raceClients(bin, phase.clients, videoUrl, phase.timeoutMs);
        try {
            const winner = await Promise.any(jobs.map(j => j.promise));
            console.log(`[play] ✅ Descarga OK con cliente: ${winner.client}`);
            for (const j of jobs) { if (j.client !== winner.client) { j.kill(); cleanupPrefix(j.outPrefix); } }
            ensureFreshYtdlp(bin).catch(() => {}); // en segundo plano, no bloquea la respuesta
            return winner.file;
        } catch (aggErr) {
            for (const j of jobs) cleanupPrefix(j.outPrefix);
            lastErr = aggErr?.errors?.[0] ?? aggErr;
        }
    }
    ensureFreshYtdlp(bin).catch(() => {});
    throw lastErr instanceof Error ? lastErr : new Error('No se pudo descargar el audio con ningún cliente');
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

        // Timeout maestro: si por lo que sea todo se cuelga, igual respondemos algo
        // en vez de dejar al usuario esperando para siempre.
        const downloadPromise = downloadAudio(track.url);
        downloadPromise.catch(() => {}); // evita "unhandled rejection" si gana el timeout
        const masterTimeout = new Promise((_, rej) => setTimeout(() => rej(new Error('MASTER_TIMEOUT')), MASTER_TIMEOUT_MS));
        audioPath = await Promise.race([downloadPromise, masterTimeout]);

        console.log(`[play] ✅ Listo: ${audioPath}`);
        m.react('🎧').catch(() => {});

        const ext = (path.extname(audioPath).replace('.', '') || 'm4a').toLowerCase();
        const mimetype = AUDIO_MIME[ext] || 'audio/mp4';

        await conn.sendMessage(m.chat, {
            audio: fs.readFileSync(audioPath),
            mimetype,
            fileName: `${track.title.replace(/[^\w\s\-áéíóúñü]/gi, '')}.${ext}`,
            ptt: false
        }, { quoted: m });
        m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[play] Error:', err?.message ?? err);
        m.react('❌').catch(() => {});
        const msg = err?.message === 'MASTER_TIMEOUT'
            ? '⏱️ *La descarga está tardando demasiado.* Intenta de nuevo en unos segundos.'
            : [`❌ *No pude reproducir la canción.*`, ``, `_${err?.message ?? 'Error desconocido'}_`].join('\n');
        conn.sendMessage(m.chat, { text: msg, contextInfo: buildContext('Error de reproducción') }, { quoted: m });
    } finally {
        if (audioPath && fs.existsSync(audioPath)) { try { fs.unlinkSync(audioPath); } catch {} }
    }
};
handler.help = ['play <canción>'];
handler.tags = ['descargas'];
handler.command = ['play', 'musica', 'mp3'];
export default handler;
