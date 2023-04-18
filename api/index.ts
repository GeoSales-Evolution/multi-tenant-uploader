import * as contentDisposition from 'content-disposition'
import express from 'express'
import * as fs from 'fs'
import * as path from 'path'

const app = express()
const port: number = 3003

app.post('/upload', (req: express.Request, res: express.Response) => {
  if (req.headers['content-type'] === 'application/octet-stream') {
    let data: Buffer[] = []
    const filename: string = getFilename(req)

    req.on('data', (chunk: Buffer) => {
      data.push(chunk)
    })

    req.on('end', () => {
      fs.writeFile(path.join(__dirname, '../uploads/', filename), Buffer.concat(data), (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error(err)
          res.status(500).send('Error saving file')
        } else {
          console.log('File saved')
          res.end(`File ${filename} saved.`)
        }
      })
    })
  } else {
    res.status(400).end('Bad Request')
  }
})

app.listen(port, () => {
  console.log(`Express server listening on port ${port}`)
})

function getFilename(req: express.Request): string {
  const dispositionHeader: string | undefined = req.headers['content-disposition']
  const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
    ? contentDisposition.parse(dispositionHeader)
    : null

  return disposition?.parameters.filename || 'default-filename.txt'
}