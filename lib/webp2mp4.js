import fetch from 'node-fetch'
import { FormData, Blob } from 'formdata-node'
import { JSDOM } from 'jsdom'

/**
 * Convierte diferentes tipos de datos binarios a ArrayBuffer compatible para Blob.
 * Acepta Buffer, ArrayBuffer, Uint8Array.
 */
function toArrayBufferSafe(source) {
  if (!source) return null
  if (source instanceof ArrayBuffer) return source
  if (Buffer.isBuffer(source)) {
    return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
  }
  if (source instanceof Uint8Array) {
    return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength)
  }
  return null
}

async function webp2mp4(source) {
    let form = new FormData()
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
    const blob = !isUrl ? (new Blob([toArrayBufferSafe(source)])) : null
    // If source is a url, we set new-image-url. If it's binary, set new-image.
    if (isUrl) {
      form.append('new-image-url', source)
      form.append('new-image', '')
    } else {
      form.append('new-image-url', '')
      form.append('new-image', blob, 'image.webp')
    }

    let res = await fetch('https://ezgif.com/webp-to-mp4', {
        method: 'POST',
        body: form
    })
    let html = await res.text()
    let { document } = new JSDOM(html).window
    let form2 = new FormData()
    let obj = {}
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value
        form2.append(input.name, input.value)
    }
    let res2 = await fetch('https://ezgif.com/webp-to-mp4/' + obj.file, {
        method: 'POST',
        body: form2
    })
    let html2 = await res2.text()
    let { document: document2 } = new JSDOM(html2).window
    const src = document2.querySelector('div#output > p.outfile > video > source')
    if (!src) throw new Error('No se pudo obtener el resultado desde ezgif (webp->mp4)')
    return new URL(src.src, res2.url).toString()
}

async function webp2png(source) {
    let form = new FormData()
    let isUrl = typeof source === 'string' && /https?:\/\//.test(source)
    const blob = !isUrl ? (new Blob([toArrayBufferSafe(source)])) : null
    if (isUrl) {
      form.append('new-image-url', source)
      form.append('new-image', '')
    } else {
      form.append('new-image-url', '')
      form.append('new-image', blob, 'image.webp')
    }
    let res = await fetch('https://ezgif.com/webp-to-png', {
        method: 'POST',
        body: form
    })
    let html = await res.text()
    let { document } = new JSDOM(html).window
    let form2 = new FormData()
    let obj = {}
    for (let input of document.querySelectorAll('form input[name]')) {
        obj[input.name] = input.value
        form2.append(input.name, input.value)
    }
    let res2 = await fetch('https://ezgif.com/webp-to-png/' + obj.file, {
        method: 'POST',
        body: form2
    })
    let html2 = await res2.text()
    let { document: document2 } = new JSDOM(html2).window
    const img = document2.querySelector('div#output > p.outfile > img')
    if (!img) throw new Error('No se pudo obtener el resultado desde ezgif (webp->png)')
    return new URL(img.src, res2.url).toString()
}

export { webp2mp4, webp2png }
