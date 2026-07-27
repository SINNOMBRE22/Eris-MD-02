import { join } from 'path'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import { google } from 'googleapis'
import { EventEmitter } from 'events'

const __dirname = global.__dirname ? global.__dirname(import.meta.url) : new URL('.', import.meta.url).pathname
const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']

const TOKEN_PATH = join(__dirname, '..', 'token.json')

class GoogleAuth extends EventEmitter {
  constructor(port = (process.env.PORT || 3000)) {
    super()
    this.port = port
  }

  /**
   * credentials: { client_id, client_secret, redirect_uris }
   * returns oAuth2Client with credentials set
   */
  async authorize(credentials) {
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web || credentials
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, `http://localhost:${this.port}`)
    try {
      let token
      try {
        token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf-8'))
      } catch (e) {
        // emit auth URL and wait for a 'token' event
        const authUrl = oAuth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: SCOPES
        })
        this.emit('auth', authUrl)
        const code = await promisify(this.once).bind(this)('token')
        const tokenRes = await oAuth2Client.getToken(code)
        token = tokenRes.tokens
        await fs.writeFile(TOKEN_PATH, JSON.stringify(token))
      } finally {
        oAuth2Client.setCredentials(token)
      }
      return oAuth2Client
    } catch (err) {
      throw err
    }
  }

  token(code) {
    this.emit('token', code)
  }
}

class GoogleDrive extends GoogleAuth {
  constructor(port) {
    super(port)
    this.path = '/drive/api'
    this.drive = null
  }

  async init(authClient) {
    this.drive = google.drive({ version: 'v3', auth: authClient })
  }

  async getFolderID(path) {
    // Implementación mínima: búsqueda por nombre (primer resultado)
    if (!this.drive) throw new Error('Google Drive client not initialized. Call init(authClient) first.')
    const res = await this.drive.files.list({
      q: `name='${path}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    })
    return res.data.files && res.data.files[0] ? res.data.files[0].id : null
  }

  async infoFile(fileId) {
    if (!this.drive) throw new Error('Google Drive client not initialized.')
    const res = await this.drive.files.get({
      fileId,
      fields: '*'
    })
    return res.data
  }

  async folderList(folderId) {
    if (!this.drive) throw new Error('Google Drive client not initialized.')
    const res = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size)',
      spaces: 'drive'
    })
    return res.data.files || []
  }

  async downloadFile(fileId) {
    if (!this.drive) throw new Error('Google Drive client not initialized.')
    const res = await this.drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'arraybuffer' })
    return Buffer.from(res.data)
  }

  async uploadFile(name, mimeType, buffer, parents = []) {
    if (!this.drive) throw new Error('Google Drive client not initialized.')
    const res = await this.drive.files.create({
      requestBody: {
        name,
        mimeType,
        parents
      },
      media: {
        mimeType,
        body: buffer
      },
      fields: 'id, name'
    })
    return res.data
  }
}

export { GoogleAuth, GoogleDrive }
