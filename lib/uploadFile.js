import fetch from 'node-fetch';
import {FormData, Blob} from 'formdata-node';
import {fileTypeFromBuffer} from 'file-type';

/**
 * Helper: convierte Buffer de Node a ArrayBuffer compatible con Blob
 */
function bufferToArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Upload epheremal file to file.io
 * `Expired in 1 day`
 * `100MB Max Filesize`
 * @param {Buffer} buffer File Buffer
 */
const fileIO = async (buffer) => {
  const {ext, mime} = await fileTypeFromBuffer(buffer) || {};
  const form = new FormData();
  const blob = new Blob([bufferToArrayBuffer(buffer)], {type: mime});
  form.append('file', blob, 'tmp.' + (ext || 'bin'));
  const res = await fetch('https://file.io/?expires=1d', { // 1 Day Expiry Date
    method: 'POST',
    body: form,
  });
  const json = await res.json();
  if (!json.success) throw json;
  return json.link;
};

/**
 * Upload file to storage.restfulapi.my.id
 * @param {Buffer|ReadableStream|(Buffer|ReadableStream)[]} inp File Buffer/Stream or Array of them
 * @return {string|null|(string|null)[]}
 */
const RESTfulAPI = async (inp) => {
  const form = new FormData();
  let buffers = inp;
  if (!Array.isArray(inp)) buffers = [inp];
  for (const buffer of buffers) {
    const blob = new Blob([bufferToArrayBuffer(buffer)]);
    form.append('file', blob);
  }
  const res = await fetch('https://storage.restfulapi.my.id/upload', {
    method: 'POST',
    body: form,
  });
  let json = await res.text();
  try {
    json = JSON.parse(json);
    if (!Array.isArray(inp)) return json.files[0].url;
    return json.files.map((res) => res.url);
  } catch (e) {
    throw json;
  }
};

/**
 *
 * @param {Buffer} inp
 * @return {Promise<string>}
 */
/*
export default async function(inp) {
  let err = false;
  for (const upload of [RESTfulAPI, fileIO]) {
    try {
      return await upload(inp);
    } catch (e) {
      err = e;
    }
  }
  if (err) throw err;
}
*/

/**
 * Función principal de subida (Nombrada para evitar errores de importación)
 */
const uploadFile = async (inp) => {
  let err = false;
  for (const upload of [RESTfulAPI, fileIO]) {
    try {
      return await upload(inp);
    } catch (e) {
      err = e;
    }
  }
  if (err) throw err;
};

// Exportamos de las dos formas para que cualquier plugin lo encuentre
export { uploadFile };
export default uploadFile;
