/* 🦈 ERIS-MD STICKER ENGINE - OPTIMIZADO PARA PESO 🦈 */

import { dirname } from 'path'
import { fileURLToPath } from 'url'
import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import { ffmpeg } from './converter.js'
import fluent_ffmpeg from 'fluent-ffmpeg'
import { spawn } from 'child_process'
import uploadFile from './uploadFile.js'
import uploadImage from './uploadImage.js'
import { fileTypeFromBuffer } from 'file-type'
import webp from 'node-webpmux'
import fetch from 'node-fetch'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tmp = path.join(__dirname, '../tmp')

const support = {
  ffmpeg: true,
  ffprobe: true,
  ffmpegWebp: true,
  convert: true,
  magick: false,
  gm: false,
  find: false
}

global.support = support

// --- STICKER 6: LA CLAVE PARA EL PESO BAJO ---
async function sticker6(img, url) {
  return new Promise(async (resolve, reject) => {
    try {
      if (url) {
        const res = await fetch(url)
        if (res.status !== 200) throw await res.text()
        img = await res.buffer()
      }
      const type = await fileTypeFromBuffer(img) || { mime: 'application/octet-stream', ext: 'bin' }
      if (type.ext == 'bin') return reject(img)
      
      const tmpFile = path.join(__dirname, `../tmp/${+ new Date()}.${type.ext}`)
      const out = tmpFile + '.webp'
      await fs.promises.writeFile(tmpFile, img)

      const Fffmpeg = /video/i.test(type.mime) ? fluent_ffmpeg(tmpFile).inputFormat(type.ext) : fluent_ffmpeg(tmpFile).input(tmpFile)
      
      Fffmpeg
        .on('error', function (err) {
          console.error(err)
          fs.promises.unlink(tmpFile).catch(() => {})
          reject(img)
        })
        .on('end', async function () {
          fs.promises.unlink(tmpFile).catch(() => {})
          resolve(await fs.promises.readFile(out))
        })
        .addOutputOptions([
          '-vcodec', 'libwebp',
          '-vf', "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=12,pad=320:320:-1:-1:color=white@0.0,split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
          '-lossless', '0',
          '-compression_level', '6',
          '-q:v', '40',
          '-loop', '0',
          '-an',
          '-vsync', '0'
        ])
        .toFormat('webp')
        .save(out)
    } catch (e) { reject(e) }
  })
}

// --- STICKER 5: CALIDAD PARA IMÁGENES ---
async function sticker5(img, url, packname, author, categories = [''], extra = {}) {
  const { Sticker } = await import('wa-sticker-formatter')
  const stickerMetadata = {
    type: 'default',
    pack: packname,
    author,
    categories,
    ...extra
  }
  return (new Sticker(img ? img : url, stickerMetadata)).toBuffer()
}

// --- ADD EXIF: EL NOMBRE DEL BOT ---
async function addExif(webpSticker, packname, author, categories = [''], metadata = {}) {
  const img = new webp.Image();
  const stickerPackId = 'ERIS-' + crypto.randomBytes(12).toString('hex').toUpperCase()
  const json = {
      "sticker-pack-id": stickerPackId,
      "sticker-pack-name": packname || 'Eris-MD',
      "sticker-pack-publisher": author || 'SinNombre',
      "emojis": categories
  };
  const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
  const exif = Buffer.concat([exifAttr, jsonBuffer]);
  exif.writeUIntLE(jsonBuffer.length, 14, 4);
  await img.load(webpSticker)
  img.exif = exif
  return await img.save(null)
}

// --- FUNCIÓN PRINCIPAL REHECHA ---
async function sticker(img, url, ...args) {
  let lastError, stiker
  // Priorizamos sticker6 para que los videos pesen poco
  const funcs = [
    global.support.ffmpeg && sticker6,
    sticker5
  ].filter(f => f)

  for (const func of funcs) {
    try {
      stiker = await func(img, url, ...args)
      if (Buffer.isBuffer(stiker)) {
          return await addExif(stiker, ...args)
      }
    } catch (err) {
      lastError = err
      continue
    }
  }
  return lastError
}

export { sticker, sticker6, addExif, support }
