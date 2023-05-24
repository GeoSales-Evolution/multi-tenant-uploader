import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import { config as dotenvConfig } from "dotenv-safe"
import getDocByTenant from '../db/db.js'
import uploadFile from '../drivers/driver_manager.js'

const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : '5mb'}))

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    try {
        if (req.headers['content-type'] !== 'application/octet-stream') {
            throw new Error('Bad Request')
        }

        const authHeader = req.headers['authorization']
        if (!authHeader) {
            throw new Error('Missing Authorization header')
        }

        const token = authHeader?.split(' ')[1]
        if (!token) {
            throw new Error('Missing bearer token')
        }

        const authParams = new URLSearchParams({
            token: token,
            tenant: req.params.tenant
        });

        const response = await fetch(`${authUrl}?${authParams}`)
        if (response.status !== 200) {
            throw new Error('Error fetching Authentication API')
        }

        const filename: string = getFilename(req)
        const tenantConfig = await getDocByTenant(req.params.tenant)
        const uploadJsonResponse = await uploadFile(tenantConfig, req.body, filename)
        res.status(200).send(`File ${filename} saved`)
    } catch (error: any) {
        console.error(error)
        if (error.message === 'Missing Authorization header' || error.message === 'Missing bearer token') {
            res.status(401).send(error.message)
        } else if (error.message === 'Bad Request') {
            res.status(400).send(error.message)
        } else {
            res.status(500).send(error.message)
        }
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
