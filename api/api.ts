import tenant2DriverMap from '../drivers/drivers.js'
import * as contentDisposition from 'content-disposition'
import * as dotenv from 'dotenv'
import express from 'express'
import * as fs from 'fs'
import * as path from 'path'

const app = express()

dotenv.config()

app.post('/upload/:token/:tenant', (req: express.Request, res: express.Response) => {
  if (req.headers['content-type'] === 'application/octet-stream') {
    let data: Buffer[] = []
    const filename: string = getFilename(req)
    const tenant: string = req.params.tenant

    const driver = tenant2DriverMap.get(tenant)

    req.on('data', (chunk: Buffer) => data.push(chunk))

    req.on('end', () => {
      fs.writeFile(`./uploads/${filename}`, Buffer.concat(data), (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error(err)
          res.status(500).send(`Error saving file ${filename}`)
        } else {
          console.log(`File ${filename} saved`)
          res.end(`File ${filename} saved.`)
        }
      })
    })
  } else {
    res.status(400).end('Bad Request')
  }
})

function getFilename(req: express.Request): string {
  const dispositionHeader: string | undefined = req.headers['content-disposition']
  const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
    ? contentDisposition.parse(dispositionHeader)
    : null

  return disposition?.parameters.filename || 'default-filename.txt'
}

export default app
