// @ts-check
import yargs from 'yargs'
import os from 'os'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import { createRequire } from 'module'
import fs from 'fs'
import Stream, { Readable } from 'stream'

/** 
 * @param {ImportMeta | string} pathURL 
 * @param {boolean?} rmPrefix if value is `true`, it will remove `file://` prefix; on windows default is false
 */
const __filename = function filename(pathURL = import.meta, rmPrefix = os.platform() !== 'win32') {
  const pathInput = /** @type {ImportMeta | string} */ (pathURL).url || /** @type {String} */ (pathURL)
  if (rmPrefix) {
    if (/^file:\/\//.test(pathInput)) return fileURLToPath(pathInput)
    return pathInput
  } else {
    if (/^file:\/\//.test(pathInput)) return pathInput
    return pathToFileURL(pathInput).href
  }
}

/** @param {ImportMeta | string} pathURL */
const __dirname = function dirname(pathURL) {
  try {
    if (global && typeof global.__dirname === 'function') {
      return global.__dirname(pathURL)
    }
  } catch (e) { /* ignore */ }

  const dir = __filename(pathURL, true)
  const re = /\/$/
  if (re.test(dir)) return dir
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      return dir.replace(re, '')
    }
  } catch (e) { /* ignore */ }
  return path.dirname(dir)
}

/** @param {ImportMeta | string} dir */
const __require = function require(dir = import.meta) {
  const p = /** @type {ImportMeta | string} */ (dir).url || /** @type {String} */ (dir)
  return createRequire(p)
}

/** @param {string} file */
const checkFileExists = (file) =>
  fs.promises.access(file, fs.constants.F_OK).then(() => true).catch(() => false)

/**
 * Construye URL de API usando global.APIs y global.APIKeys de forma segura.
 * @param {string} name - nombre del servicio o URL base
 * @param {string} [pathname='/'] - path adicional
 * @param {object} [query={}] - query params
 * @param {string} [apikeyqueryname] - nombre del parámetro para la API key (opcional)
 * @returns {string}
 */
const API = (name, pathname = '/', query = {}, apikeyqueryname) => {
  const base = (global && global.APIs && (name in global.APIs)) ? global.APIs[name] : name
  const params = { ...(query || {}) }
  if (apikeyqueryname) {
    const keyCandidate = (global && global.APIKeys)
      ? (global.APIKeys[name] || global.APIKeys[base])
      : undefined
    if (keyCandidate) params[apikeyqueryname] = keyCandidate
  }
  const qs = Object.keys(params).length ? ('?' + new URLSearchParams(Object.entries(params)).toString()) : ''
  return `${base}${pathname}${qs}`
}

/** @type {ReturnType<yargs.Argv['parse']>} */
const opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())

// Prefix por defecto. Se permite sobreescribir con --prefix al arrancar.
const prefix = new RegExp('^[' + (opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')

/**
 * Guarda un stream legible a un archivo en disco.
 * @param {Readable} stream 
 * @param {string} file 
 * @returns {Promise<void>}
 */
const saveStreamToFile = (stream, file) => new Promise((resolve, reject) => {
  const writable = stream.pipe(fs.createWriteStream(file))
  writable.once('finish', () => {
    resolve()
    writable.destroy()
  })
  writable.once('error', (err) => {
    reject(err)
    writable.destroy()
  })
})

/* ===== Detectores / utilidades para streams (compatibilidad Node >=12 ) ===== */
const kDestroyed = Symbol('kDestroyed');
const kIsReadable = Symbol('kIsReadable');

const isReadableNodeStream = (obj, strict = false) => {
  return !!(
    obj &&
    typeof obj.pipe === 'function' &&
    typeof obj.on === 'function' &&
    (
      !strict ||
      (typeof obj.pause === 'function' && typeof obj.resume === 'function')
    ) &&
    (!obj._writableState || obj._readableState?.readable !== false) &&
    (!obj._writableState || obj._readableState)
  );
}

const isNodeStream = (obj) => {
  return (
    obj &&
    (
      obj._readableState ||
      obj._writableState ||
      (typeof obj.write === 'function' && typeof obj.on === 'function') ||
      (typeof obj.pipe === 'function' && typeof obj.on === 'function')
    )
  );
}

const isDestroyed = (stream) => {
  if (!isNodeStream(stream)) return null;
  const wState = stream._writableState;
  const rState = stream._readableState;
  const state = wState || rState;
  return !!(stream.destroyed || stream[kDestroyed] || state?.destroyed);
}

const isReadableFinished = (stream, strict) => {
  if (!isReadableNodeStream(stream)) return null;
  const rState = stream._readableState;
  if (rState?.errored) return false;
  if (typeof rState?.endEmitted !== 'boolean') return null;
  return !!(
    rState.endEmitted ||
    (strict === false && rState.ended === true && rState.length === 0)
  );
}

const isReadableStream = (stream) => {
  if (typeof Stream.isReadable === 'function') return Stream.isReadable(stream)
  if (stream && stream[kIsReadable] != null) return stream[kIsReadable];
  if (typeof stream?.readable !== 'boolean') return null;
  if (isDestroyed(stream)) return false;
  return (
    isReadableNodeStream(stream) &&
    !!stream.readable &&
    !isReadableFinished(stream)
  ) || stream instanceof fs.ReadStream || stream instanceof Readable;
}

/* ===== Funciones para extracción/normalización de JID (Robust) ===== */

/**
 * Extrae el JID del remitente de forma robusta desde el objeto m.
 * Cubre: m.key.participant, m.participant, m.sender, m.key.remoteJid,
 * extendedTextMessage.contextInfo.participant, imageMessage.contextInfo.participant,
 * ephemeralMessage, reactionMessage, conversation fallbacks, etc.
 * Usa conn.decodeJid si está disponible para normalizar.
 * @param {object} m - mensaje recibido (WebMessageInfo)
 * @param {object} conn - instancia de conexión (opcional) para usar decodeJid
 * @returns {string} jid (ej: '521234567890@s.whatsapp.net') o '' si no encuentra
 */
export function getSenderJid(m, conn) {
  const decode = typeof conn?.decodeJid === 'function' ? conn.decodeJid : (j) => j
  const candidates = [
    () => m?.key?.participant,
    () => m?.participant,
    () => m?.sender,
    () => m?.key?.remoteJid,
    () => m?.message?.extendedTextMessage?.contextInfo?.participant,
    () => m?.message?.imageMessage?.contextInfo?.participant,
    () => m?.message?.videoMessage?.contextInfo?.participant,
    () => m?.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo?.participant,
    () => m?.message?.reactionMessage?.key?.participant,
    () => m?.message?.conversation && m?.key?.participant,
    () => m?.message?.ephemeralMessage?.message?.conversation && m?.key?.participant
  ]
  for (const getter of candidates) {
    try {
      const v = getter()
      if (v) return decode(v)
    } catch {}
  }
  try {
    return decode(m?.sender || m?.key?.participant || m?.key?.remoteJid || '') || ''
  } catch {
    return m?.sender || m?.key?.participant || m?.key?.remoteJid || ''
  }
}

/**
 * Normaliza un jid devolviendo solo dígitos (útil para comparar con global.owner entries)
 * @param {string} jid
 * @returns {string}
 */
export function normalizeJid(jid) {
  if (!jid) return ''
  return String(jid).replace(/[^0-9]/g, '')
}

/* ===== Export default (compatibilidad con imports por defecto existentes) ===== */
export default {
  __filename,
  __dirname,
  __require,
  checkFileExists,
  API,
  saveStreamToFile,
  isReadableStream,
  opts,
  prefix,
  // funciones nuevas
  getSenderJid,
  normalizeJid
}
