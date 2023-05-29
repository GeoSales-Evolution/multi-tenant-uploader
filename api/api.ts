import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import authenticate from './auth.js'
import { initializeDriver, uploadFile, downloadFile } from '../drivers/driver_manager.js'
import { getTenantConfig } from "../db/db.js"

const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : '5mb'}))

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/octet-stream') {
        res.send({
            status: 400,
            error: 'Bad request'
        })
        return
    }

    const authHeader = req.headers['authorization']
    if (!authHeader) {
        res.send({
            status: 401,
            error: 'Missing Authorization header'
        })
        return
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        res.send({
            status: 401,
            error: 'Missing bearer token'
        })
        return
    }

    const authParams = new URLSearchParams({
        token: token,
        tenant: req.params.tenant
    });

    try {
        const authResponse: any = await authenticate(authParams)
        if (authResponse.status !== 200) {
            res.send({
                status: authResponse.status,
                error: 'Error fetching Authentication API'
            })
            return
        }

        const tenantConfig = await getTenantConfig(req.params.tenant)
        const filename: string = getFilename(req)

        initializeDriver(tenantConfig)

        const uploadJsonResponse = await uploadFile(req.body, filename)

        res.status(200).send(uploadJsonResponse)

    } catch (error: any) {
        console.error(error)
        res.status(500).send(error.message)
    }
})

app.get('/download/:tenant/:idFile', async (req: express.Request, res: express.Response) => {
    try {
        const authHeader = req.headers['authorization']
        if (!authHeader) {
            res.send({
                status: 401,
                error: 'Missing Authorization header'
            })
            return
        }
        const token = authHeader?.split(' ')[1]
        if (!token) {
            res.send({
                status: 401,
                error: 'Missing bearer token'
            })
            return
        }

        const authParams = new URLSearchParams({
            token: token,
            tenant: req.params.tenant
        });

        const authResponse: any = await authenticate(authParams)
        if (authResponse.status !== 200) {
            res.send({
                status: authResponse.status,
                error: 'Error fetching Authentication API'
            })
            return
        }

        const tenantConfig = await getTenantConfig(req.params.tenant)
        initializeDriver(tenantConfig)
        const linkDownload =  await downloadFile(req.params.idFile)
        res.send({linkDownload: linkDownload})
    } catch (error: any) {
        console.error(error)
        res.status(500).send(error.message)
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
