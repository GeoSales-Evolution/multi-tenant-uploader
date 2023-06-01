import express from 'express'
import * as contentDisposition from 'content-disposition'
import bodyParser from 'body-parser'
import { config as dotenvConfig } from "dotenv-safe"
import { getTenantConfig } from '../db/db.js'
import { initializeDriver, uploadFile } from '../drivers/driver_manager.js'

const MAX_SHARED_API_FILE_SIZE = '5mb'
const app = express()
app.use(bodyParser.raw({type: 'application/octet-stream', limit : MAX_SHARED_API_FILE_SIZE}))

dotenvConfig()

const authUrl = process.env.URL_AUTH_SERVICE;

app.post('/upload/:tenant', async (req: express.Request, res: express.Response) => {
    if (req.headers['content-type'] !== 'application/octet-stream') {
        console.error(`Bad Request at ${new Date()}`)
        res.status(400).send('Bad Request')
        return
    }

    const authHeader = req.headers['authorization']
    if (!authHeader) {
        console.error(`Missing Authorization header at ${new Date()}`)
        res.status(401).send('Missing Authorization header')
        return
    }

    const token = authHeader?.split(' ')[1]
    if (!token) {
        console.error(`Request missing bearer token at ${new Date()}`)
        res.status(401).send('Missing bearer token')
        return
    }

    const authParams = new URLSearchParams({
        token: token,
        tenant: req.params.tenant
    });

    const authResponse = await makeAuth(authUrl, authParams)

    if (authResponse.status !== 200) {
        console.error(`Error authenticating user. Caused by:\n${ 'errorMessage' in authResponse ? authResponse.errorMessage: null }\nat ${new Date()}`)
        res.status(authResponse.status).send('Error trying authentication.')
        return
    }

    const filename: string = getFilename(req)
    const tenantConfig = await getTenantConfig(req.params.tenant)

    if (!tenantConfig) {
        console.error(`Tenant not found at ${new Date()}`)
        res.status(404).send('Tenant not found.')
        return
    }

    if (!initializeDriver(tenantConfig)) {
        console.error(`Driver not found at ${new Date()}`)
        res.status(404).send('Driver not found.')
        return
    }

    const uploadJsonResponse = await uploadFile(req.body, filename)

    if ('error' in uploadJsonResponse) {
        console.error(`Error uploading file. at ${new Date()}\n${uploadJsonResponse.error}`)
        res.status(500).send('Error uploading file.')
        return
    }

    res.status(uploadJsonResponse.status).send(uploadJsonResponse)
    return
})

async function makeAuth(authUrl: string | undefined, authParams: URLSearchParams): Promise<AuthStatus | AuthError> {
    try {
      const response = await fetch(`${authUrl}?${authParams}`);
        return {status: response.status};
    } catch (error: any) {
        return {
            status: 500,
            errorMessage: error
        }
    }
}

function getFilename(req: express.Request): string {
    const dispositionHeader: string | undefined = req.headers['content-disposition']
    const disposition: contentDisposition.ContentDisposition | null = dispositionHeader
        ? contentDisposition.parse(dispositionHeader)
        : null

    return disposition?.parameters.filename || 'default-filename.txt'
}

export default app
