// inspired from https://github.com/nodejs/modules/issues/307#issuecomment-858729422

import Helper from './helper.js'

const WORKER_DIR = Helper.__dirname(import.meta.url, false)

/**
 * Carga dinámica de módulos respetando ESM y forzando recarga añadiendo query param
 * @template T
 * @param {string} module 
 * @returns {Promise<T>}
 */
export default async function importLoader(module) {
  // Convertir a path absoluto usando helper
  module = Helper.__filename(module)
  // Forzar recarga del módulo añadiendo query param único
  const module_ = await import(`${module}?id=${Date.now()}`)
  const result = module_ && 'default' in module_ ? module_.default : module_
  return result
}
