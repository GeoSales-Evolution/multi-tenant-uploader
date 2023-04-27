import express from 'express'
import * as contentDisposition from 'content-disposition'
import * as fs from 'fs'
import { config as dotenvConfig } from "dotenv-safe"

const app = express()
dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;

app.post('/upload/:token/:tenant', (req: express.Request, res: express.Response) => {
    if (req.headers['content-type'] === 'application/octet-stream') {
        const authParams = new URLSearchParams({
            token: req.params.token,
            tenant: req.params.tenant
        });

        let data: Buffer[] = [];
        const filename: string = getFilename(req);

        fetch(`${authUrl}?${authParams}`)
            .then((response) => {
                if (response.status == 200) {
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
                }
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
