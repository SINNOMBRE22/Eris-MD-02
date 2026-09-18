/* ERIS-MD SPOTIFY DOWNLOADER - Embed scrape (oficial, sin API key) + yt-dlp con match por duración */

import axios from 'axios';
import yts from 'yt-search';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const SIZE_LIMIT_MB = 100;
const redes = 'https://github.com/SINNOMBRE22/Eris-MD';

const TMP_DIR = path.join(process.cwd(), 'tmp');
const BIN_DIR = path.join(TMP_DIR, 'bin');
const YTDLP_LOCAL = path.join(BIN_DIR, 'yt-dlp');
const YTDLP_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const PLAYER_CLIENTS = ['android', 'ios', 'web_safari', 'tv'];

// Palabras que descartan un resultado SALVO que la canción original las tenga
const BAD_WORDS = ['cover', 'remix', 'live', 'en vivo', 'reaction', 'karaoke', 'instrumental', 'sped up', 'slowed', '8d audio', 'nightcore', 'tutorial'];

// ── Resolver binario yt-dlp ──
let ytdlpBin = null;
async function resolveYtdlp() {
    if (ytdlpBin) return ytdlpBin;
    try { await execAsync('yt-dlp --version', { timeout: 10_000 }); ytdlpBin = 'yt-dlp'; return ytdlpBin; } catch {}
    if (fs.existsSync(YTDLP_LOCAL)) {
        try { await execAsync(`"${YTDLP_LOCAL}" --version`, { timeout: 10_000 }); ytdlpBin = YTDLP_LOCAL; return ytdlpBin; } catch { try { fs.unlinkSync(YTDLP_LOCAL); } catch {} }
    }
    console.log('[spotify] Descargando binario yt-dlp…');
    if (!fs.existsSync(BIN_DIR)) fs.mkdirSync(BIN_DIR, { recursive: true });
    await execAsync(`curl -fsSL -o "${YTDLP_LOCAL}" "${YTDLP_URL}" || wget -q -O "${YTDLP_LOCAL}" "${YTDLP_URL}"`, { timeout: 120_000 });
    if (!fs.existsSync(YTDLP_LOCAL)) throw new Error('No se pudo descargar yt-dlp');
    fs.chmodSync(YTDLP_LOCAL, 0o755);
    ytdlpBin = YTDLP_LOCAL;
    return ytdlpBin;
}

async function downloadFromYoutube(videoUrl) {
    const bin = await resolveYtdlp();
    if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });
    let lastErr = null;
    for (const client of PLAYER_CLIENTS) {
        const outPath = path.join(TMP_DIR, `spotify_${Date.now()}_${client}.mp3`);
        const cmd = `"${bin}" --no-playlist -x --audio-format mp3 --audio-quality 128K ` +
            `--extractor-args "youtube:player_client=${client}" --no-warnings --quiet -o "${outPath}" "${videoUrl}"`;
        try {
            await execAsync(cmd, { timeout: 90_000 });
            if (fs.existsSync(outPath)) { console.log(`[spotify] ✅ Descarga OK con cliente: ${client}`); return outPath; }
        } catch (err) {
            console.warn(`[spotify] ⚠️ Falló cliente "${client}":`, err?.message?.split('\n')[0] ?? err);
            lastErr = err;
            try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
        }
    }
    throw lastErr ?? new Error('No se pudo descargar el audio con ningún cliente');
}

function extractTrackId(url) {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}

// ── Metadata real desde la página embed pública de Spotify (artista + título + duración) ──
async function getSpotifyMeta(spotifyUrl) {
    const trackId = extractTrackId(spotifyUrl);
    if (!trackId) throw new Error('No se pudo extraer el ID de la canción del link');

    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const { data: html } = await axios.get(embedUrl, {
        timeout: 15_000,
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if (!jsonMatch) throw new Error('No se encontró el bloque de datos en la página de Spotify');

    const parsed = JSON.parse(jsonMatch[1]);
    const entity = parsed?.props?.pageProps?.state?.data?.entity;
    if (!entity) throw new Error('Spotify no devolvió datos de la canción (¿link inválido o removido?)');

    const title = entity.title;
    const artist = entity.subtitle || entity.artists?.map(a => a.name).join(', ') || 'Desconocido';
    const durationSec = entity.duration ? Math.round(entity.duration / 1000) : null;
    const thumbnail = entity.coverArt?.sources?.[0]?.url || entity.coverArt?.[0]?.url || null;

    return { title, artist, durationSec, thumbnail };
}

// ── Buscar en YouTube y elegir el mejor match por duración + nombre limpio ──
async function findBestMatch(query, targetDurationSec) {
    const result = await yts(query);
    const candidates = (result?.videos ?? []).slice(0, 8);
    if (!candidates.length) return null;

    const scored = candidates.map(v => {
        const titleLower = v.title.toLowerCase();
        const hasBadWord = BAD_WORDS.some(w => titleLower.includes(w));
        const durationDiff = (targetDurationSec && typeof v.seconds === 'number')
            ? Math.abs(v.seconds - targetDurationSec)
            : 999;
        return { video: v, hasBadWord, durationDiff };
    });

    const clean = scored.filter(s => !s.hasBadWord);
    const pool = clean.length ? clean : scored;
    pool.sort((a, b) => a.durationDiff - b.durationDiff);

    console.log('[spotify] Candidatos evaluados:', pool.map(p => `${p.video.title} (${p.video.seconds}s, diff=${p.durationDiff})`).slice(0, 3));
    return pool[0].video;
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
  const name = m.pushName || (await conn.getName(m.sender)) || "Usuario";
  const spotifyUrl = args[0];

  let thumb;
  try { thumb = fs.readFileSync(path.join(process.cwd(), 'src/imagenes/perfil2.jpeg')); } catch { thumb = Buffer.alloc(0); }

  if (!spotifyUrl || !spotifyUrl.includes('open.spotify.com/track')) {
    return conn.sendMessage(m.chat, {
        text: `🌸 *Falta un enlace real de Spotify, ${name}.*\n\nDebes enviar la URL de una canción (Track).\n> *Ejemplo:* ${usedPrefix + command} https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT`,
        contextInfo: { externalAdReply: { title: '🌸 ERIS SERVICE - SPOTIFY 🌸', body: `Esperando enlace válido...`, thumbnail: thumb, sourceUrl: redes, mediaType: 1 } }
    }, { quoted: m });
  }

  await m.react("🕓");
  let audioPath = null;

  try {
    console.log('[spotify] Extrayendo metadata real…');
    const meta = await getSpotifyMeta(spotifyUrl);
    console.log('[spotify] Meta:', meta.artist, '-', meta.title, `(${meta.durationSec}s)`);

    // Thumbnail real de la portada (para la tarjeta compacta), con fallback al logo propio
    let cardThumb = thumb;
    if (meta.thumbnail) {
        try {
            const resThumb = await axios.get(meta.thumbnail, { responseType: 'arraybuffer', timeout: 10_000 });
            cardThumb = Buffer.from(resThumb.data);
        } catch (eThumb) {
            console.warn('[spotify] ⚠️ No se pudo bajar el cover, uso logo propio:', eThumb.message);
        }
    }

    let caption = `╭─── [ 🎵 *SPOTIFY DL* ] ──···\n`;
    caption += `│ 🎶 *Título:* ${meta.title}\n`;
    caption += `│ 👤 *Artista:* ${meta.artist}\n`;
    caption += `╰─────────────────────────···\n\n`;
    caption += `> 🌸 *Buscando la versión Original...*`;

    // Solo tarjeta compacta (sin imagen grande duplicada)
    await conn.sendMessage(m.chat, {
      text: caption,
      contextInfo: {
        externalAdReply: {
          title: `🌸 REPRODUCIENDO SPOTIFY 🌸`,
          body: `${meta.artist} - ${meta.title}`,
          thumbnail: cardThumb,
          mediaType: 1,
          sourceUrl: spotifyUrl,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });

    const query = `${meta.artist} - ${meta.title}`;
    console.log('[spotify] Buscando:', query);
    const track = await findBestMatch(query, meta.durationSec);
    if (!track) throw new Error(`No se encontró "${query}" en YouTube`);
    console.log('[spotify] Elegido:', track.title, track.url);

    await m.react("⬇️");
    audioPath = await downloadFromYoutube(track.url);

    const audioBuffer = fs.readFileSync(audioPath);
    const fileSizeMb = audioBuffer.length / (1024 * 1024);
    console.log(`[spotify] Audio listo: ${fileSizeMb.toFixed(2)} MB`);

    const fileName = `${meta.artist} - ${meta.title}`.replace(/[^\w\s\-áéíóúñü]/gi, '');
    if (fileSizeMb > SIZE_LIMIT_MB) {
        await conn.sendMessage(m.chat, { document: audioBuffer, fileName: `${fileName}.mp3`, mimetype: 'audio/mpeg', caption: `> 🌸 *Archivo pesado. Se envió como documento.*` }, { quoted: m });
        await m.react("📄");
    } else {
        await conn.sendMessage(m.chat, { audio: audioBuffer, mimetype: "audio/mpeg", fileName: `${fileName}.mp3` }, { quoted: m });
        await m.react("✅");
    }

  } catch (e) {
    console.error("[spotify] ❌ Error final:", e?.message, e?.response?.status, e?.response?.data ?? '');
    await m.react("❌");
    conn.reply(m.chat, `🌸 *Error:* No pude descargar la pista.\n\n_${e?.message ?? 'Error desconocido'}_`, m);
  } finally {
    if (audioPath && fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
  }
};

handler.help = ['spotify <url>'];
handler.tags = ['descargas'];
handler.command = ['spotify', 'sp'];
handler.register = false;

export default handler;
