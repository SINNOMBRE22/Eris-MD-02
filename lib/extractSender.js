// Helper: extracción robusta del sender JID y normalización (útil para print y handlers)
export function extractSenderJid(m, conn) {
  // Intenta usar conn.decodeJid para normalizar si está disponible
  const decode = typeof conn?.decodeJid === 'function' ? conn.decodeJid : (jid) => jid;

  // Posibles ubicaciones del JID del remitente:
  // - m.key.participant (mensajes de grupo en algunos tipos)
  // - m.participant (otras variantes)
  // - m.sender (a veces establecida por el handler)
  // - m.key.remoteJid (si todo falla, identificación del chat)
  // - m.message?.extendedTextMessage?.contextInfo?.participant (citas/extended)
  // - m.message?.imageMessage?.contextInfo?.participant  (images con contexto)
  // - m.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant (ephemeral)
  const candidates = [
    () => m?.key?.participant,
    () => m?.participant,
    () => m?.sender,
    () => m?.key?.remoteJid,
    () => m?.message?.extendedTextMessage?.contextInfo?.participant,
    () => m?.message?.imageMessage?.contextInfo?.participant,
    () => m?.message?.videoMessage?.contextInfo?.participant,
    () => m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant,
    () => m?.message?.ephemeralMessage?.message?.conversation && m?.key?.participant, // fallback
  ];

  let raw = ''
  for (const get of candidates) {
    try {
      const v = get()
      if (v) { raw = v; break }
    } catch { /* ignore */ }
  }

  // decode and return normalized JID (or empty string)
  try {
    const decoded = decode(raw || '')
    return decoded || raw || ''
  } catch {
    return raw || ''
  }
}

// Normaliza a solo dígitos (para comparar con global.owner entries)
export function normalizeDigitsFromJid(jid) {
  if (!jid) return ''
  return String(jid).replace(/[^0-9]/g, '')
}
