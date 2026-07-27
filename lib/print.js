import PhoneNumber from 'awesome-phonenumber'
import chalk from 'chalk'
import { watchFile } from 'fs'
import Helper from './helper.js'

let terminalImage = null
if (global.opts?.['img']) {
  try { terminalImage = (await import('terminal-image')).default } catch (e) { terminalImage = null }
}

const urlRegex = (await import('url-regex-safe')).default({ strict: false })

function resolveLid(jid, conn) {
  if (!jid || !/@lid$/.test(jid)) return jid
  try {
    const contacts = conn?.contacts || conn?.store?.contacts || {}
    for (const [realJid, contact] of Object.entries(contacts)) {
      if (!realJid.endsWith('@s.whatsapp.net')) continue
      if (contact?.lid === jid || contact?.id === jid) return realJid
    }
  } catch {}
  return jid
}

function resolvePhone(jid, conn) {
  if (!jid || typeof jid !== 'string') return null
  if (/@lid$/.test(jid)) {
    const resolved = resolveLid(jid, conn)
    if (resolved === jid) return null
    jid = resolved
  }
  if (!/@s\.whatsapp\.net$/.test(jid)) return null
  try {
    const numeric = jid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
    if (!numeric || numeric.length < 7) return null
    const pn = PhoneNumber('+' + numeric)
    if (!pn.isValid()) return '+' + numeric
    return pn.getNumber('international')
  } catch {
    return null
  }
}

export default async function (m, conn = { user: {} }) {
  try {
    // Filtrar mensajes de sistema vacíos (TIPO: 2, receipts, presencia, etc.)
    // Son mensajes sin contenido de texto ni tipo reconocido que Baileys pasa como ruido
    const hasContent = m?.text || m?.message || m?.messageStubType
    const isSystemNoise = (
      !hasContent ||
      (
        typeof m?.messageStubType === 'number' &&
        m?.messageStubType > 0 &&
        !m?.text &&
        !m?.message &&
        !(m?.messageStubParameters?.length > 0)
      )
    )
    if (isSystemNoise) return

    const candidates = {
      key_participant: m?.key?.participant,
      participant: m?.participant,
      sender_prop: m?.sender,
      key_remoteJid: m?.key?.remoteJid,
      ext_ctx_participant: m?.message?.extendedTextMessage?.contextInfo?.participant,
      img_ctx_participant: m?.message?.imageMessage?.contextInfo?.participant,
      vid_ctx_participant: m?.message?.videoMessage?.contextInfo?.participant,
      ephem_ext_ctx: m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant,
      reaction_participant: m?.message?.reactionMessage?.key?.participant,
      quoted_participant: m?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.contextInfo?.participant,
    }

    const rawSenderJid = (Helper && typeof Helper.getSenderJid === 'function')
      ? Helper.getSenderJid(m, conn)
      : (m?.sender || m?.key?.participant || m?.key?.remoteJid || '')
    const chosen = rawSenderJid || ''

    if (global?.opts?.debug) {
      console.log('==== DEBUG MESSAGE FIELDS ====')
      console.log('candidates:', JSON.stringify(candidates, null, 2))
      console.log('CHOSE SENDER rawSenderJid:', chosen)
      console.log('m.key:', { remoteJid: m?.key?.remoteJid, participant: m?.key?.participant, id: m?.key?.id })
      console.log('message types keys:', Object.keys(m?.message || {}).slice(0, 10))
      console.log('isGroup:', !!m?.isGroup, 'm.chat:', m?.chat)
      console.log('==== END DEBUG ====')
    }

    const resolvedSenderJid = /@lid$/.test(chosen) ? resolveLid(chosen, conn) : chosen
    const senderNumber = resolvePhone(resolvedSenderJid, conn) || (/@lid$/.test(resolvedSenderJid) ? '[LID]' : resolvedSenderJid) || '??'

    let _name = ''
    try { _name = await conn.getName?.(resolvedSenderJid) || '' } catch {}
    if (!_name) { try { _name = await conn.getName?.(chosen) || '' } catch {} }
    let sender = senderNumber + (_name ? ' ~' + _name : '')

    let chat = await conn.getName?.(m.chat) || ''
    let img = null
    try {
      if (global.opts?.['img'] && /sticker|image/gi.test(m.mtype) && terminalImage) {
        img = await terminalImage.buffer(await m.download())
      }
    } catch { /* ignore */ }

    let filesize = (
      m.msg
        ? m.msg.vcard ? m.msg.vcard.length
          : m.msg.fileLength ? (m.msg.fileLength.low || m.msg.fileLength)
          : m.msg.axolotlSenderKeyDistributionMessage ? m.msg.axolotlSenderKeyDistributionMessage.length
          : m.msg.seconds ? 0
          : m.text ? m.text.length : 0
        : m.text ? m.text.length : 0
    ) || 0

    const botNumber = resolvePhone(conn.user?.jid, conn) || '??'
    const botName = conn.user?.name || 'Eris'

    let oraRD = new Date().toLocaleString('en-US', {
      timeZone: 'America/Santo_Domingo',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    })

    let chatName = chat ? (m.isGroup ? 'Grupo: ' + chat : 'Privado: ' + chat) : 'Eris'

    function humanSize(bytes) {
      if (!bytes) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
    }

    console.log([
      `╭─── [ 🌸 ${chalk.black.bgCyan(' ERIS HOUSEKEEPING ')} ] ──···`,
      `│ 🤖 ${chalk.cyan('BOT RECEPTOR:')} ${chalk.white(botNumber)} ${chalk.gray('(' + botName + ')')}`,
      `│ 🕒 ${chalk.cyan('HORA:')} ${chalk.white(oraRD)}`,
      `│ 📂 ${chalk.cyan('TIPO:')} ${chalk.white(m.messageStubType ? m.messageStubType : 'MENSAJE')}`,
      `│ ⌨ ${chalk.cyan('PESO:')} ${chalk.white(filesize + ' — ' + humanSize(filesize))}`,
      `│ ✦ ${chalk.cyan('DE:')} ${chalk.white(sender)}`,
      `│ ❑ ${chalk.cyan('UBICACIÓN:')} ${chalk.white(chatName)}`,
      `│ 🍭 ${chalk.cyan('PROTOCOLO:')} ${chalk.white(m.mtype ? m.mtype.replace(/message$/i, '').replace('audio', m.msg?.ptt ? 'PTT' : 'audio').replace(/^./, v => v.toUpperCase()) : 'Unknown')}`,
      `╰─────────────────────────────────────────────────···`
    ].join('\n'))

    if (img) console.log(img.trimEnd())

    if (typeof m.text === 'string' && m.text) {
      let log = m.text.replace(/\u200e+/g, '')
      let mdRegex = /(?<=(?:^|[\s\n])\S?)(?:([*_~])(.+?)\1|```((?:.||[\n\r])+?)```)(?=\S?(?:[\s\n]|$))/g
      let mdFormat = (depth = 4) => (_, type, text, monospace) => {
        let types = { _: 'italic', '*': 'bold', '~': 'strikethrough' }
        text = text || monospace
        return !types[type] || depth < 1 ? text : chalk[types[type]](text.replace(mdRegex, mdFormat(depth - 1)))
      }

      log = log.replace(urlRegex, (url) => chalk.redBright.underline(url))
      log = log.replace(mdRegex, mdFormat(4))

      if (m.mentionedJid) {
        for (let userJid of m.mentionedJid) {
          try {
            log = log.replace('@' + userJid.split`@`[0], chalk.redBright('@' + await conn.getName(userJid)))
          } catch {}
        }
      }

      console.log(m.error != null ? chalk.red.bold('✖ ' + log) : m.isCommand ? chalk.greenBright('⚡ ' + log) : '💬 ' + log)
    }

    if (m.messageStubParameters && m.messageStubParameters.length > 0) {
      try {
        const resolved = await Promise.all(m.messageStubParameters.map(async jid => {
          try {
            jid = conn.decodeJid ? conn.decodeJid(jid) : jid
            const phoneNumber = resolvePhone(jid, conn)
            if (!phoneNumber) return null
            let name = ''
            try { name = await conn.getName(jid) } catch {}
            return name ? chalk.redBright(`${phoneNumber} (${name})`) : chalk.redBright(phoneNumber)
          } catch {
            return null
          }
        }))
        const line = resolved.filter(Boolean).join(', ')
        if (line) console.log(chalk.gray('  └─ ') + line)
      } catch (e) {
        console.error(e)
      }
    }

    if (/audio/i.test(m.mtype)) {
      const duration = m.msg.seconds || 0
      console.log(`${m.msg.ptt ? '🎤' : '🎵'} ${chalk.cyan('AUDIO REPRODUCIDO')} [${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}]`)
    }
    console.log()
  } catch (err) {
    try { console.error('lib/print.js error:', err) } catch {}
  }
}

let file = global.__filename(import.meta.url)
watchFile(file, () => {
  console.log(chalk.redBright("🦈 Eris: 'lib/print.js' actualizado"))
})
